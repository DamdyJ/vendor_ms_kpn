const assert = require("node:assert/strict");
const path = require("node:path");

const modelPath = path.resolve(__dirname, "../models/MaterialModel.js");
const wrapperPath = path.resolve(__dirname, "../helper/DBClientWrapper.js");
const connectionPath = path.resolve(__dirname, "../config/connection.js");

const loadMaterialModel = client => {
    delete require.cache[modelPath];
    delete require.cache[wrapperPath];
    delete require.cache[connectionPath];

    require.cache[connectionPath] = {
        id: connectionPath,
        filename: connectionPath,
        loaded: true,
        exports: {},
    };

    require.cache[wrapperPath] = {
        id: wrapperPath,
        filename: wrapperPath,
        loaded: true,
        exports: async callback => callback(client),
    };

    return require(modelPath);
};

const main = async () => {
    const executedQueries = [];
    const client = {
        query: async (sql, params) => {
            executedQueries.push({
                sql: String(sql).replace(/\s+/g, " ").trim(),
                params,
            });

            switch (executedQueries.length) {
                case 1:
                    return { rows: [{ total: "1" }] };
                case 2:
                    return {
                        rows: [
                            {
                                id: 7,
                                subgroup_code: "SG01",
                                subgroup_name: "Subgroup 01",
                                item_group_id: 2,
                                group_id: 1,
                                group_code: "GR01",
                                group_name: "Group 01",
                            },
                        ],
                    };
                case 3:
                    return {
                        rows: [
                            {
                                id: 99,
                                code: "MAT-001",
                                name: "Test Material",
                                description: "Desc",
                                long_text: null,
                                unit_of_measurement: "EA",
                            },
                        ],
                    };
                case 4:
                    return { rows: [] };
                default:
                    throw new Error(`Unexpected query #${executedQueries.length}`);
            }
        },
    };

    const Material = loadMaterialModel(client);
    const result = await Material.getMaterialsBySubGroup(7, 1, 10, "", "code", "asc");

    assert.equal(result.materials.length, 1);
    assert.match(executedQueries[2].sql, /ORDER BY m\.code ASC/i);

    console.log("material-model test passed");
};

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
