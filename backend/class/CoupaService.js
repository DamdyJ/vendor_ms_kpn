const axios = require("axios");
const CoupaSession = require("./CoupaSessionClass");
const config = require("../config/cpConn");

class CoupaService {
    static async fetchData(date) {
        if (!date) {
            throw new Error("date query is required");
        }

        if (isNaN(Date.parse(date))) {
            throw new Error("Invalid date format (YYYY-MM-DD)");
        }

        let token = CoupaSession.getToken();
        if (!token) token = await CoupaSession.login();

        const params = {
            status: "approved",
            "custom-fields[send-to-vms]": false,
            "updated-at[gt_or_eq]": date,
        };

        try {
            const response = await axios.get(
                `${config.BASE_URL}/api/supplier_information`,
                {
                    params,
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                token = await CoupaSession.login();
                const retry = await axios.get(
                    `${config.BASE_URL}/api/supplier_information`,
                    {
                        params,
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },
                    }
                );
                return retry.data;
            }
            throw error;
        }
    }

    static async getDetail(id) {
        if (!id) {
            throw new Error("id is required");
        }

        let token = CoupaSession.getToken();
        if (!token) token = await CoupaSession.login();

        const params = {
            supplier_id: id,
        };

        try {
            const response = await axios.get(
                `${config.BASE_URL}/api/supplier_information`,
                {
                    params,
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                token = await CoupaSession.login();
                const retry = await axios.get(
                    `${config.BASE_URL}/api/supplier_information`,
                    {
                        params,
                        headers: {
                            Authorization: `Bearer ${token}`,
                            Accept: "application/json",
                        },
                    }
                );
                return retry.data;
            }
            throw error;
        }
    }
    static async updateData(id) {
        if (!id) {
            throw new Error("id is required");
        }

        let token = CoupaSession.getToken();
        if (!token) token = await CoupaSession.login();

        const response = await axios.put(
            `${config.BASE_URL}/api/supplier_information/${id}`,
            {
                id: id,
                "custom-fields": {
                    "send-to-vms": true,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            }
        );

        return response.status;
    }
}

module.exports = CoupaService;
