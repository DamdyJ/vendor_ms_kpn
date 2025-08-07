const db = require("../config/connection.js");
const Crud = require("../helper/crudquery.js");
const fs = require("fs");
const path = require("path");
const DBClientWrapper = require("../helper/DBClientWrapper.js");
const getMimeType = require("../helper/mimetype.js");
const xlsx = require("xlsx");
const toTsQuery = require("../helper/tsQuery.js");
const axios = require("axios");
const pool = require("../config/connection");
const saveToDatabase = require("../helper/sap_seeding");
const getCodeSortClause = require("../helper/sort.js");
const Emailer = require("./EmailModel");

const Material = {
    // Create a new material group
    createMaterialGroup: async groupData => {
        try {
            return await DBClientWrapper(async client => {
                const { code, name } = groupData;

                // Check if code already exists
                const existingCode = await client.query(
                    "SELECT id FROM mat_item_group WHERE code = $1",
                    [code]
                );

                if (existingCode.rows.length > 0) {
                    throw new Error("Group code already exists");
                }

                const now = new Date();
                const result = await client.query(
                    `INSERT INTO mat_item_group (code, name, created_at, updated_at)
                     VALUES ($1, $2, $3, $4)
                     RETURNING id, code, name`,
                    [code, name, now, now]
                );

                return result.rows[0];
            });
        } catch (error) {
            console.error("Error creating material group:", error);
            throw error;
        }
    },

    // Update material group
    updateMaterialGroup: async (groupId, groupData) => {
        try {
            return await DBClientWrapper(async client => {
                const { code, name } = groupData;

                // Check if code already exists for another group
                if (code) {
                    const existingCode = await client.query(
                        "SELECT id FROM mat_item_group WHERE code = $1 AND id != $2",
                        [code, groupId]
                    );

                    if (existingCode.rows.length > 0) {
                        throw new Error("Group code already exists");
                    }
                }

                const now = new Date();
                let query = "UPDATE mat_item_group SET updated_at = $1";
                const params = [now];
                let paramIndex = 2;

                if (code) {
                    query += `, code = $${paramIndex}`;
                    params.push(code);
                    paramIndex++;
                }

                if (name) {
                    query += `, name = $${paramIndex}`;
                    params.push(name);
                    paramIndex++;
                }

                query += ` WHERE id = $${paramIndex} RETURNING id, code, name`;
                params.push(groupId);

                const result = await client.query(query, params);

                if (result.rows.length === 0) {
                    throw new Error("Group not found");
                }

                return result.rows[0];
            });
        } catch (error) {
            console.error("Error updating material group:", error);
            throw error;
        }
    },

    // Delete material group (soft delete with cascade, no validation)
    deleteMaterialGroup: async (groupId, deletedBy) => {
        try {
            return await DBClientWrapper(async client => {
                await client.query("BEGIN");
                const now = new Date();
                // 1. Soft delete the group
                await client.query(
                    "UPDATE mat_item_group SET deleted_at = $1, deleted_by = $2 WHERE id = $3 AND deleted_at IS NULL",
                    [now, deletedBy, groupId]
                );
                // 2. Soft delete all subgroups under this group
                await client.query(
                    "UPDATE mat_item_sub_group SET deleted_at = $1, deleted_by = $2 WHERE item_group_id = $3 AND deleted_at IS NULL",
                    [now, deletedBy, groupId]
                );
                // 3. Get all subgroups under this group (including already soft deleted)
                const subgroupsRes = await client.query(
                    "SELECT id FROM mat_item_sub_group WHERE item_group_id = $1",
                    [groupId]
                );
                const subGroupIds = subgroupsRes.rows.map(row => row.id);
                if (subGroupIds.length > 0) {
                    // 4. Soft delete all materials under these subgroups
                    await client.query(
                        `UPDATE mat_sap_data SET dffromclient = true WHERE material_sub_group_id = ANY($1) AND (dffromclient IS NULL OR dffromclient = false)`,
                        [subGroupIds]
                    );
                }
                await client.query("COMMIT");
                return { id: groupId, deleted: true };
            });
        } catch (error) {
            console.error("Error soft deleting material group:", error);
            throw error;
        }
    },

    // Get all material groups
    getMaterialGroups: async (
        page,
        pageSize,
        searchQuery = "",
        sort = "code",
        order = "asc"
    ) => {
        try {
            return await DBClientWrapper(async client => {
                const offset = (page - 1) * pageSize;
                const searchPattern = searchQuery ? `%${searchQuery}%` : null;
                const sortField = getCodeSortClause("mig.code", order);
                // Only non-deleted groups
                const countQuery = searchPattern
                    ? await client.query(
                          `SELECT COUNT(*) as total FROM mat_item_group WHERE deleted_at IS NULL AND (code ILIKE $1 OR name ILIKE $1)`,
                          [searchPattern]
                      )
                    : await client.query(
                          `SELECT COUNT(*) as total FROM mat_item_group WHERE deleted_at IS NULL`
                      );
                const totalCount = parseInt(countQuery.rows[0].total);
                const queryText = searchPattern
                    ? `
                        SELECT
                            mig.id,
                            mig.code,
                            mig.name,
                            (SELECT COUNT(*) FROM mat_item_sub_group WHERE item_group_id = mig.id AND deleted_at IS NULL) as subgroups_count,
                            (
                                SELECT COUNT(*)
                                FROM mat_sap_data m
                                JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                                WHERE mis.item_group_id = mig.id AND mis.deleted_at IS NULL AND (m.dffromclient IS NULL OR m.dffromclient = false)
                            ) as materials_count
                        FROM mat_item_group mig
                        WHERE mig.deleted_at IS NULL AND (mig.code ILIKE $3 OR mig.name ILIKE $3)
                        ORDER BY ${sortField}
                        LIMIT $1 OFFSET $2
                    `
                    : `
                        SELECT
                            mig.id,
                            mig.code,
                            mig.name,
                            (SELECT COUNT(*) FROM mat_item_sub_group WHERE item_group_id = mig.id AND deleted_at IS NULL) as subgroups_count,
                            (
                                SELECT COUNT(*)
                                FROM mat_sap_data m
                                JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                                WHERE mis.item_group_id = mig.id AND mis.deleted_at IS NULL AND (m.dffromclient IS NULL OR m.dffromclient = false)
                            ) as materials_count
                        FROM mat_item_group mig
                        WHERE mig.deleted_at IS NULL
                        ORDER BY ${sortField}
                        LIMIT $1 OFFSET $2
                    `;
                const queryParams = searchPattern
                    ? [pageSize, offset, searchPattern]
                    : [pageSize, offset];
                const result = await client.query(queryText, queryParams);
                return {
                    data: result.rows,
                    pagination: {
                        totalCount,
                        totalPages: Math.ceil(totalCount / pageSize),
                    },
                };
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    // Get all material groups for dropdown (no pagination)
    getAllMaterialGroups: async (sort = "code", order = "asc") => {
        try {
            return await DBClientWrapper(async client => {
                const sortField = getCodeSortClause("code", order);
                const result = await client.query(`
                    SELECT
                        id,
                        code,
                        name
                    FROM mat_item_group
                    WHERE deleted_at IS NULL
                    ORDER BY ${sortField}
                `);
                return result.rows;
            });
        } catch (error) {
            console.error("Error getting all material groups:", error);
            throw error;
        }
    },

    // Get all subgroups for a group for dropdown (no pagination)
    getAllSubgroupsByGroup: async (groupId, sort = "code", order = "asc") => {
        try {
            return await DBClientWrapper(async client => {
                const sortField = getCodeSortClause("code", order);
                const result = await client.query(
                    `
                    SELECT
                        id,
                        code,
                        name,
                        item_group_id
                    FROM mat_item_sub_group
                    WHERE item_group_id = $1 AND deleted_at IS NULL
                    ORDER BY ${sortField}
                `,
                    [groupId]
                );
                return result.rows;
            });
        } catch (error) {
            console.error("Error getting all subgroups for group:", error);
            throw error;
        }
    },

    // Create a new material subgroup
    createMaterialSubGroup: async subGroupData => {
        try {
            return await DBClientWrapper(async client => {
                const { code, name, item_group_id } = subGroupData;

                // Check if group exists
                const groupCheck = await client.query(
                    "SELECT id FROM mat_item_group WHERE id = $1",
                    [item_group_id]
                );

                if (groupCheck.rows.length === 0) {
                    throw new Error("Parent group not found");
                }

                // Check if code already exists within this group
                const existingCode = await client.query(
                    "SELECT id FROM mat_item_sub_group WHERE code = $1 AND item_group_id = $2",
                    [code, item_group_id]
                );

                if (existingCode.rows.length > 0) {
                    throw new Error(
                        "Subgroup code already exists within this group"
                    );
                }

                const now = new Date();
                const result = await client.query(
                    `INSERT INTO mat_item_sub_group (code, name, item_group_id, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5)
                     RETURNING id, code, name, item_group_id`,
                    [code, name, item_group_id, now, now]
                );

                return result.rows[0];
            });
        } catch (error) {
            console.error("Error creating material subgroup:", error);
            throw error;
        }
    },

    // Update material subgroup
    updateMaterialSubGroup: async (subGroupId, subGroupData) => {
        try {
            return await DBClientWrapper(async client => {
                const { code, name, item_group_id } = subGroupData;

                // If changing group, check if new group exists
                if (item_group_id) {
                    const groupCheck = await client.query(
                        "SELECT id FROM mat_item_group WHERE id = $1",
                        [item_group_id]
                    );

                    if (groupCheck.rows.length === 0) {
                        throw new Error("Parent group not found");
                    }
                }

                // Get current subgroup data
                const currentSubgroup = await client.query(
                    "SELECT item_group_id FROM mat_item_sub_group WHERE id = $1",
                    [subGroupId]
                );

                if (currentSubgroup.rows.length === 0) {
                    throw new Error("Subgroup not found");
                }

                const currentGroupId =
                    item_group_id || currentSubgroup.rows[0].item_group_id;

                // Check if code already exists within the group for another subgroup
                if (code) {
                    const existingCode = await client.query(
                        "SELECT id FROM mat_item_sub_group WHERE code = $1 AND item_group_id = $2 AND id != $3",
                        [code, currentGroupId, subGroupId]
                    );

                    if (existingCode.rows.length > 0) {
                        throw new Error(
                            "Subgroup code already exists within this group"
                        );
                    }
                }

                const now = new Date();
                let query = "UPDATE mat_item_sub_group SET updated_at = $1";
                const params = [now];
                let paramIndex = 2;

                if (code) {
                    query += `, code = $${paramIndex}`;
                    params.push(code);
                    paramIndex++;
                }

                if (name) {
                    query += `, name = $${paramIndex}`;
                    params.push(name);
                    paramIndex++;
                }

                if (item_group_id) {
                    query += `, item_group_id = $${paramIndex}`;
                    params.push(item_group_id);
                    paramIndex++;
                }

                query += ` WHERE id = $${paramIndex} RETURNING id, code, name, item_group_id`;
                params.push(subGroupId);

                const result = await client.query(query, params);

                if (result.rows.length === 0) {
                    throw new Error("Subgroup not found");
                }

                return result.rows[0];
            });
        } catch (error) {
            console.error("Error updating material subgroup:", error);
            throw error;
        }
    },

    // Delete material subgroup (soft delete with cascade, no validation)
    deleteMaterialSubGroup: async (subGroupId, deletedBy) => {
        try {
            return await DBClientWrapper(async client => {
                await client.query("BEGIN");
                const now = new Date();
                // 1. Soft delete the subgroup
                await client.query(
                    "UPDATE mat_item_sub_group SET deleted_at = $1, deleted_by = $2 WHERE id = $3 AND deleted_at IS NULL",
                    [now, deletedBy, subGroupId]
                );
                // 2. Soft delete all materials under this subgroup
                await client.query(
                    `UPDATE mat_sap_data SET dffromclient = true WHERE material_sub_group_id = $1 AND (dffromclient IS NULL OR dffromclient = false)`,
                    [subGroupId]
                );
                await client.query("COMMIT");
                return { id: subGroupId, deleted: true };
            });
        } catch (error) {
            console.error("Error soft deleting material subgroup:", error);
            throw error;
        }
    },

    // Get subgroups by group ID
    getMaterialSubGroups: async (
        groupId,
        page = 1,
        pageSize = 10,
        searchQuery = "",
        sortField = "code",
        order = "asc"
    ) => {
        try {
            return await DBClientWrapper(async client => {
                const offset = (page - 1) * pageSize;
                const searchPattern = searchQuery ? `%${searchQuery}%` : null;

                // Build the where clause based on whether we have a search query
                let whereClause = "mis.item_group_id = $1";
                let countWhereClause = "mis.item_group_id = $1";
                let params = [groupId];
                let countParams = [groupId];

                if (searchPattern) {
                    whereClause +=
                        " AND (mis.code ILIKE $4 OR mis.name ILIKE $4)";
                    countWhereClause +=
                        " AND (mis.code ILIKE $2 OR mis.name ILIKE $2)";
                    params.push(pageSize, offset, searchPattern);
                    countParams.push(searchPattern);
                } else {
                    params.push(pageSize, offset);
                }

                // First get the total count with search filter if provided
                const countQuery = await client.query(
                    `
                    SELECT COUNT(*) as total
                    FROM mat_item_sub_group mis
                    WHERE ${countWhereClause}
                    `,
                    countParams
                );

                const totalCount = parseInt(countQuery.rows[0].total);
                const totalPages = Math.ceil(totalCount / pageSize);

                // Get the subgroups with pagination and search filter if provided
                const result = await client.query(
                    `
                    SELECT
                        mis.id,
                        mis.code,
                        mis.name,
                        mis.item_group_id,
                        mig.code as groupCode,
                        mig.name as groupName,
                        (SELECT COUNT(*) FROM mat_sap_data WHERE material_sub_group_id = mis.id) as materials_count
                    FROM mat_item_sub_group mis
                    JOIN mat_item_group mig ON mis.item_group_id = mig.id
                    WHERE ${whereClause}
                    ORDER BY ${sortField} ${order}
                    LIMIT $2 OFFSET $3
                `,
                    params
                );

                return {
                    data: result.rows,
                    pagination: {
                        totalCount,
                        totalPages,
                    },
                };
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    // Get materials by group ID
    getMaterialsByGroup: async (
        groupId,
        page = 1,
        pageSize = 10,
        sort = "code",
        order = "asc"
    ) => {
        try {
            return await DBClientWrapper(async client => {
                const offset = (page - 1) * pageSize;
                const sortField = getCodeSortClause("m.code", order);

                // First get the total count
                const countQuery = await client.query(
                    `
                    SELECT COUNT(*) as total
                    FROM mat_sap_data m
                    JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                    JOIN mat_item_group mig ON mis.item_group_id = mig.id
                    WHERE mig.id = $1 AND (m.approval_status IS NULL OR m.approval_status = 'approved')
                    `,
                    [groupId]
                );

                const totalCount = parseInt(countQuery.rows[0].total);
                const totalPages = Math.ceil(totalCount / pageSize);

                // Get group info
                const groupQuery = await client.query(
                    `SELECT id, code, name FROM mat_item_group WHERE id = $1`,
                    [groupId]
                );
                const groupDetails = groupQuery.rows[0] || null;

                // Get materials without attachments first
                const materialsQuery = await client.query(
                    `
                    SELECT
                        m.id,
                        m.code,
                        m.name,
                        m.description,
                        m.unit_of_measurement,
                        m.alias1,
                        m.alias2,
                        m.alias3,
                        m.filter_code_1,
                        m.filter_code_2,
                        m.created_at,
                        m.updated_at,
                        m.created_by,
                        mis.code as "subGroupCode",
                        mis.name as "subGroupName",
                        mig.code as "groupCode",
                        mig.name as "groupName",
                        m.code as "fullCode"
                    FROM mat_sap_data m
                    JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                    JOIN mat_item_group mig ON mis.item_group_id = mig.id
                    WHERE mig.id = $1 AND (m.approval_status IS NULL OR m.approval_status = 'approved')
                    ORDER BY ${sortField}
                    LIMIT $2 OFFSET $3
                    `,
                    [groupId, pageSize, offset]
                );

                // Get all material IDs to fetch attachments
                const materialIds = materialsQuery.rows.map(m => m.id);

                // Get attachments for these materials in a separate query
                const attachmentsQuery = await client.query(
                    `SELECT material_id, id, attachment, type
                     FROM mat_attachment
                     WHERE material_id = ANY($1)`,
                    [materialIds]
                );

                // Create a map of attachments by material_id
                const attachmentsByMaterialId = {};
                attachmentsQuery.rows.forEach(attachment => {
                    if (!attachmentsByMaterialId[attachment.material_id]) {
                        attachmentsByMaterialId[attachment.material_id] = [];
                    }
                    attachmentsByMaterialId[attachment.material_id].push({
                        id: attachment.id,
                        attachment: attachment.attachment,
                        type: attachment.type,
                    });
                });

                // Add attachments to each material
                const materialsWithAttachments = materialsQuery.rows.map(
                    material => ({
                        ...material,
                        attachments: attachmentsByMaterialId[material.id] || [],
                    })
                );

                return {
                    materials: materialsWithAttachments,
                    group: groupDetails,
                    pagination: {
                        page,
                        pageSize,
                        totalCount,
                        totalPages,
                    },
                };
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    // Get materials by subgroup ID
    getMaterialsBySubGroup: async (
        subGroupId,
        page = 1,
        pageSize = 10,
        searchQuery = "",
        sort = "code",
        order = "asc"
    ) => {
        try {
            return await DBClientWrapper(async client => {
                const offset = (page - 1) * pageSize;
                const searchPattern = searchQuery ? `%${searchQuery}%` : null;
                const sortField = getCodeSortClause("m.code", order);

                // Build where clause and params based on search query
                let whereClause =
                    "m.material_sub_group_id = $1 AND (m.approval_status IS NULL OR m.approval_status = 'approved')";
                let countWhereClause =
                    "m.material_sub_group_id = $1 AND (m.approval_status IS NULL OR m.approval_status = 'approved')";
                let countParams = [subGroupId];
                let materialParams = [subGroupId, pageSize, offset];

                if (searchPattern) {
                    countWhereClause +=
                        " AND (m.name ILIKE $2 OR m.description ILIKE $2 OR m.code ILIKE $2 OR COALESCE(m.alias1, '') ILIKE $2 OR COALESCE(m.alias2, '') ILIKE $2 OR COALESCE(m.alias3, '') ILIKE $2)";
                    whereClause +=
                        " AND (m.name ILIKE $4 OR m.description ILIKE $4 OR m.code ILIKE $4 OR COALESCE(m.alias1, '') ILIKE $4 OR COALESCE(m.alias2, '') ILIKE $4 OR COALESCE(m.alias3, '') ILIKE $4)";
                    countParams.push(searchPattern);
                    materialParams.push(searchPattern);
                }

                // First get the total count
                const countQuery = await client.query(
                    `
                    SELECT COUNT(*) as total
                    FROM mat_sap_data m
                    WHERE ${countWhereClause}
                    `,
                    countParams
                );

                const totalCount = parseInt(countQuery.rows[0].total);
                const totalPages = Math.ceil(totalCount / pageSize);

                // Get subgroup and group info
                const groupInfoQuery = await client.query(
                    `
                    SELECT
                        mis.id,
                        mis.code as subgroup_code,
                        mis.name as subgroup_name,
                        mis.item_group_id,
                        mig.id as group_id,
                        mig.code as group_code,
                        mig.name as group_name
                    FROM mat_item_sub_group mis
                    JOIN mat_item_group mig ON mis.item_group_id = mig.id
                    WHERE mis.id = $1
                    `,
                    [subGroupId]
                );

                // Build group and subgroup objects
                const groupInfo = groupInfoQuery.rows[0] || null;

                let group = null;
                let subgroup = null;

                if (groupInfo) {
                    group = {
                        id: groupInfo.group_id,
                        code: groupInfo.group_code,
                        name: groupInfo.group_name,
                    };

                    subgroup = {
                        id: groupInfo.id,
                        code: groupInfo.subgroup_code,
                        name: groupInfo.subgroup_name,
                        item_group_id: groupInfo.item_group_id,
                    };
                }

                // Get materials with search and pagination
                const materialsQuery = await client.query(
                    `
                    SELECT
                        m.id,
                        m.code,
                        m.name,
                        m.description,
                        m.long_text,
                        m.unit_of_measurement,
                        CASE
                            WHEN m.description IS NOT NULL AND m.long_text IS NOT NULL THEN CONCAT(m.description, ' - ', m.long_text)
                            WHEN m.description IS NOT NULL THEN m.description
                            WHEN m.long_text IS NOT NULL THEN m.long_text
                            ELSE NULL
                        END as combined_description,
                        m.alias1,
                        m.alias2,
                        m.alias3,
                        m.filter_code_1,
                        m.filter_code_2,
                        m.created_at,
                        m.updated_at,
                        m.dfFromClient,
                        m.created_by,
                        mis.code as "subGroupCode",
                        mis.name as "subGroupName",
                        mig.code as "groupCode",
                        mig.name as "groupName",
                        m.code as "fullCode"
                    FROM mat_sap_data m
                    JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                    JOIN mat_item_group mig ON mis.item_group_id = mig.id
                    WHERE ${whereClause}
                    ORDER BY ${sortField}
                    LIMIT $2 OFFSET $3
                    `,
                    materialParams
                );

                // Get all material IDs to fetch attachments
                const materialIds = materialsQuery.rows.map(m => m.id);

                // Skip attachment query if no materials
                if (materialIds.length === 0) {
                    return {
                        materials: [],
                        group,
                        subgroup,
                        pagination: {
                            page,
                            pageSize,
                            totalCount,
                            totalPages,
                        },
                    };
                }

                // Get attachments for these materials in a separate query
                const attachmentsQuery = await client.query(
                    `SELECT material_id, id, attachment, type
                     FROM mat_attachment
                     WHERE material_id = ANY($1)`,
                    [materialIds]
                );

                // Create a map of attachments by material_id
                const attachmentsByMaterialId = {};
                attachmentsQuery.rows.forEach(attachment => {
                    if (!attachmentsByMaterialId[attachment.material_id]) {
                        attachmentsByMaterialId[attachment.material_id] = [];
                    }
                    attachmentsByMaterialId[attachment.material_id].push({
                        id: attachment.id,
                        attachment: attachment.attachment,
                        type: attachment.type,
                    });
                });

                // Add attachments to each material
                const materialsWithAttachments = materialsQuery.rows.map(
                    material => ({
                        ...material,
                        attachments: attachmentsByMaterialId[material.id] || [],
                    })
                );

                return {
                    materials: materialsWithAttachments,
                    group,
                    subgroup,
                    pagination: {
                        page,
                        pageSize,
                        totalCount,
                        totalPages,
                    },
                };
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    // Search all materials (including deleted)
    searchAllMaterials: async (
        searchTerm,
        page = 1,
        pageSize = 10,
        sorting_state
    ) => {
        try {
            return await DBClientWrapper(async client => {
                let sorting_q = "";
                if (sorting_state) {
                    sorting_q = sorting_state.reduce((result, item) => {
                        result += `m.${item.col.toUpperCase()} ${item.state.toUpperCase()},`;
                        return result;
                    }, "");
                }
                console.log(sorting_q);
                const offset = (page - 1) * pageSize;
                const safeSearchTerm = String(searchTerm || "").trim();
                const toTsQuery = input =>
                    input
                        .trim()
                        .split(/\s+/)
                        .map(word => `${word}:*`)
                        .join(" & ");
                const isSearch = safeSearchTerm.length > 0;
                const tsQuery = toTsQuery(safeSearchTerm);
                const ilikeExact = safeSearchTerm;
                const ilikePartial = `%${safeSearchTerm}%`;
                let totalCount = 0;
                let materialsQueryResult = [];
                if (isSearch) {
                    const countRes = await client.query(
                        `SELECT COUNT(*) AS total
                        FROM mat_sap_data m
                        WHERE (approval_status IS NULL OR approval_status = 'approved')
                        AND ((to_tsvector('english', COALESCE(m.name, '') || ' ' || COALESCE(m.description, '') || ' ' || COALESCE(m.long_text, '') || ' ' || COALESCE(m.alias1, '') || ' ' || COALESCE(m.alias2, '') || ' ' || COALESCE(m.alias3, '') || ' ' || COALESCE(m.code, '')) @@ to_tsquery('english', $1))
                        OR (m.code ILIKE $2))`,
                        [tsQuery, ilikePartial]
                    );
                    totalCount = parseInt(countRes.rows[0].total);
                    const result = await client.query(
                        `SELECT
                            m.id,
                            m.code,
                            m.name,
                            m.description,
                            m.long_text,
                            m.unit_of_measurement,
                            CASE
                                WHEN m.description IS NOT NULL AND m.long_text IS NOT NULL THEN CONCAT(m.description, ' - ', m.long_text)
                                WHEN m.description IS NOT NULL THEN m.description
                                WHEN m.long_text IS NOT NULL THEN m.long_text
                                ELSE NULL
                            END AS combined_description,
                            m.alias1,
                            m.alias2,
                            m.alias3,
                            m.filter_code_1,
                            m.filter_code_2,
                            m.material_sub_group_id,
                            m.created_at,
                            m.updated_at,
                            m.dfFromClient,
                            m.created_by,
                            mis.code AS "subGroupCode",
                            mis.name AS "subGroupName",
                            mig.code AS "groupCode",
                            mig.name AS "groupName",
                            ts_rank_cd(
                                setweight(to_tsvector(COALESCE(m.name, '')), 'A') ||
                                setweight(to_tsvector(COALESCE(m.description, '')), 'B') ||
                                setweight(to_tsvector(COALESCE(m.long_text, '')), 'C') ||
                                setweight(to_tsvector(COALESCE(m.alias1, '')), 'D'),
                                to_tsquery('english', $1)
                            ) AS rank,
                            CASE
                                WHEN m.code ILIKE $2 THEN 1
                                WHEN m.code ILIKE $3 THEN 2
                                ELSE 3
                            END AS code_match_rank
                        FROM mat_sap_data m
                        JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                        JOIN mat_item_group mig ON mis.item_group_id = mig.id
                        WHERE (approval_status IS NULL OR approval_status = 'approved')
                        AND ((to_tsvector('english', COALESCE(m.name, '') || ' ' || COALESCE(m.description, '') || ' ' || COALESCE(m.long_text, '') || ' ' || COALESCE(m.alias1, '') || ' ' || COALESCE(m.alias2, '') || ' ' || COALESCE(m.alias3, '') || ' ' || COALESCE(m.code, '')) @@ to_tsquery('english', $1))
                        OR (m.code ILIKE $2))
                        ORDER BY ${sorting_q}code_match_rank, rank DESC, m.name ASC
                        LIMIT $4 OFFSET $5`,
                        [tsQuery, ilikeExact, ilikePartial, pageSize, offset]
                    );
                    materialsQueryResult = result.rows;
                } else {
                    const countRes = await client.query(
                        `SELECT COUNT(*) AS total FROM mat_sap_data WHERE (approval_status IS NULL OR approval_status = 'approved')`
                    );
                    totalCount = parseInt(countRes.rows[0].total);
                    const result = await client.query(
                        `SELECT
                            m.id,
                            m.code,
                            m.name,
                            m.description,
                            m.long_text,
                            m.unit_of_measurement,
                            CASE
                                WHEN m.description IS NOT NULL AND m.long_text IS NOT NULL THEN CONCAT(m.description, ' - ', m.long_text)
                                WHEN m.description IS NOT NULL THEN m.description
                                WHEN m.long_text IS NOT NULL THEN m.long_text
                                ELSE NULL
                            END AS combined_description,
                            m.alias1,
                            m.alias2,
                            m.alias3,
                            m.filter_code_1,
                            m.filter_code_2,
                            m.material_sub_group_id,
                            m.created_at,
                            m.updated_at,
                            m.dfFromClient,
                            m.created_by,
                            mis.code AS "subGroupCode",
                            mis.name AS "subGroupName",
                            mig.code AS "groupCode",
                            mig.name AS "groupName"
                        FROM mat_sap_data m
                        JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                        JOIN mat_item_group mig ON mis.item_group_id = mig.id
                        WHERE (m.approval_status IS NULL OR m.approval_status = 'approved')
                        ORDER BY ${sorting_q}m.code ASC, m.name ASC
                        LIMIT $1 OFFSET $2`,
                        [pageSize, offset]
                    );
                    materialsQueryResult = result.rows;
                }
                const materialIds = materialsQueryResult.map(m => m.id);
                const attachmentsMap =
                    await Material.getAttachmentsByMaterialIds(
                        client,
                        materialIds
                    );
                const finalMaterials = materialsQueryResult.map(material => ({
                    ...material,
                    attachments: attachmentsMap[material.id] || [],
                }));
                return {
                    materials: finalMaterials,
                    pagination: {
                        page,
                        pageSize,
                        totalCount,
                        totalPages: Math.ceil(totalCount / pageSize),
                    },
                };
            });
        } catch (error) {
            console.error("Search all error:", error);
            throw error;
        }
    },

    // Update searchMaterials to only return non-deleted materials
    searchMaterials: async (searchTerm, page = 1, pageSize = 10) => {
        try {
            return await DBClientWrapper(async client => {
                let sorting_q = "";
                const offset = (page - 1) * pageSize;
                const safeSearchTerm = String(searchTerm || "").trim();
                const toTsQuery = input =>
                    input
                        .trim()
                        .split(/\s+/)
                        .map(word => `${word}:*`)
                        .join(" & ");
                const isSearch = safeSearchTerm.length > 0;
                const tsQuery = toTsQuery(safeSearchTerm);
                const ilikeExact = safeSearchTerm;
                const ilikePartial = `%${safeSearchTerm}%`;
                let totalCount = 0;
                let materialsQueryResult = [];
                if (isSearch) {
                    const countRes = await client.query(
                        `SELECT COUNT(*) AS total
                        FROM mat_sap_data m
                        WHERE (dffromclient IS NULL OR dffromclient = false)
                        AND (approval_status IS NULL OR approval_status = 'approved')
                        AND ((to_tsvector('english', COALESCE(m.name, '') || ' ' || COALESCE(m.description, '') || ' ' || COALESCE(m.long_text, '') || ' ' || COALESCE(m.alias1, '') || ' ' || COALESCE(m.alias2, '') || ' ' || COALESCE(m.alias3, '') || ' ' || COALESCE(m.code, '')) @@ to_tsquery('english', $1))
                        OR (m.code ILIKE $2))`,
                        [tsQuery, ilikePartial]
                    );
                    totalCount = parseInt(countRes.rows[0].total);
                    const result = await client.query(
                        `SELECT
                            m.id,
                            m.code,
                            m.name,
                            m.description,
                            m.long_text,
                            CASE
                                WHEN m.description IS NOT NULL AND m.long_text IS NOT NULL THEN CONCAT(m.description, ' - ', m.long_text)
                                WHEN m.description IS NOT NULL THEN m.description
                                WHEN m.long_text IS NOT NULL THEN m.long_text
                                ELSE NULL
                            END AS combined_description,
                            m.alias1,
                            m.alias2,
                            m.alias3,
                            m.filter_code_1,
                            m.filter_code_2,
                            m.material_sub_group_id,
                            m.created_at,
                            m.updated_at,
                            m.dfFromClient,
                            m.created_by,
                            mis.code AS "subGroupCode",
                            mis.name AS "subGroupName",
                            mig.code AS "groupCode",
                            mig.name AS "groupName",
                            ts_rank_cd(
                                setweight(to_tsvector(COALESCE(m.name, '')), 'A') ||
                                setweight(to_tsvector(COALESCE(m.description, '')), 'B') ||
                                setweight(to_tsvector(COALESCE(m.long_text, '')), 'C') ||
                                setweight(to_tsvector(COALESCE(m.alias1, '')), 'D'),
                                to_tsquery('english', $1)
                            ) AS rank,
                            CASE
                                WHEN m.code ILIKE $2 THEN 1
                                WHEN m.code ILIKE $3 THEN 2
                                ELSE 3
                            END AS code_match_rank
                        FROM mat_sap_data m
                        JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                        JOIN mat_item_group mig ON mis.item_group_id = mig.id
                        WHERE (dffromclient IS NULL OR dffromclient = false)
                        AND (approval_status IS NULL OR approval_status = 'approved')
                        AND ((to_tsvector('english', COALESCE(m.name, '') || ' ' || COALESCE(m.description, '') || ' ' || COALESCE(m.long_text, '') || ' ' || COALESCE(m.alias1, '') || ' ' || COALESCE(m.alias2, '') || ' ' || COALESCE(m.alias3, '') || ' ' || COALESCE(m.code, '')) @@ to_tsquery('english', $1))
                        OR (m.code ILIKE $2))
                        ORDER BY code_match_rank, rank DESC, m.name ASC ${sorting_q}
                        LIMIT $4 OFFSET $5`,
                        [tsQuery, ilikeExact, ilikePartial, pageSize, offset]
                    );
                    materialsQueryResult = result.rows;
                } else {
                    const countRes = await client.query(
                        `SELECT COUNT(*) AS total FROM mat_sap_data WHERE (dffromclient IS NULL OR dffromclient = false) AND (approval_status IS NULL OR approval_status = 'approved')`
                    );
                    totalCount = parseInt(countRes.rows[0].total);
                    const result = await client.query(
                        `SELECT
                            m.id,
                            m.code,
                            m.name,
                            m.description,
                            m.long_text,
                            m.unit_of_measurement,
                            CASE
                                WHEN m.description IS NOT NULL AND m.long_text IS NOT NULL THEN CONCAT(m.description, ' - ', m.long_text)
                                WHEN m.description IS NOT NULL THEN m.description
                                WHEN m.long_text IS NOT NULL THEN m.long_text
                                ELSE NULL
                            END AS combined_description,
                            m.alias1,
                            m.alias2,
                            m.alias3,
                            m.filter_code_1,
                            m.filter_code_2,
                            m.material_sub_group_id,
                            m.created_at,
                            m.updated_at,
                            m.dfFromClient,
                            m.created_by,
                            mis.code AS "subGroupCode",
                            mis.name AS "subGroupName",
                            mig.code AS "groupCode",
                            mig.name AS "groupName"
                        FROM mat_sap_data m
                        JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                        JOIN mat_item_group mig ON mis.item_group_id = mig.id
                        WHERE (dffromclient IS NULL OR dffromclient = false) AND (approval_status IS NULL OR approval_status = 'approved')
                        ORDER BY m.code ASC, m.name ASC
                        LIMIT $1 OFFSET $2`,
                        [pageSize, offset]
                    );
                    materialsQueryResult = result.rows;
                }
                const materialIds = materialsQueryResult.map(m => m.id);
                const attachmentsMap =
                    await Material.getAttachmentsByMaterialIds(
                        client,
                        materialIds
                    );
                const finalMaterials = materialsQueryResult.map(material => ({
                    ...material,
                    attachments: attachmentsMap[material.id] || [],
                }));
                return {
                    materials: finalMaterials,
                    pagination: {
                        page,
                        pageSize,
                        totalCount,
                        totalPages: Math.ceil(totalCount / pageSize),
                    },
                };
            });
        } catch (error) {
            console.error("Search error:", error);
            throw error;
        }
    },

    // Utility: Fetch and group attachments
    getAttachmentsByMaterialIds: async (client, ids) => {
        if (!ids.length) return {};
        const res = await client.query(
            `SELECT material_id, id, attachment, type FROM mat_attachment WHERE material_id = ANY($1)`,
            [ids]
        );
        const map = {};
        res.rows.forEach(({ material_id, ...rest }) => {
            if (!map[material_id]) map[material_id] = [];
            map[material_id].push(rest);
        });
        return map;
    },

    // Get material by ID with full details
    getMaterialById: async materialId => {
        try {
            return await DBClientWrapper(async client => {
                const result = await client.query(
                    `
                    SELECT
                        m.id,
                        m.code,
                        m.name,
                        m.description,
                        m.unit_of_measurement,
                        m.alias1,
                        m.alias2,
                        m.alias3,
                        m.filter_code_1,
                        m.filter_code_2,
                        m.created_at,
                        m.updated_at,
                        m.dfFromClient,
                        mis.id as "subGroupId",
                        mis.code as "subGroupCode",
                        mis.name as "subGroupName",
                        mig.id as "groupId",
                        mig.code as "groupCode",
                        mig.name as "groupName",
                        m.code as "fullCode"
                    FROM mat_sap_data m
                    JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                    JOIN mat_item_group mig ON mis.item_group_id = mig.id
                    WHERE m.id = $1
                `,
                    [materialId]
                );
                return result.rows[0];
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    },

    getMaterialAttachments: async materialId => {
        try {
            return await DBClientWrapper(async client => {
                const result = await client.query(
                    `SELECT id, attachment, type, material_id
                    FROM mat_attachment
                    WHERE material_id = $1
                    ORDER BY id`,
                    [materialId]
                );
                return result.rows;
            });
        } catch (error) {
            console.error("Error fetching material attachments:", error);
            throw error;
        }
    },

    addAttachment: async (
        materialId,
        fileInfoArray,
        updatedBy,
        userRole,
        userName
    ) => {
        const uploadedFiles = [];
        const cleanupFiles = [];

        try {
            return await DBClientWrapper(async client => {
                await client.query("BEGIN");

                try {
                    // Check current attachment count
                    const attachmentCountQuery = await client.query(
                        "SELECT COUNT(*) as count FROM mat_attachment WHERE material_id = $1",
                        [materialId]
                    );

                    const currentAttachmentCount = parseInt(
                        attachmentCountQuery.rows[0].count
                    );
                    const MAX_ATTACHMENTS = 3;

                    if (currentAttachmentCount >= MAX_ATTACHMENTS) {
                        throw new Error(
                            `Maximum number of attachments (${MAX_ATTACHMENTS}) reached for this material`
                        );
                    }

                    // Calculate how many more attachments we can add
                    const availableSlots =
                        MAX_ATTACHMENTS - currentAttachmentCount;

                    if (fileInfoArray.length > availableSlots) {
                        throw new Error(
                            `Can only add ${availableSlots} more attachment(s). Maximum of ${MAX_ATTACHMENTS} attachments allowed per material.`
                        );
                    }

                    // 1. Add attachments to database
                    for (const file of fileInfoArray) {
                        // Determine MIME type from extension
                        const mimeType = getMimeType(file.extension);

                        // Use Crud helper to generate insert query
                        const insertData = {
                            material_id: materialId,
                            attachment: file.newName,
                            type: mimeType,
                            created_at: "NOW()",
                            updated_at: "NOW()",
                        };

                        const [query, values] = Crud.insertItem(
                            "mat_attachment",
                            insertData,
                            "id"
                        );

                        const result = await client.query(query, values);

                        uploadedFiles.push({
                            id: result.rows[0].id,
                            originalName: file.originalName,
                            savedAs: file.newName,
                            type: mimeType,
                        });
                    }

                    // Get material details for mat_reqedit logging
                    const materialDetailQuery = await client.query(
                        "SELECT code, name FROM mat_sap_data WHERE id = $1",
                        [materialId]
                    );

                    const materialDetail = materialDetailQuery.rows[0];

                    if (userRole !== "MDM_MATERIAL") {
                        for (const file of fileInfoArray) {
                            const reqEditInsert = {
                                material_code: materialDetail.code,
                                material_name: materialDetail.name,
                                attachment_path: file.newName,
                                processed: false,
                                created_at: "NOW()",
                                edited_by: userName,
                            };

                            const [reqEditQuery, reqEditValues] =
                                Crud.insertItem("mat_reqedit", reqEditInsert);

                            await client.query(reqEditQuery, reqEditValues);
                        }
                    }

                    const updateData = {
                        updated_at: "NOW()",
                        updated_by: updatedBy || null,
                    };

                    const whereCondition = {
                        id: materialId,
                    };

                    const [query, values] = Crud.updateItem(
                        "mat_sap_data",
                        updateData,
                        whereCondition
                    );

                    await client.query(query, values);

                    // Commit transaction
                    await client.query("COMMIT");

                    // 3. After successful database operations, save files to disk
                    for (const file of fileInfoArray) {
                        const publicDir = path.join(
                            path.resolve(),
                            "./backend/public"
                        );

                        // Ensure public directory exists
                        if (!fs.existsSync(publicDir)) {
                            fs.mkdirSync(publicDir, { recursive: true });
                        }

                        const finalPath = path.join(publicDir, file.newName);
                        cleanupFiles.push(finalPath);

                        // Read from temp location and write to final location
                        const rawData = fs.readFileSync(file.tempPath);
                        fs.writeFileSync(finalPath, rawData);
                    }

                    return {
                        success: true,
                        files: uploadedFiles,
                    };
                } catch (error) {
                    // Rollback transaction on error
                    await client.query("ROLLBACK");

                    for (const filePath of cleanupFiles) {
                        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    }

                    throw error;
                }
            });
        } catch (error) {
            console.error("Error processing attachment upload:", error);
            throw error;
        }
    },

    updateMaterialTimestamp: async (materialId, updatedBy) => {
        try {
            return await DBClientWrapper(async client => {
                // Create data object for update
                const updateData = {
                    updated_at: "NOW()",
                    updated_by: updatedBy || null,
                };

                // Create where condition
                const whereCondition = {
                    id: materialId,
                };

                // Use Crud helper to generate query
                const [query, values] = Crud.updateItem(
                    "mat_sap_data",
                    updateData,
                    whereCondition
                );

                const result = await client.query(query, values);

                if (result.rowCount === 0) {
                    throw new Error("Material not found or no changes made");
                }

                return {
                    materialId,
                    updatedBy: updatedBy || null,
                    updated: true,
                };
            });
        } catch (error) {
            console.error("Error updating material timestamp:", error);
            throw error;
        }
    },

    updateAliasesOnly: async (
        materialId,
        alias1,
        alias2,
        alias3,
        userRole,
        userName
    ) => {
        try {
            return await DBClientWrapper(async client => {
                await client.query("BEGIN");

                try {
                    // Get current material details for comparison and tracking
                    const materialDetailQuery = await client.query(
                        "SELECT code, name, alias1, alias2, alias3 FROM mat_sap_data WHERE id = $1",
                        [materialId]
                    );

                    if (materialDetailQuery.rows.length === 0) {
                        throw new Error("Material not found");
                    }

                    const materialDetail = materialDetailQuery.rows[0];

                    // Create data object for update
                    const updateData = {
                        alias1: alias1 || null,
                        alias2: alias2 || null,
                        alias3: alias3 || null,
                    };

                    // Create where condition
                    const whereCondition = {
                        id: materialId,
                    };

                    // Use Crud helper to generate query
                    const [query, values] = Crud.updateItem(
                        "mat_sap_data",
                        updateData,
                        whereCondition
                    );

                    const result = await client.query(query, values);

                    if (result.rowCount === 0) {
                        throw new Error(
                            "Material not found or no changes made"
                        );
                    }

                    // Track alias changes for non-MDM_MATERIAL users
                    if (userRole !== "MDM_MATERIAL") {
                        const aliasChanges = [];

                        if (materialDetail.alias1 !== (alias1 || null)) {
                            aliasChanges.push(
                                `Alias1: "${materialDetail.alias1 || ""}" → "${
                                    alias1 || ""
                                }"`
                            );
                        }
                        if (materialDetail.alias2 !== (alias2 || null)) {
                            aliasChanges.push(
                                `Alias2: "${materialDetail.alias2 || ""}" → "${
                                    alias2 || ""
                                }"`
                            );
                        }
                        if (materialDetail.alias3 !== (alias3 || null)) {
                            aliasChanges.push(
                                `Alias3: "${materialDetail.alias3 || ""}" → "${
                                    alias3 || ""
                                }"`
                            );
                        }

                        if (aliasChanges.length > 0) {
                            const reqEditInsert = {
                                material_code: materialDetail.code,
                                material_name: materialDetail.name,
                                attachment_path: null,
                                edited_alias: aliasChanges.join("; "),
                                processed: false,
                                created_at: "NOW()",
                                edited_by: userName,
                            };

                            const [reqEditQuery, reqEditValues] =
                                Crud.insertItem("mat_reqedit", reqEditInsert);

                            await client.query(reqEditQuery, reqEditValues);
                        }
                    }

                    await client.query("COMMIT");

                    return {
                        materialId,
                        alias1: alias1 || null,
                        alias2: alias2 || null,
                        alias3: alias3 || null,
                        updated: true,
                    };
                } catch (error) {
                    await client.query("ROLLBACK");
                    throw error;
                }
            });
        } catch (error) {
            console.error("Error updating aliases:", error);
            throw error;
        }
    },

    deleteAttachment: async (attachmentId, updatedBy) => {
        try {
            return await DBClientWrapper(async client => {
                // Begin transaction
                await client.query("BEGIN");

                try {
                    // Get attachment details to get the file path
                    const attachmentQuery = await client.query(
                        "SELECT id, material_id, attachment FROM mat_attachment WHERE id = $1",
                        [attachmentId]
                    );

                    if (attachmentQuery.rows.length === 0) {
                        throw new Error("Attachment not found");
                    }

                    const attachment = attachmentQuery.rows[0];
                    const materialId = attachment.material_id;
                    const filename = attachment.attachment;

                    // Delete the attachment from the database
                    await client.query(
                        "DELETE FROM mat_attachment WHERE id = $1",
                        [attachmentId]
                    );

                    // Update the material's updated_at timestamp
                    await client.query(
                        "UPDATE mat_sap_data SET updated_at = NOW(), updated_by = $1 WHERE id = $2",
                        [updatedBy || null, materialId]
                    );

                    // Commit transaction
                    await client.query("COMMIT");

                    // Try to delete the file from disk (but don't fail if this fails)
                    try {
                        const publicDir = path.join(
                            path.resolve(),
                            "./backend/public"
                        );
                        const filePath = path.join(publicDir, filename);

                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                        }
                    } catch (fileError) {
                        console.error(
                            "Error deleting attachment file:",
                            fileError
                        );
                        // Don't throw here, we've already committed the DB changes
                    }

                    return {
                        success: true,
                        materialId,
                        attachmentId,
                    };
                } catch (error) {
                    // Rollback transaction on error
                    await client.query("ROLLBACK");
                    throw error;
                }
            });
        } catch (error) {
            console.error("Error deleting attachment:", error);
            throw error;
        }
    },

    // Export only groups to Excel
    exportOnlyGroupsToExcel: async () => {
        try {
            return await DBClientWrapper(async client => {
                // Query to get all groups
                const groupsResult = await client.query(`
                    SELECT
                        id,
                        code as group_code,
                        name as group_name
                    FROM mat_item_group
                    ORDER BY code
                `);

                // Create the export data for the "Groups" sheet
                const groupsData = groupsResult.rows.map(group => ({
                    "Group Code": group.group_code,
                    "Group Name": group.group_name,
                }));

                // Create a new workbook
                const workbook = xlsx.utils.book_new();

                // Add Groups worksheet
                const groupsWorksheet = xlsx.utils.json_to_sheet(groupsData);
                xlsx.utils.book_append_sheet(
                    workbook,
                    groupsWorksheet,
                    "Groups"
                );

                // Create buffer
                const buffer = xlsx.write(workbook, {
                    type: "buffer",
                    bookType: "xlsx",
                });

                return buffer;
            });
        } catch (error) {
            console.error("Error exporting groups to Excel:", error);
            throw error;
        }
    },

    // Export only subgroups to Excel
    exportOnlySubgroupsToExcel: async (groupId = null) => {
        try {
            return await DBClientWrapper(async client => {
                // Build the query based on whether we have a group ID
                let queryText;
                let queryParams = [];

                if (groupId) {
                    queryText = `
                        SELECT
                            s.id,
                            s.code as subgroup_code,
                            s.name as subgroup_name,
                            s.item_group_id,
                            g.code as group_code,
                            g.name as group_name
                        FROM mat_item_sub_group s
                        JOIN mat_item_group g ON s.item_group_id = g.id
                        WHERE s.item_group_id = $1
                        ORDER BY s.code
                    `;
                    queryParams.push(groupId);
                } else {
                    queryText = `
                        SELECT
                            s.id,
                            s.code as subgroup_code,
                            s.name as subgroup_name,
                            s.item_group_id,
                            g.code as group_code,
                            g.name as group_name
                        FROM mat_item_sub_group s
                        JOIN mat_item_group g ON s.item_group_id = g.id
                        ORDER BY g.code, s.code
                    `;
                }

                const subgroupsResult = await client.query(
                    queryText,
                    queryParams
                );

                // Create the export data for the "Subgroups" sheet
                const subgroupsData = subgroupsResult.rows.map(subgroup => ({
                    "Subgroup Code": subgroup.subgroup_code,
                    "Subgroup Name": subgroup.subgroup_name,
                    "Group Code": subgroup.group_code,
                    "Group Name": subgroup.group_name,
                }));

                // Create a new workbook
                const workbook = xlsx.utils.book_new();

                // Add Subgroups worksheet
                const subgroupsWorksheet =
                    xlsx.utils.json_to_sheet(subgroupsData);
                xlsx.utils.book_append_sheet(
                    workbook,
                    subgroupsWorksheet,
                    "Subgroups"
                );

                // Create buffer
                const buffer = xlsx.write(workbook, {
                    type: "buffer",
                    bookType: "xlsx",
                });

                return buffer;
            });
        } catch (error) {
            console.error("Error exporting subgroups to Excel:", error);
            throw error;
        }
    },

    // Import only groups from Excel
    importOnlyGroupsFromExcel: async (fileBuffer, userId) => {
        let client;
        try {
            // Get a client from the pool directly instead of using DBClientWrapper
            client = await db.connect();

            // Begin transaction
            await client.query("BEGIN");

            try {
                // Parse Excel file
                const workbook = xlsx.read(fileBuffer, { type: "buffer" });

                // Check if Groups sheet exists
                if (!workbook.SheetNames.includes("Groups")) {
                    throw new Error("Excel file must contain a 'Groups' sheet");
                }

                // Get Groups sheet data
                const groupsSheet = workbook.Sheets["Groups"];
                const groupsData = xlsx.utils.sheet_to_json(groupsSheet);

                // Statistics for operation
                const stats = {
                    total: groupsData.length,
                    created: 0,
                    updated: 0,
                    skipped: 0,
                    errors: [],
                };

                // Process each group in a try-catch block to prevent one error from failing the entire transaction
                for (const group of groupsData) {
                    try {
                        // Try multiple possible column naming formats since Excel exports can be inconsistent
                        // Check if column name is different than expected
                        const code = String(
                            group["Group Code"] ||
                                group["group_code"] ||
                                group["GroupCode"] ||
                                group["groupCode"] ||
                                group["group code"] ||
                                group["code"] ||
                                ""
                        ).trim();

                        const name = String(
                            group["Group Name"] ||
                                group["group_name"] ||
                                group["GroupName"] ||
                                group["groupName"] ||
                                group["group name"] ||
                                group["name"] ||
                                ""
                        ).trim();

                        // Skip empty rows
                        if (!code && !name) {
                            stats.skipped++;
                            continue;
                        }

                        // Validate required fields
                        if (!code || !name) {
                            throw new Error(
                                `Missing required fields. Group Code: ${code}, Group Name: ${name}`
                            );
                        }

                        // Check if group already exists
                        const existingGroup = await client.query(
                            "SELECT id FROM mat_item_group WHERE code = $1",
                            [code]
                        );

                        const now = new Date();

                        if (existingGroup.rows.length > 0) {
                            // Update existing group
                            const groupId = existingGroup.rows[0].id;
                            await client.query(
                                `UPDATE mat_item_group
                                SET name = $1, updated_at = $2, updated_by = $3
                                WHERE id = $4`,
                                [name, now, userId, groupId]
                            );
                            stats.updated++;
                        } else {
                            await client.query(
                                `INSERT INTO mat_item_group (code, name, created_at, updated_at, created_by, updated_by)
                                VALUES ($1, $2, $3, $4, $5, $6)
                                RETURNING id`,
                                [code, name, now, now, userId, userId]
                            );
                            stats.created++;
                        }
                    } catch (error) {
                        // Log the error but continue processing other groups
                        stats.errors.push({
                            row: JSON.stringify(group),
                            error: error.message,
                        });
                    }
                }

                // Commit transaction only if there were no errors or if some records were successful
                if (
                    stats.errors.length === 0 ||
                    stats.created > 0 ||
                    stats.updated > 0
                ) {
                    await client.query("COMMIT");
                } else {
                    // Rollback if nothing was processed successfully
                    await client.query("ROLLBACK");
                }

                return stats;
            } catch (error) {
                // Ensure rollback happens on any error
                if (client) {
                    await client.query("ROLLBACK");
                }
                throw error;
            }
        } catch (error) {
            throw error;
        } finally {
            // Always release the client back to the pool
            if (client) {
                client.release();
            }
        }
    },

    // Import only subgroups from Excel
    importOnlySubgroupsFromExcel: async (fileBuffer, userId) => {
        let client;
        try {
            // Get a client from the pool directly instead of using DBClientWrapper
            client = await db.connect();

            // Begin transaction
            await client.query("BEGIN");

            try {
                // Parse Excel file
                const workbook = xlsx.read(fileBuffer, { type: "buffer" });

                // Check if Subgroups sheet exists
                if (!workbook.SheetNames.includes("Subgroups")) {
                    throw new Error(
                        "Excel file must contain a 'Subgroups' sheet"
                    );
                }

                // Get Subgroups sheet data
                const subgroupsSheet = workbook.Sheets["Subgroups"];
                const subgroupsData = xlsx.utils.sheet_to_json(subgroupsSheet);

                // Statistics for operation
                const stats = {
                    total: subgroupsData.length,
                    created: 0,
                    updated: 0,
                    skipped: 0,
                    errors: [],
                };

                // Get all existing groups for validation
                const groupsResult = await client.query(
                    "SELECT id, code FROM mat_item_group"
                );
                const groupCodeToIdMap = new Map();
                groupsResult.rows.forEach(group => {
                    groupCodeToIdMap.set(group.code, group.id);
                });

                // Process each subgroup in a try-catch block to prevent one error from failing the entire transaction
                for (const subgroup of subgroupsData) {
                    try {
                        // Extract and validate data
                        const code = String(
                            subgroup["Subgroup Code"] || ""
                        ).trim();
                        const name = String(
                            subgroup["Subgroup Name"] || ""
                        ).trim();
                        const groupCode = String(
                            subgroup["Group Code"] || ""
                        ).trim();

                        // Skip empty rows
                        if (!code && !name) {
                            stats.skipped++;
                            continue;
                        }

                        // Validate required fields
                        if (!code || !name || !groupCode) {
                            throw new Error(
                                `Missing required fields. Subgroup Code: ${code}, Subgroup Name: ${name}, Group Code: ${groupCode}`
                            );
                        }

                        // Find the group ID from the map
                        if (!groupCodeToIdMap.has(groupCode)) {
                            throw new Error(
                                `Group with code ${groupCode} not found. Make sure it exists in the database before importing subgroups.`
                            );
                        }

                        const groupId = groupCodeToIdMap.get(groupCode);

                        // Check if subgroup already exists in this group
                        const existingSubgroup = await client.query(
                            "SELECT id FROM mat_item_sub_group WHERE code = $1 AND item_group_id = $2",
                            [code, groupId]
                        );

                        const now = new Date();

                        if (existingSubgroup.rows.length > 0) {
                            // Update existing subgroup
                            const subgroupId = existingSubgroup.rows[0].id;
                            await client.query(
                                `UPDATE mat_item_sub_group
                                SET name = $1, updated_at = $2, updated_by = $3
                                WHERE id = $4`,
                                [name, now, userId, subgroupId]
                            );
                            stats.updated++;
                        } else {
                            // Create new subgroup
                            await client.query(
                                `INSERT INTO mat_item_sub_group (code, name, item_group_id, created_at, updated_at, created_by, updated_by)
                                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                                [code, name, groupId, now, now, userId, userId]
                            );
                            stats.created++;
                        }
                    } catch (error) {
                        // Log the error but continue processing other subgroups
                        stats.errors.push({
                            row: JSON.stringify(subgroup),
                            error: error.message,
                        });
                    }
                }

                // Commit transaction only if there were no errors or if some records were successful
                if (
                    stats.errors.length === 0 ||
                    stats.created > 0 ||
                    stats.updated > 0
                ) {
                    await client.query("COMMIT");
                } else {
                    // Rollback if nothing was processed successfully
                    await client.query("ROLLBACK");
                }

                return stats;
            } catch (error) {
                // Ensure rollback happens on any error
                if (client) {
                    try {
                        await client.query("ROLLBACK");
                    } catch (rollbackError) {
                        console.error("Error during rollback:", rollbackError);
                    }
                }
                throw error;
            }
        } catch (error) {
            console.error("Error importing subgroups from Excel:", error);
            throw error;
        } finally {
            // Always release the client back to the pool
            if (client) {
                client.release();
            }
        }
    },

    // Get full material details and attachments for materials by array of codes
    getAttachmentsByCodes: async codes => {
        try {
            return await DBClientWrapper(async client => {
                if (!Array.isArray(codes) || codes.length === 0) return [];
                // Fetch materials by codes
                const materialRes = await client.query(
                    `                    SELECT
                        m.id,
                        m.code,
                        m.name,
                        m.description,
                        m.long_text,
                        m.unit_of_measurement,
                        m.alias1,
                        m.alias2,
                        m.alias3,
                        m.filter_code_1,
                        m.filter_code_2,
                        m.created_at,
                        m.updated_at,
                        m.dfFromClient,
                        mis.id as "subGroupId",
                        mis.code as "subGroupCode",
                        mis.name as "subGroupName",
                        mig.id as "groupId",
                        mig.code as "groupCode",
                        mig.name as "groupName"
                    FROM mat_sap_data m
                    JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                    JOIN mat_item_group mig ON mis.item_group_id = mig.id
                    WHERE m.code = ANY($1)`,
                    [codes]
                );
                const idToMaterial = {};
                materialRes.rows.forEach(row => {
                    idToMaterial[row.id] = { ...row, attachments: [] };
                });
                const ids = materialRes.rows.map(row => row.id);
                if (ids.length === 0) return [];
                // Fetch attachments for these materials
                const attachRes = await client.query(
                    `SELECT material_id, id, attachment, type FROM mat_attachment WHERE material_id = ANY($1)`,
                    [ids]
                );
                attachRes.rows.forEach(att => {
                    if (idToMaterial[att.material_id]) {
                        idToMaterial[att.material_id].attachments.push({
                            id: att.id,
                            attachment: att.attachment,
                            type: att.type,
                        });
                    }
                });
                // Return as array of material objects (with attachments)
                return Object.values(idToMaterial);
            });
        } catch (error) {
            console.error("Error fetching material details by codes:", error);
            throw error;
        }
    },

    // Export materials to Excel (filtered by group/subgroup or search query)
    exportMaterialsToExcel: async (groupId, subGroupId, searchTerm) => {
        try {
            return await DBClientWrapper(async client => {
                let materialsQueryResult = [];
                let groupCode = null;
                let subGroupCode = null;
                if (searchTerm && searchTerm.trim() !== "") {
                    // Use the same logic as searchMaterials, but fetch all (no LIMIT)
                    const safeSearchTerm = String(searchTerm || "").trim();
                    const toTsQuery = input =>
                        input
                            .trim()
                            .split(/\s+/)
                            .map(word => `${word}:*`)
                            .join(" & ");
                    const tsQuery = toTsQuery(safeSearchTerm);
                    const ilikeExact = safeSearchTerm;
                    const ilikePartial = `%${safeSearchTerm}%`;
                    const result = await client.query(
                        `SELECT
                            m.id,
                            m.code,
                            m.name,
                            m.description,
                            m.long_text,
                            m.unit_of_measurement,
                            CASE
                                WHEN m.description IS NOT NULL AND m.long_text IS NOT NULL THEN CONCAT(m.description, ' - ', m.long_text)
                                WHEN m.description IS NOT NULL THEN m.description
                                WHEN m.long_text IS NOT NULL THEN m.long_text
                                ELSE NULL
                            END AS combined_description,
                            m.alias1,
                            m.alias2,
                            m.alias3,
                            m.filter_code_1,
                            m.filter_code_2,
                            m.material_sub_group_id,
                            m.created_at,
                            m.updated_at,
                            m.dfFromClient,
                            m.created_by,
                            mis.code AS "subGroupCode",
                            mis.name AS "subGroupName",
                            mig.code AS "groupCode",
                            mig.name AS "groupName"
                        FROM mat_sap_data m
                        JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                        JOIN mat_item_group mig ON mis.item_group_id = mig.id
                        WHERE (m.dffromclient IS NULL OR m.dffromclient = false)
                        AND (
                            to_tsvector('english', COALESCE(m.name, '') || ' ' || COALESCE(m.description, '') || ' ' || COALESCE(m.long_text, '') || ' ' || COALESCE(m.alias1, '') || ' ' || COALESCE(m.alias2, '') || ' ' || COALESCE(m.alias3, '') || ' ' || COALESCE(m.code, '')) @@ to_tsquery('english', $1)
                            OR m.code ILIKE $2
                        )
                        ORDER BY m.code ASC, m.name ASC`,
                        [tsQuery, ilikePartial]
                    );
                    materialsQueryResult = result.rows;
                } else {
                    let query = `
                        SELECT
                            m.code,
                            m.name,
                            m.description,
                            m.long_text,
                            m.unit_of_measurement,
                            mig.code as group_code,
                            mig.name as group_name,
                            mis.code as subgroup_code,
                            mis.name as subgroup_name,
                            m.alias1,
                            m.alias2,
                            m.alias3,
                            m.created_at,
                            m.updated_at
                        FROM mat_sap_data m
                        JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                        JOIN mat_item_group mig ON mis.item_group_id = mig.id
                    `;
                    const params = [];
                    let where = [];
                    if (subGroupId) {
                        where.push("mis.id = $" + (params.length + 1));
                        params.push(subGroupId);
                        // Fetch subgroup code and its parent group code
                        const subRes = await client.query(
                            "SELECT code, item_group_id FROM mat_item_sub_group WHERE id = $1",
                            [subGroupId]
                        );
                        if (subRes.rows.length > 0) {
                            subGroupCode = subRes.rows[0].code;
                            const groupIdFromSub = subRes.rows[0].item_group_id;
                            if (groupIdFromSub) {
                                const groupRes = await client.query(
                                    "SELECT code FROM mat_item_group WHERE id = $1",
                                    [groupIdFromSub]
                                );
                                if (groupRes.rows.length > 0)
                                    groupCode = groupRes.rows[0].code;
                            }
                        }
                    } else if (groupId) {
                        where.push("mig.id = $" + (params.length + 1));
                        params.push(groupId);
                        // Fetch group code
                        const groupRes = await client.query(
                            "SELECT code FROM mat_item_group WHERE id = $1",
                            [groupId]
                        );
                        if (groupRes.rows.length > 0)
                            groupCode = groupRes.rows[0].code;
                    }
                    if (where.length > 0) {
                        query += " WHERE " + where.join(" AND ");
                    }
                    query += " ORDER BY m.code ASC, m.name ASC";
                    const result = await client.query(query, params);
                    materialsQueryResult = result.rows;
                }
                // Prepare data for Excel
                const materialsData = materialsQueryResult.map(row => {
                    let desc =
                        row.description && row.long_text
                            ? `${row.description} - ${row.long_text}`
                            : row.description || row.long_text || "";
                    // Remove carriage returns and newlines
                    desc = desc.replace(/\r\n|\r|\n/g, " ");
                    return {
                        Code: row.code,
                        Description: desc,
                        UOM: row.unit_of_measurement || "",
                        "Group Code": row.group_code || row.groupCode,
                        "Group Name": row.group_name || row.groupName,
                        "Subgroup Code": row.subgroup_code || row.subGroupCode,
                        "Subgroup Name": row.subgroup_name || row.subGroupName,
                        "Alias 1": row.alias1,
                        "Alias 2": row.alias2,
                        "Alias 3": row.alias3,
                        "Created At": row.created_at
                            ? row.created_at
                                  .toISOString()
                                  .slice(0, 19)
                                  .replace("T", " ")
                            : "",
                        "Updated At": row.updated_at
                            ? row.updated_at
                                  .toISOString()
                                  .slice(0, 19)
                                  .replace("T", " ")
                            : "",
                    };
                });
                const workbook = xlsx.utils.book_new();
                const worksheet = xlsx.utils.json_to_sheet(materialsData);
                const wscols = [
                    { wch: 20 }, // Code
                    { wch: 35 }, // Name
                    { wch: 60 }, // Description
                    { wch: 10 }, // UOM
                    { wch: 15 }, // Group Code
                    { wch: 25 }, // Group Name
                    { wch: 15 }, // Subgroup Code
                    { wch: 25 }, // Subgroup Name
                    { wch: 20 }, // Alias 1
                    { wch: 20 }, // Alias 2
                    { wch: 20 }, // Alias 3
                    { wch: 22 }, // Created At
                    { wch: 22 }, // Updated At
                ];
                worksheet["!cols"] = wscols;
                const rowCount = materialsData.length + 1; // +1 for header
                worksheet["!rows"] = Array.from({ length: rowCount }, () => ({
                    hpt: 22,
                }));
                xlsx.utils.book_append_sheet(workbook, worksheet, "Materials");
                const buffer = xlsx.write(workbook, {
                    type: "buffer",
                    bookType: "xlsx",
                });
                return { buffer, groupCode, subGroupCode };
            });
        } catch (error) {
            console.error("Error exporting materials to Excel:", error);
            throw error;
        }
    },

    // SAP Data Synchronization job (for cron/manual use)
    syncSAPDataJob: async ({ startDate, endDate, fieldName = "LAEDA" }) => {
        try {
            // Validate required parameters
            if (!startDate || !endDate) {
                throw new Error(
                    "startDate and endDate are required (format: YYYYMMDD)"
                );
            }
            if (!["ERSDA", "LAEDA"].includes(fieldName)) {
                throw new Error("fieldName must be either 'ERSDA' or 'LAEDA'");
            }
            const dateRegex = /^\d{8}$/;
            if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
                throw new Error("Dates must be in YYYYMMDD format");
            }
            console.log(
                `[SAP Sync] Starting: ${fieldName} from ${startDate} to ${endDate}`
            );
            // Configure axios instance with correct credentials
            const sapClient = axios.create({
                headers: {
                    Authorization: `Basic ${Buffer.from(
                        `${process.env.SAP_API_CREDENTIALS}`
                    ).toString("base64")}`,
                    "Content-Type": "application/json",
                },
                timeout: 30000,
            });
            // Fetch data from SAP
            // const SAP_URL = `http://erpdev-gm.gamasap.com:8000/sap/opu/odata/sap/ZMM_MATERIAL_MASTER_SRV/MATERIALSet?$filter=(${fieldName} gt '${startDate}')and(${fieldName} lt '${endDate}')&$format=json`;

            const SAP_URL = `${process.env.ODATADOM}:${process.env.ODATAPORT}/sap/opu/odata/sap/ZMM_MATERIAL_MASTER_SRV/MATERIALSet?$filter=(${fieldName} gt '${startDate}')and(${fieldName} lt '${endDate}')&$format=json`;

            const response = await sapClient.get(SAP_URL);
            const results = response.data.d.results;
            console.log(
                `[SAP Sync] Retrieved ${results.length} records from SAP`
            );
            // Filter valid items (starting with 9)
            const validItems = [];
            let skippedNotStartsWith9 = 0;
            for (const item of results) {
                if (!item.MATNR.startsWith("9")) {
                    skippedNotStartsWith9++;
                    continue;
                }
                validItems.push(item);
            }
            console.log(
                `[SAP Sync] Valid items: ${validItems.length}, Skipped: ${skippedNotStartsWith9}`
            );
            // Process database operations
            const dbStats = {
                inserted: 0,
                updated: 0,
                failed: 0,
                total: validItems.length,
            };
            for (const item of validItems) {
                const result = await saveToDatabase(item, pool);
                if (result.success) {
                    if (result.action === "inserted") {
                        dbStats.inserted++;
                    } else {
                        dbStats.updated++;
                    }
                } else {
                    dbStats.failed++;
                    console.error(
                        `[SAP Sync] Failed: ${result.materialId} - ${result.error}`
                    );
                }
            }
            const successRate = (
                ((dbStats.inserted + dbStats.updated) / (dbStats.total || 1)) *
                100
            ).toFixed(2);
            const summary = {
                sapRecords: results.length,
                validRecords: validItems.length,
                skippedNotStartsWith9,
                database: {
                    inserted: dbStats.inserted,
                    updated: dbStats.updated,
                    failed: dbStats.failed,
                    successRate: `${successRate}%`,
                },
                parameters: {
                    fieldName,
                    startDate,
                    endDate,
                },
            };
            console.log("[SAP Sync] Summary:", summary);
            return {
                success: true,
                message: "SAP data synchronization completed",
                data: summary,
            };
        } catch (error) {
            console.error("[SAP Sync] Error:", error);
            return { success: false, message: error.message, error };
        }
    },

    // Get group by ID (for validation)
    getGroupById: async groupId => {
        try {
            return await DBClientWrapper(async client => {
                const res = await client.query(
                    "SELECT id, deleted_at FROM mat_item_group WHERE id = $1",
                    [groupId]
                );
                return res.rows[0] || null;
            });
        } catch (error) {
            console.error("Error fetching group by ID:", error);
            throw error;
        }
    },

    // Get subgroup by ID (for validation)
    getSubGroupById: async subGroupId => {
        try {
            return await DBClientWrapper(async client => {
                const res = await client.query(
                    "SELECT id, deleted_at FROM mat_item_sub_group WHERE id = $1",
                    [subGroupId]
                );
                return res.rows[0] || null;
            });
        } catch (error) {
            console.error("Error fetching subgroup by ID:", error);
            throw error;
        }
    },

    // Soft delete a material (set dffromclient = true)
    deleteMaterial: async materialId => {
        try {
            return await DBClientWrapper(async client => {
                await client.query(
                    "UPDATE mat_sap_data SET dffromclient = true WHERE id = $1 AND (dffromclient IS NULL OR dffromclient = false)",
                    [materialId]
                );
                return { id: materialId, deleted: true };
            });
        } catch (error) {
            console.error("Error soft deleting material:", error);
            throw error;
        }
    },

    // Create material request - creates both staging and mat_sap_data records
    createMaterialRequest: async (requestData, userInfo, attachments) => {
        try {
            return await DBClientWrapper(async client => {
                await client.query("BEGIN");

                try {
                    // 1. Validate material group and subgroup IDs from frontend
                    let materialSubGroupId = null;
                    if (
                        requestData.material_group &&
                        requestData.sub_material_group
                    ) {
                        const groupId = parseInt(requestData.material_group);
                        const subGroupId = parseInt(
                            requestData.sub_material_group
                        );

                        // Verify that the subgroup belongs to the selected group and both exist
                        const subGroupResult = await client.query(
                            `SELECT mis.id FROM mat_item_sub_group mis
                             JOIN mat_item_group mig ON mis.item_group_id = mig.id
                             WHERE mis.id = $1 AND mig.id = $2
                             AND mis.deleted_at IS NULL AND mig.deleted_at IS NULL`,
                            [subGroupId, groupId]
                        );

                        if (subGroupResult.rows.length > 0) {
                            materialSubGroupId = subGroupId;
                        }
                    }

                    // Require valid subgroup - throw error if not found
                    if (!materialSubGroupId) {
                        throw new Error(
                            "Material group and sub-material group are required and must be valid. Please select valid material group and sub-material group from the available options."
                        );
                    }

                    // 2. Generate unique material code based on resolved subgroup
                    let newCode;
                    // Get group and subgroup codes
                    const groupSubgroupQuery = await client.query(
                        `SELECT mig.code as group_code, mis.code as subgroup_code
                         FROM mat_item_sub_group mis
                         JOIN mat_item_group mig ON mis.item_group_id = mig.id
                         WHERE mis.id = $1`,
                        [materialSubGroupId]
                    );

                    if (groupSubgroupQuery.rows.length > 0) {
                        const { group_code, subgroup_code } =
                            groupSubgroupQuery.rows[0];

                        // Get the latest code for this subgroup pattern
                        const codePattern = `${group_code}.${subgroup_code}.%`;
                        const latestCodeQuery = await client.query(
                            `SELECT code FROM mat_sap_data
                             WHERE code LIKE $1
                             ORDER BY code DESC LIMIT 1`,
                            [codePattern]
                        );

                        if (latestCodeQuery.rows.length > 0) {
                            const lastCode = latestCodeQuery.rows[0].code;
                            const parts = lastCode.split(".");

                            // Guard against non-numeric sequences (like B99, C01, etc.)
                            const lastSequencePart = parts[2];
                            let nextSequence = 1; // Default to 1 if parsing fails

                            // Try to extract numeric part from the sequence
                            const numericMatch =
                                lastSequencePart.match(/(\d+)/);
                            if (numericMatch) {
                                const numericPart = parseInt(numericMatch[1]);
                                if (!isNaN(numericPart)) {
                                    nextSequence = numericPart + 1;
                                }
                            }

                            // If the sequence contains non-numeric characters or parsing fails,
                            // find the next available numeric sequence starting from 001
                            if (isNaN(nextSequence) || nextSequence <= 0) {
                                console.warn(
                                    `Non-numeric or invalid sequence found in material code: ${lastCode}. Starting from 001.`
                                );
                                nextSequence = 1;

                                // Double-check that 001 is available by querying existing codes
                                let foundAvailable = false;
                                for (let i = 1; i <= 999; i++) {
                                    const testCode = `${group_code}.${subgroup_code}.${String(
                                        i
                                    ).padStart(3, "0")}`;
                                    const existsQuery = await client.query(
                                        `SELECT 1 FROM mat_sap_data WHERE code = $1 LIMIT 1`,
                                        [testCode]
                                    );

                                    if (existsQuery.rows.length === 0) {
                                        nextSequence = i;
                                        foundAvailable = true;
                                        break;
                                    }
                                }

                                if (!foundAvailable) {
                                    throw new Error(
                                        `Unable to generate new material code for group ${group_code}.${subgroup_code}. All numeric sequences (001-999) appear to be used.`
                                    );
                                }
                            }

                            newCode = `${group_code}.${subgroup_code}.${String(
                                nextSequence
                            ).padStart(3, "0")}`;
                        } else {
                            // First code for this subgroup
                            newCode = `${group_code}.${subgroup_code}.001`;
                        }
                    } else {
                        // This should never happen since we validate materialSubGroupId above
                        throw new Error(
                            "Unable to retrieve group and subgroup codes. Please contact system administrator."
                        );
                    }

                    // 3. Create comprehensive description (technical specs only)
                    const descriptionParts = [];
                    if (requestData.part_number)
                        descriptionParts.push(`P/N ${requestData.part_number}`);
                    descriptionParts.push(requestData.deskripsi_material);
                    if (requestData.type)
                        descriptionParts.push(requestData.type);
                    if (requestData.series)
                        descriptionParts.push(requestData.series);
                    if (requestData.dimensi)
                        descriptionParts.push(requestData.dimensi);
                    if (requestData.berat)
                        descriptionParts.push(requestData.berat);
                    if (requestData.bahan)
                        descriptionParts.push(requestData.bahan);
                    if (requestData.power)
                        descriptionParts.push(requestData.power);
                    if (requestData.plant)
                        descriptionParts.push(requestData.plant);
                    if (requestData.other_specification)
                        descriptionParts.push(requestData.other_specification);
                    if (requestData.catatan_tambahan)
                        descriptionParts.push(requestData.catatan_tambahan);

                    const description = descriptionParts.join(" ");
                    const longText = ""; // Leave long_text empty

                    // 4. Insert into mat_sap_data with approval workflow
                    const matSapData = {
                        code: newCode,
                        name: requestData.nama_material,
                        description: description,
                        long_text: longText,
                        type: "SPAR",
                        unit_of_measurement: requestData.uom,
                        alias1: requestData.alias1 || null,
                        alias2: requestData.alias2 || null,
                        alias3: requestData.alias3 || null,
                        material_sub_group_id: materialSubGroupId,
                        approval_status: "pending",
                        requested_by: userInfo.user_id,
                        requested_at: "NOW()",
                        created_by: null, // Will be set when approved
                        updated_by: userInfo.user_id,
                        created_at: "NOW()",
                        updated_at: "NOW()",
                        dffromclient: false,
                    };

                    const [matSapQuery, matSapValues] = Crud.insertItem(
                        "mat_sap_data",
                        matSapData,
                        "id"
                    );

                    const matSapResult = await client.query(
                        matSapQuery,
                        matSapValues
                    );
                    const materialId = matSapResult.rows[0].id;

                    // 5. Handle attachments if provided
                    const uploadedFiles = [];
                    if (attachments && attachments.length > 0) {
                        for (const file of attachments) {
                            const mimeType = getMimeType(file.extension);

                            const attachmentData = {
                                material_id: materialId,
                                attachment: file.newName,
                                type: mimeType,
                                created_at: "NOW()",
                                updated_at: "NOW()",
                            };

                            const [attachQuery, attachValues] = Crud.insertItem(
                                "mat_attachment",
                                attachmentData,
                                "id"
                            );

                            const attachResult = await client.query(
                                attachQuery,
                                attachValues
                            );

                            uploadedFiles.push({
                                id: attachResult.rows[0].id,
                                originalName: file.originalName,
                                savedAs: file.newName,
                                type: mimeType,
                            });
                        }
                    }

                    await client.query("COMMIT");

                    // 6. Save files to disk after successful database operations
                    if (attachments && attachments.length > 0) {
                        const publicDir = path.join(
                            path.resolve(),
                            "./backend/public"
                        );

                        for (const file of attachments) {
                            const finalPath = path.join(
                                publicDir,
                                file.newName
                            );
                            fs.copyFileSync(file.tempPath, finalPath);
                            fs.unlinkSync(file.tempPath); // Clean up temp file
                        }
                    }

                    return {
                        materialId: materialId,
                        materialCode: newCode,
                        uploadedFiles: uploadedFiles,
                        status: "pending_approval",
                    };
                } catch (error) {
                    await client.query("ROLLBACK");

                    // Clean up temp files on error
                    if (attachments && attachments.length > 0) {
                        for (const file of attachments) {
                            if (fs.existsSync(file.tempPath)) {
                                fs.unlinkSync(file.tempPath);
                            }
                        }
                    }

                    throw error;
                }
            });
        } catch (error) {
            console.error("Error creating material request:", error);
            throw error;
        }
    },

    // Get pending approval materials
    getPendingMaterials: async (
        page = 1,
        pageSize = 10,
        search = "",
        sort = "requested_at",
        order = "desc"
    ) => {
        try {
            return await DBClientWrapper(async client => {
                const offset = (page - 1) * pageSize;
                const safeSearchTerm = String(search || "").trim();
                const isSearch = safeSearchTerm.length > 0;
                let totalCount = 0;
                let materialsQueryResult = [];

                if (isSearch) {
                    // Use the same search logic as searchMaterials with full-text search
                    const toTsQuery = input =>
                        input
                            .trim()
                            .split(/\s+/)
                            .map(word => `${word}:*`)
                            .join(" & ");
                    const tsQuery = toTsQuery(safeSearchTerm);
                    const ilikeExact = safeSearchTerm;
                    const ilikePartial = `%${safeSearchTerm}%`;

                    // Get total count for search
                    const countRes = await client.query(
                        `SELECT COUNT(*) AS total
                        FROM mat_sap_data m
                        JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                        JOIN mat_item_group mig ON mis.item_group_id = mig.id
                        JOIN mst_user u ON m.requested_by = u.user_id
                        WHERE m.approval_status = 'pending'
                        AND (
                            to_tsvector('english', COALESCE(m.name, '') || ' ' || COALESCE(m.description, '') || ' ' || COALESCE(m.alias1, '') || ' ' || COALESCE(m.alias2, '') || ' ' || COALESCE(m.alias3, '') || ' ' || COALESCE(m.code, '')) @@ to_tsquery('english', $1)
                            OR m.code ILIKE $2
                            OR m.code ILIKE $3
                            OR u.fullname ILIKE $4
                        )`,
                        [tsQuery, ilikeExact, ilikePartial, ilikePartial]
                    );
                    totalCount = parseInt(countRes.rows[0].total);

                    // Get search results with ranking
                    const result = await client.query(
                        `SELECT
                            m.id,
                            m.code,
                            m.name,
                            m.description,
                            m.unit_of_measurement,
                            m.alias1,
                            m.alias2,
                            m.alias3,
                            m.approval_status,
                            m.requested_by,
                            u.fullname as requested_by_name,
                            m.requested_at,
                            m.created_at,
                            mis.name as sub_group_name,
                            mig.name as group_name,
                            ts_rank_cd(
                                setweight(to_tsvector(COALESCE(m.name, '')), 'A') ||
                                setweight(to_tsvector(COALESCE(m.description, '')), 'B') ||
                                setweight(to_tsvector(COALESCE(m.alias1, '')), 'C') ||
                                setweight(to_tsvector(COALESCE(m.alias2, '')), 'C') ||
                                setweight(to_tsvector(COALESCE(m.alias3, '')), 'C'),
                                to_tsquery('english', $1)
                            ) AS rank,
                            CASE
                                WHEN m.code ILIKE $2 THEN 1
                                WHEN m.code ILIKE $3 THEN 2
                                ELSE 3
                            END AS code_match_rank
                        FROM mat_sap_data m
                        JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                        JOIN mat_item_group mig ON mis.item_group_id = mig.id
                        JOIN mst_user u ON m.requested_by = u.user_id
                        WHERE m.approval_status = 'pending'
                        AND (
                            to_tsvector('english', COALESCE(m.name, '') || ' ' || COALESCE(m.description, '') || ' ' || COALESCE(m.alias1, '') || ' ' || COALESCE(m.alias2, '') || ' ' || COALESCE(m.alias3, '') || ' ' || COALESCE(m.code, '')) @@ to_tsquery('english', $1)
                            OR m.code ILIKE $2
                            OR m.code ILIKE $3
                            OR u.fullname ILIKE $4
                        )
                        ORDER BY code_match_rank, rank DESC, m.${sort} ${order.toUpperCase()}
                        LIMIT $5 OFFSET $6`,
                        [
                            tsQuery,
                            ilikeExact,
                            ilikePartial,
                            ilikePartial,
                            pageSize,
                            offset,
                        ]
                    );
                    materialsQueryResult = result.rows;
                } else {
                    // Get total count for all pending materials
                    const countRes = await client.query(
                        `SELECT COUNT(*) AS total
                        FROM mat_sap_data m
                        WHERE m.approval_status = 'pending'`
                    );
                    totalCount = parseInt(countRes.rows[0].total);

                    // Get all pending materials without search
                    const result = await client.query(
                        `SELECT
                            m.id,
                            m.code,
                            m.name,
                            m.description,
                            m.unit_of_measurement,
                            m.alias1,
                            m.alias2,
                            m.alias3,
                            m.approval_status,
                            m.requested_by,
                            u.fullname as requested_by_name,
                            m.requested_at,
                            m.created_at,
                            mis.name as sub_group_name,
                            mig.name as group_name
                        FROM mat_sap_data m
                        JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                        JOIN mat_item_group mig ON mis.item_group_id = mig.id
                        JOIN mst_user u ON m.requested_by = u.user_id
                        WHERE m.approval_status = 'pending'
                        ORDER BY m.${sort} ${order.toUpperCase()}
                        LIMIT $1 OFFSET $2`,
                        [pageSize, offset]
                    );
                    materialsQueryResult = result.rows;
                }

                return {
                    data: materialsQueryResult,
                    pagination: {
                        totalCount,
                        totalPages: Math.ceil(totalCount / pageSize),
                        currentPage: page,
                        pageSize,
                    },
                };
            });
        } catch (error) {
            console.error("Error fetching pending materials:", error);
            throw error;
        }
    },

    // Get pending material by ID for approval
    getPendingMaterialById: async materialId => {
        try {
            return await DBClientWrapper(async client => {
                const result = await client.query(
                    `SELECT
                        m.id,
                        m.code,
                        m.name,
                        m.description,
                        m.long_text,
                        m.unit_of_measurement,
                        m.alias1,
                        m.alias2,
                        m.alias3,
                        m.filter_code_1,
                        m.filter_code_2,
                        m.material_sub_group_id,
                        m.approval_status,
                        m.requested_by,
                        m.requested_at,
                        m.created_at,
                        m.updated_at,
                        m.dfFromClient,
                        m.created_by,
                        m.updated_by,
                        m.rejected_by,
                        m.rejection_reason,
                        mis.name as sub_group_name,
                        mig.name as group_name,
                        u.fullname as requested_by_name
                    FROM mat_sap_data m
                    JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                    JOIN mat_item_group mig ON mis.item_group_id = mig.id
                    JOIN mst_user u ON m.requested_by = u.user_id
                    WHERE m.id = $1 AND m.approval_status = 'pending'`,
                    [materialId]
                );

                if (result.rows.length === 0) {
                    return null;
                }

                const material = result.rows[0];

                // Get attachments
                const attachments =
                    await Material.getMaterialAttachments(materialId);
                material.attachments = attachments;

                return material;
            });
        } catch (error) {
            console.error("Error fetching pending material by ID:", error);
            throw error;
        }
    },

    // Update pending material request
    updatePendingMaterial: async (materialId, updateData, userInfo) => {
        try {
            return await DBClientWrapper(async client => {
                await client.query("BEGIN");

                try {
                    // Check if material is in pending status
                    const checkResult = await client.query(
                        `SELECT id FROM mat_sap_data WHERE id = $1 AND approval_status = 'pending'`,
                        [materialId]
                    );

                    if (checkResult.rows.length === 0) {
                        throw new Error(
                            "Material not found or not in pending status"
                        );
                    }

                    // Build update query dynamically
                    const updateFields = [];
                    const updateValues = [];
                    let paramCount = 1;

                    if (updateData.name) {
                        updateFields.push(`name = $${paramCount++}`);
                        updateValues.push(updateData.name);
                    }
                    if (updateData.description) {
                        updateFields.push(`description = $${paramCount++}`);
                        updateValues.push(updateData.description);
                    }
                    if (updateData.unit_of_measurement) {
                        updateFields.push(
                            `unit_of_measurement = $${paramCount++}`
                        );
                        updateValues.push(updateData.unit_of_measurement);
                    }
                    if (updateData.alias1 !== undefined) {
                        updateFields.push(`alias1 = $${paramCount++}`);
                        updateValues.push(updateData.alias1);
                    }
                    if (updateData.alias2 !== undefined) {
                        updateFields.push(`alias2 = $${paramCount++}`);
                        updateValues.push(updateData.alias2);
                    }
                    if (updateData.alias3 !== undefined) {
                        updateFields.push(`alias3 = $${paramCount++}`);
                        updateValues.push(updateData.alias3);
                    }

                    if (updateFields.length === 0) {
                        throw new Error("No valid fields to update");
                    }

                    updateFields.push(`updated_by = $${paramCount++}`);
                    updateFields.push(`updated_at = NOW()`);
                    updateValues.push(userInfo.user_id);

                    updateValues.push(materialId); // Add materialId as last parameter

                    const updateQuery = `
                        UPDATE mat_sap_data
                        SET ${updateFields.join(", ")}
                        WHERE id = $${paramCount}
                        RETURNING *
                    `;

                    const result = await client.query(
                        updateQuery,
                        updateValues
                    );

                    await client.query("COMMIT");
                    return result.rows[0];
                } catch (error) {
                    await client.query("ROLLBACK");
                    throw error;
                }
            });
        } catch (error) {
            console.error("Error updating pending material:", error);
            throw error;
        }
    },

    // Approve material with email notification
    approveWithNotification: async (materialId, approverUserId) => {
        try {
            return await DBClientWrapper(async client => {
                // Get material details with requester information before approval
                const materialDetails = await client.query(
                    `
                    SELECT m.*, u.email as requester_email, u.fullname as requester_name,
                           mig.name as group_name, mis.name as sub_group_name
                    FROM mat_sap_data m
                    LEFT JOIN mst_user u ON m.requested_by = u.user_id
                    LEFT JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                    LEFT JOIN mat_item_group mig ON mis.item_group_id = mig.id
                    WHERE m.id = $1 AND m.approval_status = 'pending'
                `,
                    [materialId]
                );

                if (materialDetails.rows.length === 0) {
                    throw new Error(
                        "Material not found or not pending approval"
                    );
                }

                const material = materialDetails.rows[0];

                // Approve the material
                const result = await client.query(
                    `UPDATE mat_sap_data
                     SET approval_status = 'approved',
                         created_by = $2,
                         updated_at = NOW()
                     WHERE id = $1 AND approval_status = 'pending'
                     RETURNING *`,
                    [materialId, approverUserId]
                );

                if (result.rows.length === 0) {
                    throw new Error(
                        "Material approval failed - material may have been already processed"
                    );
                }

                // Send email notification to requester if email exists
                if (material.requester_email) {
                    try {
                        await Emailer.materialApprovalNotification(
                            material,
                            material.requester_email
                        );
                        console.log(`Approval email sent successfully`);
                    } catch (emailError) {
                        console.error(
                            "Error sending approval email:",
                            emailError
                        );
                        // Don't fail the transaction if email fails
                    }
                }

                return result.rows[0];
            });
        } catch (error) {
            console.error("Error approving material with notification:", error);
            throw error;
        }
    },

    // Reject material with email notification
    rejectWithNotification: async (
        materialId,
        rejectorUserId,
        rejectionReason
    ) => {
        try {
            return await DBClientWrapper(async client => {
                // Get material details with requester information before rejection
                const materialDetails = await client.query(
                    `
                    SELECT m.*, u.email as requester_email, u.fullname as requester_name,
                           mig.name as group_name, mis.name as sub_group_name
                    FROM mat_sap_data m
                    LEFT JOIN mst_user u ON m.requested_by = u.user_id
                    LEFT JOIN mat_item_sub_group mis ON m.material_sub_group_id = mis.id
                    LEFT JOIN mat_item_group mig ON mis.item_group_id = mig.id
                    WHERE m.id = $1 AND m.approval_status = 'pending'
                `,
                    [materialId]
                );

                if (materialDetails.rows.length === 0) {
                    throw new Error(
                        "Material not found or not pending approval"
                    );
                }

                const material = materialDetails.rows[0];

                // Get all attachments before deletion to clean up files
                const attachmentsQuery = await client.query(
                    `SELECT id, attachment FROM mat_attachment WHERE material_id = $1`,
                    [materialId]
                );

                const attachments = attachmentsQuery.rows;

                // Delete all attachments from database first (foreign key constraint)
                if (attachments.length > 0) {
                    await client.query(
                        `DELETE FROM mat_attachment WHERE material_id = $1`,
                        [materialId]
                    );
                }

                // Delete the material (rejection = deletion for simplicity)
                const result = await client.query(
                    `DELETE FROM mat_sap_data
                     WHERE id = $1 AND approval_status = 'pending'
                     RETURNING *`,
                    [materialId]
                );

                if (result.rows.length === 0) {
                    throw new Error(
                        "Material rejection failed - material may have been already processed"
                    );
                }

                // Clean up attachment files from file system (after successful DB operations)
                if (attachments.length > 0) {
                    const publicDir = path.join(
                        path.resolve(),
                        "./backend/public"
                    );

                    for (const attachment of attachments) {
                        try {
                            const filePath = path.join(
                                publicDir,
                                attachment.attachment
                            );

                            if (fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                                console.log(
                                    `Deleted attachment file: ${attachment.attachment}`
                                );
                            }
                        } catch (fileError) {
                            console.error(
                                `Error deleting attachment file ${attachment.attachment}:`,
                                fileError
                            );
                            // Don't fail the transaction if file deletion fails
                        }
                    }

                    console.log(
                        `Cleaned up ${attachments.length} attachment(s) for rejected material ID: ${materialId}`
                    );
                }

                // Send email notification to requester if email exists
                if (material.requester_email) {
                    try {
                        await Emailer.materialRejectionNotification(
                            material,
                            rejectionReason,
                            material.requester_email
                        );
                        console.log(`Rejection email sent successfully`);
                    } catch (emailError) {
                        console.error(
                            "Error sending rejection email:",
                            emailError
                        );
                        // Don't fail the transaction if email fails
                    }
                }

                return result.rows[0];
            });
        } catch (error) {
            console.error("Error rejecting material with notification:", error);
            throw error;
        }
    },
};

module.exports = Material;
