const express = require("express");
const route = express.Router();
const controller = require("../controllers/CoupaController");

route.post("/vendor/list", controller.getData);
route.post("/vendor/detail", controller.getDetail);
route.post("/vendor/update", controller.updateVendor);

module.exports = route;
