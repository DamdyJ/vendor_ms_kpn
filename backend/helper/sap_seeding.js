const saveToDatabase = async (item, pool) => {
    try {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            // Helper functions
            const formatDate = sapDate => {
                if (!sapDate || sapDate === "00000000") {
                    return new Date().toISOString().split("T")[0];
                }
                const year = sapDate.substring(0, 4);
                const month = sapDate.substring(4, 6);
                const day = sapDate.substring(6, 8);
                return `${year}-${month}-${day}`;
            };

            const extractGroups = materialCode => {
                const parts = materialCode.split(".");
                return {
                    itemGroup: parts.length > 0 ? parts[0] : "",
                    itemSubGroup: parts.length > 1 ? parts[1] : "",
                };
            };

            const decodeBase64 = base64String => {
                if (!base64String) return "";
                try {
                    const isBase64 = /^[A-Za-z0-9+/=]+$/.test(
                        base64String.trim()
                    );
                    if (!isBase64) return base64String;
                    return Buffer.from(base64String, "base64").toString(
                        "utf-8"
                    );
                } catch (error) {
                    return base64String;
                }
            };

            // Process dates
            const createdDate = formatDate(item.ERSDA);
            const updatedDate = formatDate(item.LAEDA);

            // Extract group codes
            const { itemGroup, itemSubGroup } = extractGroups(item.MATNR);
            const longText = decodeBase64(item.LTEXT);

            // 1. Upsert item group
            const upsertGroup = await client.query(
                `INSERT INTO mat_item_group(code, name, created_at, updated_at, created_by, updated_by)
                   VALUES($1, $2, $3, $4, $5, $5)
                   ON CONFLICT (code) DO UPDATE SET
                       updated_at = EXCLUDED.updated_at,
                       updated_by = EXCLUDED.updated_by
                   RETURNING id`,
                [
                    itemGroup,
                    `Group ${itemGroup}`,
                    createdDate,
                    updatedDate,
                    item.ERNAM || "SYSTEM",
                ]
            );
            const itemGroupId = upsertGroup.rows[0].id;

            // 2. Upsert item subgroup
            let subGroupId;
            if (itemSubGroup) {
                const upsertSubGroup = await client.query(
                    `INSERT INTO mat_item_sub_group(code, name, item_group_id, created_at, updated_at, created_by, updated_by)
                       VALUES($1, $2, $3, $4, $5, $6, $6)
                       ON CONFLICT (code, item_group_id) DO UPDATE SET
                           updated_at = EXCLUDED.updated_at,
                           updated_by = EXCLUDED.updated_by
                       RETURNING id`,
                    [
                        itemSubGroup,
                        `Subgroup ${itemSubGroup}`,
                        itemGroupId,
                        createdDate,
                        updatedDate,
                        item.ERNAM || "SYSTEM",
                    ]
                );
                subGroupId = upsertSubGroup.rows[0].id;
            } else {
                throw new Error(
                    `No subgroup available for material ${item.MATNR}`
                );
            }

            // 3. Upsert material
            const upsertMaterial = await client.query(
                `INSERT INTO mat_sap_data(
                      code, name, description, long_text, type,
                      maintenance_status, unit_of_measurement,
                      material_sub_group_id, created_by, updated_by,
                      created_at, updated_at, dffromclient
                  ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                  ON CONFLICT (code) DO UPDATE SET
                      name = EXCLUDED.name,
                      description = EXCLUDED.description,
                      long_text = EXCLUDED.long_text,
                      type = EXCLUDED.type,
                      maintenance_status = EXCLUDED.maintenance_status,
                      unit_of_measurement = EXCLUDED.unit_of_measurement,
                      material_sub_group_id = EXCLUDED.material_sub_group_id,
                      updated_by = EXCLUDED.updated_by,
                      updated_at = EXCLUDED.updated_at,
                      dffromclient = EXCLUDED.dffromclient
                  RETURNING code, (xmax = 0) AS was_inserted`,
                [
                    item.MATNR,
                    item.MAKTX || null,
                    item.MAKTX || null,
                    longText,
                    item.MTART || null,
                    item.PSTAT || null,
                    item.MEINS || null,
                    subGroupId,
                    item.ERNAM || "SYSTEM",
                    item.AENAM || "SYSTEM",
                    createdDate,
                    updatedDate,
                    item.LVORM === "X" ? true : false,
                ]
            );

            const wasInserted = upsertMaterial.rows[0].was_inserted;
            const action = wasInserted ? "inserted" : "updated";

            await client.query("COMMIT");
            return { success: true, action, materialId: item.MATNR };
        } catch (err) {
            await client.query("ROLLBACK");
            return {
                success: false,
                error: err.message,
                materialId: item.MATNR,
            };
        } finally {
            client.release();
        }
    } catch (err) {
        return {
            success: false,
            error: err.message,
            materialId: item.MATNR,
        };
    }
};

module.exports = saveToDatabase;
