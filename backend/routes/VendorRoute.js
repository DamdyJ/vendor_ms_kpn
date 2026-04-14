const express = require("express");
const route = express.Router();
const controller = require("../controllers/VendorController");
const AuthMiddleware = require("../middleware/tokenmanager");
const TokenManager = require("../middleware/tokenmanager");

route.get("/", controller.showAll);
route.post("/add/:id", controller.setVenDetail);
route.post("/uploadtemp", controller.setTempFile);
route.post("/uploadbankfile", controller.setBankFile);
route.get("/file/:id", controller.getFile);
route.get("/singlefile/:filename", controller.getSingleFile);
route.post(
    "/editexpdate",
    TokenManager.authSession,
    controller.EditExpiryDateFile
);
route.get("/bank/:id", controller.getBank);
route.delete("/file", controller.deleteTempId);
route.delete("/delfile", controller.deleteSavedId);
route.get("/checkven", controller.checkNameisExist);
route.post("/deletebank", controller.deleteVenBank);
route.post("/newbank", controller.newBank);
route.post("/verif", controller.verify);
route.get("/verif", controller.GetVendorVerif);
route.get("/verified", controller.GetVerifiedVendor);
route.post("/stage", controller.UploadStaging);
route.delete("/clearfilebank", controller.deleteFileBank);
route.get("/simple", AuthMiddleware.authSession, controller.GetSimpleData);
route.get("/syncstage", controller.SyncStagingVendor);
route.get("/getprogsync", controller.ShowProgressSyncSAP);
route.post("/scriptcutoff", controller.UploadCutoffVendorUser);

module.exports = route;
