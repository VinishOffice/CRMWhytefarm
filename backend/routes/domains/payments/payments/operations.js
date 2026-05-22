const express = require("express");
const controller = require("../../../../controllers/paymentsOperationsController");

const router = express.Router();

router.post("/create-payment-link", controller.createPaymentLink);

module.exports = router;

