const express = require("express");
const controller = require("../../controllers/analyticsOperationsController");

const router = express.Router();

router.post("/operations/predictive-analysis", controller.predictiveAnalysis);

module.exports = router;

