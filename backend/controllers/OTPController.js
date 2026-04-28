const db = require("../config/connection");
const mailer = require("../config/emailer");
const TRANS = require("../config/transaction");
const OTP = require("../models/OTPModel");
const bcrypt = require("bcryptjs");

const OTPController = {};

OTPController.sendOTP = async (req, res) => {
    const client = await db.connect();
    try {
        const username = req.body.username;
        if (username === "" || username === undefined) {
            throw new Error("Provide username");
        }
        const fetchData = await client.query(
            `SELECT * FROM 
            (SELECT USERNAME,
                PASSWORD,
                FULLNAME,
                ROLE,
                USER_GROUP,
                USER_ID,
                EMAIL
            FROM MST_USER
            UNION
            SELECT USERNAME,
                PASSWORD,
                FULLNAME,
                ROLE,
                USER_GROUP,
                MGR_ID AS USER_ID,
                EMAIL
            FROM MST_MGR
            UNION
            SELECT USERNAME,
                PASSWORD,
                FULLNAME,
                DEPARTMENT AS ROLE,
                USER_GROUP_ID AS USER_GROUP,
                USER_ID,
                EMAIL
            FROM A_USERVENDOR)
            AS user_vms
            where USERNAME = $1`,
            [username]
        );
        if (fetchData.rowCount < 1) {
            throw new Error("Username not found");
        }
        const userData = fetchData.rows[0];
        const params = {
            user_id: userData.user_id,
        };
        const otp_code = await OTP.createOTP(params);
        const setup = {
            from: process.env.SMTP_USERNAME,
            to: userData.email,
            subject: `Reset Password OTP - Vendor Management System App`,
            text: `This is your OTP Code : ${otp_code}, this code will expired after 5 minute. Please insert before expiry time`,
        };
        const emailres = await mailer.sendMail(setup);
        console.log(emailres);
        res.cookie("user_id", userData.user_id);
        res.status(200).send({
            message: "OTP code sent",
            user_id: userData.user_id,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: error.message,
        });
    } finally {
        client.release();
    }
};

OTPController.validateOTP = async (req, res) => {
    const client = await db.connect();
    try {
        const cookies = req.cookies;
        const user_id = cookies.user_id;
        const OTPInput = req.body.OTP;
        if (user_id === "" || user_id === undefined) {
            throw new Error("User is missing");
        }
        if (OTPInput === "" || OTPInput === undefined) {
            throw new Error("Please provide OTP code");
        }
        const checkOTP = await client.query(
            `select otp_code, otp_timelimit from otp_transaction where user_id = $1`,
            [user_id]
        );
        const otp_timelimit = new Date(checkOTP.rows[0].otp_timelimit);
        const now = new Date();
        if (now > otp_timelimit) {
            throw new Error("OTP Expired");
        }
        const otp_code = checkOTP.rows[0].otp_code;
        const compareOTP = bcrypt.compareSync(OTPInput, otp_code);
        if (compareOTP) {
            await client.query(TRANS.BEGIN);
            try {
                await client.query(
                    `update otp_transaction set inserted = true where user_id = $1`,
                    [user_id]
                );
                await client.query(TRANS.COMMIT);
            } catch (error) {
                await client.query(TRANS.ROLLBACK);
                throw error;
            }
            res.status(200).send({
                message: "Validation Success !",
            });
        } else {
            throw new Error("OTP Invalid");
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: error.message,
        });
    } finally {
        client.release();
    }
};

module.exports = OTPController;
