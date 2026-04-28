const ReportModel = require("../models/ReportModel");
const moment = require("moment");

const ReportController = {
    generateSummaryTicketPosition: async (req, res) => {
        try {
            const { bu_id, dept_id, from, to } = req.query;
            const result = await ReportModel.GenerateSummaryTicketPosition(
                bu_id,
                dept_id,
                from,
                to
            );
            res.status(200).send({
                data: result,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },
    generateReportDetailTicketPosition: async (req, res) => {
        try {
            const { bu_id, dept_id, from, to } = req.query;
            const result = await ReportModel.GenerateDetailReportTicketPosition(
                bu_id,
                dept_id,
                from,
                to
            );
            res.status(200).send({
                data: result,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },

    exportWorkbookReportSummaryTicketPos: async (req, res) => {
        try {
            const { bu_id, dept_id, from, to } = req.query;
            const workbook = await ReportModel.ExportExcelSummaryTicketPosition(
                bu_id,
                dept_id,
                from,
                to
            );
            let today = moment().unix();
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=" +
                    `ReportSummaryTicket-${bu_id ?? "NAN"}-${
                        dept_id ?? "NAN"
                    }-${today}.xlsx`
            );
            await workbook.xlsx.write(res);
            res.status(200);
            res.end();
        } catch (error) {
            console.error(error);
            res.status(500).send({
                message: error.message,
            });
        }
    },
};

module.exports = ReportController;
