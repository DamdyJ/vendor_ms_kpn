const TRANS = require("../config/transaction");
const Crud = require("../helper/crudquery");
const DBClientWrapper = require("../helper/DBClientWrapper");
const { PostgresError } = require("pg-error-enum");

const MutexModel = {
    CreateLock: async (trans_id, create_by) => {
        return await DBClientWrapper(async client => {
            try {
                const { rowCount } = await client.query(
                    `select trans_id from mutex_transaction where trans_id = $1`,
                    [trans_id]
                );
                if (rowCount > 0) {
                    throw new Error(
                        "Transaction currently in progress, wait for lock release"
                    );
                }
                await client.query(TRANS.BEGIN);
                //insert lock key
                const [q, v] = Crud.insertItem("mutex_transaction", {
                    trans_id: trans_id,
                    user_id: create_by,
                });
                await client.query(q, v);
                await client.query(TRANS.COMMIT);
            } catch (error) {
                await client.query(TRANS.ROLLBACK);
                if (error?.code == PostgresError.UNIQUE_VIOLATION) {
                    throw new Error(
                        "Transaction currently in progress, wait for lock release"
                    );
                } else {
                    throw error;
                }
            }
        });
    },
    Unlock: async trans_id => {
        return await DBClientWrapper(async client => {
            try {
                await client.query(TRANS.BEGIN);
                //delete lock key
                await client.query(
                    "delete from mutex_transaction where trans_id = $1",
                    [trans_id]
                );
                await client.query(TRANS.COMMIT);
            } catch (error) {
                await client.query(TRANS.ROLLBACK);
                throw error;
            }
        });
    },
};

module.exports = MutexModel;
