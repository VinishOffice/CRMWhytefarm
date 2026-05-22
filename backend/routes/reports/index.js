const express = require("express");
const controller = require("../../controllers/reportsOperationsController");
const rateLimit = require('express-rate-limit');

const router = express.Router();

const operationRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max:50,
    message:"Too many requests from this IP, please try again after 15 minutes",

});

router.get("/operations/options", controller.options);
router.post("/operations/cumulative-sales", operationRateLimit, controller.cumulativeSales);
router.post("/operations/sales", operationRateLimit, controller.salesReport);
router.post("/operations/return", operationRateLimit, controller.returnReport);

module.exports = router;

