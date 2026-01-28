const CoupaService = require("../class/CoupaService");

exports.getData = async (req, res) => {
    try {
        let date = req.body.date;
        if (!date) {
            const d = new Date();
            d.setDate(d.getDate() - 3);
            date = d.toISOString().slice(0, 10);
        }
        const rawData = await CoupaService.fetchData(date);

        const filteredData = rawData.map(item => ({
            coupa_id: item.id,
            name: item.name,
            vendor_name: item["display-name"],
            vendor_code: item["supplier-number"],
            status: item.status,
            updated_at: item["updated-at"],
        }));

        res.json({
            success: true,
            data: filteredData,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getDetail = async (req, res) => {
    try {
        const id = req.body.id;
        if (!id) throw new Error("id is required");
        const data = await CoupaService.getDetail(id);

        res.json({
            success: true,
            data,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
