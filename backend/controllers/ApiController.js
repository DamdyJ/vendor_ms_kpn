const Vendor = require("../models/VendorModel");

exports.getData = async (req, res) => {
    try {
        const data = await Vendor.allVerified();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch data",
            error: error.message,
        });
    }
};
