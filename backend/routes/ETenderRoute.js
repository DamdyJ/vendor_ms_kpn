const express = require("express");
const router = express.Router();
const ETenderController = require("../controllers/ETenderController");
const Auth = require("../middleware/tokenmanager");

router.post("/genacstoken", Auth.authSession, ETenderController.GenerateToken);
router.get("/getuser", Auth.authSession, ETenderController.GetUserData);

module.exports = router;
