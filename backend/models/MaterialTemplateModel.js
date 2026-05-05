const DBClientWrapper = require("../helper/DBClientWrapper.js");
const {
    hasValue,
    mapTemplateConfigRows,
    normalizeTemplateValue,
    validateTemplateValues,
} = require("../helper/materialTemplateHelper.js");
const {
    buildMaterialFormSchema,
} = require("../helper/materialFormSchemaHelper.js");

const MaterialTemplate = {
    getMaterialTemplates: async () => {
        return DBClientWrapper(async client => {
            const result = await client.query(`
                SELECT
                    tm.template_id,
                    tm.template_code,
                    tm.template_name,
                    ARRAY_AGG(tgm.material_group_code ORDER BY tgm.material_group_code) AS material_group_codes
                FROM mat_template_master tm
                JOIN mat_template_group_map tgm ON tgm.template_id = tm.template_id
                GROUP BY tm.template_id, tm.template_code, tm.template_name
                ORDER BY tm.template_name ASC
            `);

            return result.rows.map(row => ({
                templateId: row.template_id,
                templateCode: row.template_code,
                templateName: row.template_name,
                materialGroupCodes: row.material_group_codes || [],
            }));
        });
    },

    getMaterialTemplateByGroupCode: async materialGroupCode => {
        return DBClientWrapper(async client => {
            const requestRuleResult = await client.query(`
                SELECT
                    field_key,
                    section_name,
                    field_label,
                    display_order,
                    is_required,
                    is_locked,
                    default_value,
                    source_type,
                    source_reference,
                    notes
                FROM mat_request_field_rules
                ORDER BY display_order ASC
            `);

            const templateResult = await client.query(
                `
                    SELECT
                        tm.template_id,
                        tm.template_code,
                        tm.template_name,
                        tgm.material_group_code,
                        tr.template_rule_id,
                        tr.field_order,
                        tr.is_mandatory,
                        tr.validation_rule_type,
                        tr.prefix_value,
                        tr.rule_detail,
                        tr.max_length,
                        fm.field_id,
                        fm.field_code,
                        fm.field_key,
                        fm.field_name_id,
                        fm.data_type
                    FROM mat_template_group_map tgm
                    JOIN mat_template_master tm ON tm.template_id = tgm.template_id
                    JOIN mat_template_field_rules tr ON tr.template_id = tm.template_id
                    JOIN mat_field_master fm ON fm.field_id = tr.field_id
                    WHERE tgm.material_group_code = $1
                    ORDER BY tr.field_order ASC
                `,
                [materialGroupCode]
            );

            const templateConfig = mapTemplateConfigRows(templateResult.rows);
            if (!templateConfig) {
                throw new Error(
                    `Material template tidak ditemukan untuk material group ${materialGroupCode}`
                );
            }

            return {
                materialGroupCode,
                requestFieldRules: requestRuleResult.rows.map(row => ({
                    fieldKey: row.field_key,
                    sectionName: row.section_name,
                    fieldLabel: row.field_label,
                    displayOrder: row.display_order,
                    isRequired: row.is_required,
                    isLocked: row.is_locked,
                    defaultValue: row.default_value,
                    sourceType: row.source_type,
                    sourceReference: row.source_reference,
                    notes: row.notes,
                })),
                template: templateConfig,
            };
        });
    },

    getMaterialFormSchemaByGroupCode: async materialGroupCode => {
        const materialTemplate =
            await MaterialTemplate.getMaterialTemplateByGroupCode(
                materialGroupCode
            );

        return DBClientWrapper(async client => {
            const materialGroupResult = await client.query(
                `
                    SELECT id, code, name
                    FROM mat_item_group
                    WHERE code = $1
                      AND deleted_at IS NULL
                    LIMIT 1
                `,
                [materialGroupCode]
            );

            if (materialGroupResult.rows.length === 0) {
                throw new Error(
                    `Material group tidak ditemukan untuk kode ${materialGroupCode}`
                );
            }

            const materialGroup = {
                id: materialGroupResult.rows[0].id,
                code: materialGroupResult.rows[0].code,
                name: materialGroupResult.rows[0].name,
            };

            const subgroupResult = await client.query(
                `
                    SELECT id, code, name
                    FROM mat_item_sub_group
                    WHERE item_group_id = $1
                      AND deleted_at IS NULL
                    ORDER BY code ASC
                `,
                [materialGroup.id]
            );

            let uiMetadataRows = [];
            try {
                const uiMetadataResult = await client.query(`
                    SELECT
                        fm.field_id,
                        fm.field_key,
                        fm.field_name_id,
                        uim.section_key,
                        uim.field_label,
                        uim.helper_text,
                        uim.placeholder,
                        uim.display_order
                    FROM mat_field_ui_meta uim
                    JOIN mat_field_master fm ON fm.field_id = uim.field_id
                    ORDER BY COALESCE(uim.display_order, 2147483647), fm.field_key ASC
                `);

                uiMetadataRows = uiMetadataResult.rows.map(row => ({
                    fieldId: row.field_id,
                    fieldKey: row.field_key,
                    fieldNameId: row.field_name_id,
                    sectionKey: row.section_key,
                    fieldLabel: row.field_label,
                    helperText: row.helper_text,
                    placeholder: row.placeholder,
                    displayOrder: row.display_order,
                }));
            } catch (error) {
                if (error.code !== "42P01") {
                    throw error;
                }
            }

            return buildMaterialFormSchema({
                materialGroup,
                template: materialTemplate.template,
                subgroups: subgroupResult.rows.map(row => ({
                    id: row.id,
                    code: row.code,
                    name: row.name,
                })),
                requestFieldRules: materialTemplate.requestFieldRules,
                uiMetadata: uiMetadataRows,
            });
        });
    },

    previewMaterialTemplateDescription: async (
        materialGroupCode,
        templateValues
    ) => {
        const materialTemplate =
            await MaterialTemplate.getMaterialTemplateByGroupCode(
                materialGroupCode
            );
        const preview = validateTemplateValues(
            materialTemplate.template,
            templateValues || {}
        );

        return {
            materialGroupCode,
            template: materialTemplate.template,
            ...preview,
        };
    },

    validateMaterialRequestTemplate: async ({
        materialGroupCode,
        requestFields = {},
        templateValues = {},
    }) => {
        return DBClientWrapper(async client => {
            const materialTemplate =
                await MaterialTemplate.getMaterialTemplateByGroupCode(
                    materialGroupCode
                );
            const errors = [];
            const normalizedRequestFields = {};

            for (const fieldRule of materialTemplate.requestFieldRules) {
                let currentValue = requestFields[fieldRule.fieldKey];
                const isComputedField =
                    fieldRule.sourceType === "COMPUTED_TEMPLATE";

                if (fieldRule.isLocked && hasValue(fieldRule.defaultValue)) {
                    currentValue = fieldRule.defaultValue;
                } else if (
                    !hasValue(currentValue) &&
                    hasValue(fieldRule.defaultValue)
                ) {
                    currentValue = fieldRule.defaultValue;
                }

                if (typeof currentValue === "string") {
                    currentValue = normalizeTemplateValue(currentValue);
                }

                if (
                    fieldRule.isRequired &&
                    !hasValue(currentValue) &&
                    !isComputedField
                ) {
                    errors.push({
                        fieldKey: fieldRule.fieldKey,
                        fieldLabel: fieldRule.fieldLabel,
                        message: `${fieldRule.fieldLabel} wajib diisi`,
                    });
                }

                normalizedRequestFields[fieldRule.fieldKey] = hasValue(
                    currentValue
                )
                    ? currentValue
                    : null;
            }

            const preview = validateTemplateValues(
                materialTemplate.template,
                templateValues || {}
            );

            normalizedRequestFields.material_description =
                preview.materialDescription;

            const searchTerm = normalizeTemplateValue(
                preview.materialDescription || preview.fullDescription || ""
            );
            let duplicateSuggestions = [];

            if (searchTerm) {
                const duplicateResult = await client.query(
                    `
                        SELECT
                            m.id,
                            m.code,
                            COALESCE(m.description, m.name) AS material_description,
                            mig.code AS material_group_code,
                            mig.name AS material_group_name
                        FROM mat_sap_data m
                        JOIN mat_item_sub_group mis ON mis.id = m.material_sub_group_id
                        JOIN mat_item_group mig ON mig.id = mis.item_group_id
                        WHERE (m.dffromclient IS NULL OR m.dffromclient = false)
                          AND mig.code = $1
                          AND (
                            UPPER(COALESCE(m.description, '')) LIKE $2
                            OR UPPER(COALESCE(m.name, '')) LIKE $2
                            OR UPPER(COALESCE(m.code, '')) LIKE $2
                          )
                        ORDER BY m.code ASC
                        LIMIT 5
                    `,
                    [materialGroupCode, `%${searchTerm}%`]
                );
                duplicateSuggestions = duplicateResult.rows;
            }

            return {
                materialGroupCode,
                requestFieldRules: materialTemplate.requestFieldRules,
                template: materialTemplate.template,
                normalizedRequestFields,
                normalizedTemplateValues: preview.normalizedValues,
                materialDescription: preview.materialDescription,
                fullDescription: preview.fullDescription,
                exceedsMaterialDescriptionLimit:
                    preview.exceedsMaterialDescriptionLimit,
                duplicateSuggestions,
                errors: [...errors, ...preview.errors],
                isValid: errors.length === 0 && preview.errors.length === 0,
            };
        });
    },

    searchMaterialTemplateSuggestions: async ({
        query,
        materialGroupCode = null,
        limit = 10,
    }) => {
        return DBClientWrapper(async client => {
            const normalizedQuery = normalizeTemplateValue(query || "");
            if (normalizedQuery.length < 2) {
                return [];
            }

            const safeLimit = Math.min(Number(limit) || 10, 25);
            const params = materialGroupCode
                ? [materialGroupCode, `%${normalizedQuery}%`, safeLimit]
                : [`%${normalizedQuery}%`, safeLimit];

            const queryText = materialGroupCode
                ? `
                    SELECT
                        m.id,
                        m.code,
                        m.name,
                        m.description,
                        m.alias1,
                        m.alias2,
                        m.alias3,
                        mig.code AS material_group_code,
                        mig.name AS material_group_name
                    FROM mat_sap_data m
                    JOIN mat_item_sub_group mis ON mis.id = m.material_sub_group_id
                    JOIN mat_item_group mig ON mig.id = mis.item_group_id
                    WHERE (m.dffromclient IS NULL OR m.dffromclient = false)
                      AND mig.code = $1
                      AND (
                        UPPER(COALESCE(m.code, '')) LIKE $2
                        OR UPPER(COALESCE(m.name, '')) LIKE $2
                        OR UPPER(COALESCE(m.description, '')) LIKE $2
                        OR UPPER(COALESCE(m.alias1, '')) LIKE $2
                        OR UPPER(COALESCE(m.alias2, '')) LIKE $2
                        OR UPPER(COALESCE(m.alias3, '')) LIKE $2
                      )
                    ORDER BY m.code ASC
                    LIMIT $3
                `
                : `
                    SELECT
                        m.id,
                        m.code,
                        m.name,
                        m.description,
                        m.alias1,
                        m.alias2,
                        m.alias3,
                        mig.code AS material_group_code,
                        mig.name AS material_group_name
                    FROM mat_sap_data m
                    JOIN mat_item_sub_group mis ON mis.id = m.material_sub_group_id
                    JOIN mat_item_group mig ON mig.id = mis.item_group_id
                    WHERE (m.dffromclient IS NULL OR m.dffromclient = false)
                      AND (
                        UPPER(COALESCE(m.code, '')) LIKE $1
                        OR UPPER(COALESCE(m.name, '')) LIKE $1
                        OR UPPER(COALESCE(m.description, '')) LIKE $1
                        OR UPPER(COALESCE(m.alias1, '')) LIKE $1
                        OR UPPER(COALESCE(m.alias2, '')) LIKE $1
                        OR UPPER(COALESCE(m.alias3, '')) LIKE $1
                      )
                    ORDER BY m.code ASC
                    LIMIT $2
                `;

            const result = await client.query(queryText, params);
            return result.rows;
        });
    },
};

module.exports = MaterialTemplate;
