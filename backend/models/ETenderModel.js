const DBClientWrapper = require("../helper/DBClientWrapper");
const jwt = require("jsonwebtoken");

const ETenderModel = {};

ETenderModel.GenerateToken = async (user_id, type) => {
    return await DBClientWrapper(async client => {
        try {
            const { rows, rowCount } = await client.query(
                `
        select email, fullname, username from all_users where user_id = $1
        `,
                [user_id]
            );
            const user_data = rows[0];
            if (!rowCount) {
                throw new Error("Not Exist");
            }
            const access_token = jwt.sign(
                { ...user_data, type: type },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "30s",
                }
            );
            return access_token;
        } catch (error) {
            throw error;
        }
    });
};

ETenderModel.GetUserData = async user_id => {
    return await DBClientWrapper(async client => {
        try {
            const { rows, rowCount } = await client.query(
                `
        select email, fullname, username from all_users where user_id = $1
        `,
                [user_id]
            );
            const user_data = rows[0];
            if (!rowCount) {
                throw new Error("Not Exist");
            }
            return user_data;
        } catch (error) {
            throw error;
        }
    });
};

module.exports = ETenderModel;
