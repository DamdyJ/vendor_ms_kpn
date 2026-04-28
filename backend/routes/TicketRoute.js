const express = require("express");
const router = express.Router();
const controller = require("../controllers/TicketController");
const AuthToken = require("../middleware/tokenmanager");

router.post("/new", AuthToken.authSession, controller.openNew);
router.get("/form/new/:tnum", controller.headerTicket);
router.get("/form/:id", AuthToken.authSession, controller.getTicketById);
router.get("/newform/:id", controller.getTicketById); // get ticket by id ;
router.post("/form/submit", AuthToken.authSession, controller.submitTicketv2);
router.post("/newform/submit", controller.submitTicketv2);
router.post("/form/submitv2", AuthToken.authSession, controller.submitTicketv2);
//reminder email approval
router.post(
    "/reminderappr",
    AuthToken.authSession,
    controller.ReminderApproval
);
router.post("/form/v1/submit", controller.singleSubmit);
router.get("/", AuthToken.authSession, controller.ShowAllv2);
router.patch("/reject", AuthToken.authSession, controller.RejectTicketv2);
router.delete("/:ticket_id", controller.deleteTicket);
router.get("/mgrappr", controller.processMgrv2);
router.get("/mgrrej", controller.rejectMgrv2);
router.get("/mgrapprprc", controller.processMgrPrc);
// router.get("/mgrapprdws",)
router.get("/mgrtest", controller.testmgr);
router.post("/rejectmgr", controller.RejectMgrbyLink);
router.post("/rejectmgrprc", controller.rejectformgrproc);
router.get("/rejectlog", controller.rejectLog);
router.post("/checkvalid", controller.checkValidTicket);
router.post("/extexp", AuthToken.authSession, controller.extendOneDay);
router.post("/resendceo", AuthToken.authSession, controller.resendCEO);

module.exports = router;
