const express = require("express");
const operations = require("../../controllers/ordersOperationsController");

const router = express.Router();

router.post("/report", operations.report);
router.post("/sheet", operations.sheet);
router.get("/hub-delivery-options", operations.hubDeliveryOptions);
router.post("/hub-delivery-report", operations.hubDeliveryReport);
router.get("/b2b-summary", operations.b2bSummary);
router.get("/b2b-missing", operations.b2bMissing);
router.post("/onetime-report", operations.onetimeReport);
router.get("/cod", operations.codList);
router.post("/cod/update", operations.codUpdateItem);

module.exports = router;
