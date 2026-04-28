const db = require("../config/connection");
const moment = require("moment");
const axiosInstance = require("../helper/axiosInstance");
const TRANS = require("../config/transaction");
const Crud = require("../helper/crudquery");
const { Client } = require("pg");

const CGApi = {};

CGApi.CheckSessionCGExist = async () => {
    try {
        const client = await db.connect();
        let need_reset = false;
        try {
            const user_id = process.env.CGUSERNAME;
            const cg_password = process.env.CGPASSWORD;
            const today = moment();
            const { rows } = await client.query(
                `
              select user_id, token_expired_at, token from
              cg_sess_store where user_id = $1
              `,
                [user_id]
            );
            const data = rows[0];
            let token, expired_at;
            if (rows.length < 1) {
                need_reset = true;
            } else {
                token = data?.token;
                expired_at = moment(data.token_expired_at);
                if (expired_at.isBefore(today)) {
                    need_reset = true;
                }
            }
            if (need_reset) {
                const token_refresh = await CGApi.RefreshToken(
                    user_id,
                    cg_password
                );
                token = token_refresh;
            }
            return {
                user_id: user_id,
                token: token,
            };
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

CGApi.GetVendorData = async (q, token, user_id) => {
    try {
        const axios = axiosInstance(token);
        const usermdm = process.env.CGUSERMDM;
        const { data } = await axios.post("/get/vendor_search", {
            Company_Code: process.env.CGCOMP,
            Vendor_Name: q,
            User_ID: usermdm,
        });
        const return_data = data.data.map(value => ({
            ...value,
            address: [
                value.Address_1,
                value.Address_2,
                value.Address_3,
                value.Address_4,
                value.Address_5,
            ].join(" "),
        }));
        return return_data;
    } catch (error) {
        throw error;
    }
};

CGApi.RefreshToken = async (username, password) => {
    try {
        const client = await db.connect();
        try {
            const axios = axiosInstance();
            const { data } = await axios.post("/login", {
                username: username,
                password: password,
            });
            const token = data.accessToken;
            const expire_at = moment(data.expireAt).toISOString();
            const today = moment().toISOString();
            await client.query(TRANS.BEGIN);
            let method = "update";
            const { rowCount: check_exist } = await client.query(
                `select user_id from cg_sess_store where user_id = $1`,
                [username]
            );
            if (check_exist == 0) {
                method = "insert";
            }
            let que, val;
            switch (method) {
                case "insert":
                    [que, val] = Crud.insertItem("cg_sess_store", {
                        user_id: username,
                        token_expired_at: expire_at,
                        token: token,
                    });
                    break;
                case "update":
                    [que, val] = Crud.updateItem(
                        "cg_sess_store",
                        {
                            token_expired_at: expire_at,
                            token: token,
                            create_at: today,
                        },
                        {
                            user_id: username,
                        }
                    );
                    break;
            }
            await client.query(que, val);
            await client.query(TRANS.COMMIT);
            return token;
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        throw error;
    }
};

/**
 * @param {Client} client
 * @param {string} ven_id
 */
CGApi.SubmitToTiptop = async (client, ven_id, user_id) => {
    try {
        //get token cg
        const token = await CGApi.RefreshToken(
            process.env.CGUSERNAME,
            process.env.CGPASSWORD
        );
        const axios = axiosInstance(token);
        const { rows } = await client.query(
            `
            select
            case
                when v.badan_usaha is not null then v.name_1 || ' ' || v.badan_usaha 
                else v.name_1
            end as name_1,
            v.ven_class,
            v.ven_type,
            v.npwp as uniform,
            v.pay_term,
            v.pay_mthd as price_term,
            v.lim_curr as used_curr,
            v.used_tax ,
            v.country,
            cmc.area_code,
            v.postal,
            v.street,
            v.street2,
            v.street3,
            v.street4,
            v.city,
            v.nama_pic,
            v.fax,
            concat(mpc.prefix, v.no_telf_pic) as no_telf_pic, 
            v.email_pic
        from
            vendor v
        left join cg_mst_country cmc on
            cmc.country_code = v.country
        left join mst_phone_code mpc on mpc.territory = v.country 
        where
            ven_id = $1  
            `,
            [ven_id]
        );
        const data_ven = rows[0];

        const { rows: data_banks } = await client.query(
            `
            select
                bank_id as swiftcode,
                bank_acc,
                acc_hold
            from
                ven_bank
            where
                ven_id = $1
                and is_active = true
            `,
            [ven_id]
        );
        const payload = {
            Company_Code: process.env.CGCOMP,
            Vendor_Name: data_ven.name_1,
            Vendor_Class: data_ven.ven_class,
            Vendor_Type: data_ven.ven_type,
            Uniform: data_ven.uniform,
            Payment_Terms: data_ven.pay_term,
            Price_Terms: data_ven.price_term,
            Used_Curr: data_ven.used_curr,
            Used_Tax: data_ven.used_tax,
            Country: data_ven.country,
            Area: data_ven.area_code,
            Zip_Code: data_ven.postal,
            Address_1: data_ven.street,
            Address_2: data_ven.street2,
            Address_3: data_ven.street3,
            Address_4: data_ven.street4,
            Address_5: data_ven.city,
            Fax: data_ven.fax ?? "",
            User_ID: user_id,
            Data_Contact: [
                {
                    Contact_Name: data_ven.nama_pic,
                    Contact_Phone: data_ven.no_telf_pic,
                    Contact_Email: data_ven.email_pic,
                },
            ],
            Data_Bank: data_banks.map(val => ({
                Bank_Code: val.swiftcode,
                Account_No: val.bank_acc,
                Account_Name: val.acc_hold,
            })),
        };
        const { data } = await axios.post(`/act/apmi600`, payload);
        const ven_code = data.vendor_no;
        const [upQue, upVal] = Crud.updateItem(
            "vendor",
            {
                ven_code: ven_code,
            },
            {
                ven_id: ven_id,
            }
        );
        await client.query(upQue, upVal);
        return { name: data_ven.name_1, ven_code };
    } catch (error) {
        throw error;
    }
};

module.exports = CGApi;
