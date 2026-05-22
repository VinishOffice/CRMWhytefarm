const express = require("express");
const controller = require("../../controllers/telephonyController");

const router = express.Router();

router.get("/knowlarity/calllogs", controller.getKnowlarityCallLogs);
router.post("/knowlarity/makecall", controller.makeKnowlarityCall);

module.exports = router;

