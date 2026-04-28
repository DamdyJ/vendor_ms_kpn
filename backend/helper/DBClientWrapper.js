const db = require("../config/connection");

// DBClientWrapper: acquires a client from the pool, invokes the callback,
// and ensures the client is released properly with error handling
const DBClientWrapper = async callback => {
    let client;
    try {
        client = await db.connect();
        const result = await callback(client);
        return result;
    } catch (error) {
        // rethrow after finally releases client
        throw error;
    } finally {
        try {
            if (client) client.release();
        } catch (releaseErr) {
            console.error(
                `[DBClientWrapper] error releasing client: ${
                    releaseErr && releaseErr.message
                }`
            );
        }
    }
};

module.exports = DBClientWrapper;
