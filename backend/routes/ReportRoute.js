const express = require("express");
const router = express.Router();
const ReportController = require("../controllers/ReportController");

router.get("/sumpos", ReportController.generateSummaryTicketPosition);
router.get("/detpos", ReportController.generateReportDetailTicketPosition);
router.get("/repxls", ReportController.exportWorkbookReportSummaryTicketPos);

module.exports = router;
