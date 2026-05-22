const express = require("express");
const controller = require("../../controllers/customersOperationsController");

const router = express.Router();

// Credit / low credit report
router.post("/low-credit-report", controller.lowCreditReport);
router.get("/credit-history/today", controller.todayCreditHistory);
router.post("/give-credit", controller.giveCredit);

// Lifecycle report
router.get("/lifecycle/options", controller.lifecycleOptions);
router.post("/lifecycle/report", controller.lifecycleReport);

module.exports = router;

