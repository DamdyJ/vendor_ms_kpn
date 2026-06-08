const Master = require("../models/MasterModel");
const path = require("path");
const db = require("../config/connection");
const TRANS = require("../config/transaction");
const os = require("os");

const MasterController = {
    getCountry: async (req, res) => {
        try {
            const result = await Master.getCountry();
            res.status(200).send({
                status: 200,
                data: result,
            });
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: "failed to fetch data",
            });
        }
    },

    getCurrency: async (req, res) => {
        try {
            const result = await Master.getCurrency();
            res.status(200).send({
                status: 200,
                data: result,
            });
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: "failed to fetch data",
            });
        }
    },

    getBank: async (req, res) => {
        try {
            const result = await Master.getBank();
            res.status(200).send({
                status: 200,
                data: result,
            });
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: "failed to fetch data",
            });
        }
    },

    getCity: async (req, res) => {
        try {
            const countryId = req.body.countryId ? req.body.countryId : null;
            const result = await Master.getCities(countryId);
            res.status(200).send({
                status: 200,
                data: result,
            });
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: "failed to fetch data",
            });
        }
    },

    getCompany: async (req, res) => {
        try {
            const result = await Master.getCompany();
            res.status(200).send({
                status: 200,
                data: result,
            });
        } catch (error) {
            res.status(500).send({
                status: 500,
                message: "failed to fetch data",
            });
        }
    },

    downloadFile: async (req, res) => {
        const filename = req.params.filename;
        let pathDwn = "";
        if (os.platform() === "linux") {
            pathDwn = `${path.resolve()}/backend/public/${filename}`;
        } else {
            pathDwn = `${path.resolve()}\\backend\\public\\${filename}`;
        }
        res.download(pathDwn, err => {
            if (err) {
                // Handle errors here
                console.error("Error during download:", err);
                res.status(500).send({
                    message: "error during download",
                });
            } else {
                // Download was successful
                console.log("File downloaded successfully");
            }
        });
    },

    genQrcode: async (req, res) => {
        try {
            const qrcode = await Master.genQrAuth();
            res.status(200).send(qrcode);
        } catch (error) {
            console.log(error);
            res.status(500).send(error);
        }
    },

    getPayterm: async (req, res) => {
        const client = await db.connect();
        try {
            const payTerm = await client.query(`SELECT * FROM MST_PAY_TERM`);
            res.status(200).send({
                count: payTerm.rowCount,
                data: payTerm.rows,
            });
        } catch (error) {
            console.error(error.message);
            res.status(500).send({
                message: error.message,
            });
        } finally {
            client.release();
        }
    },
    getBankSAP: async (req, res) => {
        const client = await db.connect();
        try {
            const country = req.query.country === "" ? "ID" : req.query.country;
            const payTerm = await client.query(
                `SELECT * FROM MST_BANK_SAP WHERE country='${country}'`
            );
            res.status(200).send({
                count: payTerm.rowCount,
                data: payTerm.rows,
            });
        } catch (error) {
            console.error(error.message);
            res.status(500).send({
                message: error.message,
            });
        } finally {
            client.release();
        }
    },
    getBankSSR: async (req, res) => {
        try {
            const data = await Master.getssrBank({
                page: req.body.page,
                maxPage: req.body.maxPage,
                que: req.body.que,
            });
            res.status(200).send(data);
        } catch (error) {
            res.status(500).send({ message: error.message });
        }
    },
    insertBank: async (req, res) => {
        try {
            const insertitem = await Master.createNewBank(req.body);
            res.status(200).send(insertitem);
        } catch (error) {
            res.status(500).send({ message: error.message });
        }
    },
    deleteBank: async (req, res) => {
        const client = await db.connect();
        try {
            await client.query(TRANS.BEGIN);
            const deleteBank = await client.query(
                `delete from mst_bank_sap where id = ${req.body.id} returning bank_name`
            );
            res.status(200).send({ name: deleteBank.rows[0].bank_name });
            await client.query(TRANS.COMMIT);
        } catch (error) {
            await client.query(TRANS.ROLLBACK);
            res.status(500).send({ message: error.message });
            console.log(error);
        } finally {
            client.release();
        }
    },

    getFileType: async (req, res) => {
        try {
            const { title, ventype, bu_id, curpos, trade } = req.query;
            const result = await Master.GetFileType({
                title,
                ventype,
                bu_id,
                curpos,
                trade,
            });
            res.status(200).send({ data: result });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },

    getPhoneCode: async (req, res) => {
        try {
            const client = await db.connect();
            const countryId = req.query.id;
            // console.log(countryId);
            try {
                const { rows: phoneCode } = await client.query(
                    `select prefix from mst_phone_code where territory = $1`,
                    [countryId]
                );
                // console.log(phoneCode);
                res.status(200).send({
                    code: phoneCode[0].prefix,
                });
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },

    getPurOrg: async (req, res) => {
        try {
            const { limit, offset, company, q } = req.query;
            if (!company) {
                throw new Error("Provide Company First");
            }
            const client = await db.connect();
            try {
                const { rows } = await client.query(
                    `select distinct porg_id from mst_porg mp
                    left join mst_company mc on mc.sap_code = mp.company_code
                    where mc.comp_id = $1 and porg_id like $2 order by porg_id limit $3 offset $4 `,
                    [company, `%${q}%`, limit, offset]
                );
                const { rowCount } = await client.query(
                    `select distinct porg_id from mst_porg mp
                    left join mst_company mc on mc.sap_code = mp.company_code
                    where mc.comp_id = $1 and porg_id like $2 order by porg_id `,
                    [company, `%${q}%`]
                );

                res.status(200).send({
                    data: rows,
                    count: rowCount,
                });
            } catch (error) {
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },

    getVatType: async (req, res) => {
        try {
            const result = await Master.getVAT();
            res.status(200).send({ data: result });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },
    getBU: async (req, res) => {
        try {
            const data = await Master.getBU();
            res.status(200).send({ data: data });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },
    getDept: async (req, res) => {
        try {
            const data = await Master.getDept();
            res.status(200).send({ data: data });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },
    getEmpRole: async (req, res) => {
        try {
            const data = await Master.getEmpRole();
            res.status(200).send({ data: data });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },
    CGVenClass: async (req, res) => {
        try {
            const data = await Master.CGVenClass();
            res.status(200).send({
                data: data,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },
    CGVenType: async (req, res) => {
        try {
            const data = await Master.CGVenType();
            res.status(200).send({
                data: data,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },
    CGUsedTax: async (req, res) => {
        try {
            const data = await Master.CGUsedTax();
            res.status(200).send({
                data: data,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },
    CGPriceTerm: async (req, res) => {
        try {
            const data = await Master.CGPriceTerm();
            res.status(200).send({
                data: data,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },
    CGPayTerm: async (req, res) => {
        try {
            const data = await Master.CGPayTerm();
            res.status(200).send({
                data: data,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },
    CGCurrency: async (req, res) => {
        try {
            const data = await Master.CGCurrency();
            res.status(200).send({
                data: data,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },
    CGCountry: async (req, res) => {
        try {
            const data = await Master.CGCountry();
            res.status(200).send({
                data: data,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },
    CGArea: async (req, res) => {
        try {
            const data = await Master.CGArea();
            res.status(200).send({
                data: data,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },
    CGBank: async (req, res) => {
        try {
            const data = await Master.CGBank();
            res.status(200).send({
                data: data,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },
    GetBadanUsaha: async (req, res) => {
        try {
            const data = await Master.GetMasterBadanUsaha();
            res.status(200).send({
                data: data,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },

    GetTitle: async (req, res) => {
        try {
            const data = await Master.GetMasterTitle();
            res.status(200).send({
                data: data,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },

    GetBuAndDeptCombi: async (req, res) => {
        try {
            const result = await Master.GetExistedDeptofBU();
            res.status(200).send({
                data: result,
            });
            return;
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },
};

module.exports = MasterController;
