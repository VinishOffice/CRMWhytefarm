const express = require("express");
const ops = require("../../controllers/subscriptionsOperationsController");

const router = express.Router();

router.get("/options", ops.options);
router.post("/report", ops.report);
router.post("/future-orders", ops.futureOrders);
router.post("/paused", ops.pausedReport);
router.post("/auto-paused", ops.autoPausedReport);
router.post("/current", ops.currentSubscriptions);

module.exports = router;
