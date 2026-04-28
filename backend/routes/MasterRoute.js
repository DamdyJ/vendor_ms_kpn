const express = require("express");
const router = express.Router();
const controller = require("../controllers/MasterController");
const Auth = require("../middleware/tokenmanager");

router.post("/country", controller.getCountry);
router.post("/city", controller.getCity);
router.get("/curr", controller.getCurrency);
router.get("/bank", controller.getBank);
router.get("/banksap", controller.getBankSAP);
router.get("/company", controller.getCompany);
router.get("/file/:filename", controller.downloadFile);
router.get("/genqr", controller.genQrcode);
router.get("/payterm", controller.getPayterm);
router.post("/ssrbank", controller.getBankSSR);
router.post("/addbank", controller.insertBank);
router.post("/deletebank", controller.deleteBank);
router.get("/filetype", controller.getFileType);
router.get("/phonecode", controller.getPhoneCode);
router.get("/getporg", controller.getPurOrg);
router.get("/getvat", controller.getVatType);
router.get("/bu", controller.getBU);
router.get("/dept", controller.getDept);
router.get("/budept", controller.GetBuAndDeptCombi);
router.get("/emprole", controller.getEmpRole);
router.get("/title", controller.GetTitle);
router.get("/badanus", controller.GetBadanUsaha);

//CG Master Data
router.get("/cg/venclass", controller.CGVenClass);
router.get("/cg/usedtax", controller.CGUsedTax);
router.get("/cg/payterm", controller.CGPayTerm);
router.get("/cg/priceterm", controller.CGPriceTerm);
router.get("/cg/currency", controller.CGCurrency);
router.get("/cg/country", controller.CGCountry);
router.get("/cg/area", controller.CGArea);
router.get("/cg/ventype", controller.CGVenType);
router.get("/cg/banks", controller.CGBank);

module.exports = router;
