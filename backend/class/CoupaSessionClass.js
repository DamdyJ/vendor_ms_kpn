const axios = require("axios");
const config = require("../config/cpConn");

let token = null;

class CoupaSession {
    static async login() {
        const params = new URLSearchParams();
        params.append("grant_type", "client_credentials");
        params.append("client_id", config.USERNAME);
        params.append("client_secret", config.PASSWORD);

        const response = await axios.post(
            `${config.BASE_URL}/oauth2/token`,
            params,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Accept: "application/json",
                },
            }
        );

        token = response.data.access_token;
        console.log(
            "[CoupaSession] New token:",
            token.substring(0, 20) + "..."
        ); // debug
        return token;
    }

    static getToken() {
        return token;
    }
}

module.exports = CoupaSession;
