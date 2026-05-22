const express = require("express");
const walletController = require("../../controllers/walletController");

const router = express.Router();

router.get("/report", walletController.report);
router.post("/reconcile", walletController.reconcile);
router.post("/verify-ledger", walletController.verifyLedger);

module.exports = router;
