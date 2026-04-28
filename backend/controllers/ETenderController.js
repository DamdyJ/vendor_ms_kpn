const ETenderController = {};
const ETenderModel = require("../models/ETenderModel");

ETenderController.GenerateToken = async (req, res) => {
    try {
        const { user_id } = req.cookies;
        const { type } = req.body;
        const access_token = await ETenderModel.GenerateToken(user_id, type);
        res.status(200).send({
            token: access_token,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

ETenderController.GetUserData = async (req, res) => {
    try {
        const { user_id } = req.cookies;
        const data_user = await ETenderModel.GetUserData(user_id);
        res.status(200).send({
            data: data_user,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: error.message,
        });
    }
};

module.exports = ETenderController;
