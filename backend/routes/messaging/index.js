const express = require("express");
const controller = require("../../controllers/messagingController");

const router = express.Router();

router.post("/wati/send-template", controller.sendWatiTemplate);
router.get("/wati/templates", controller.listWatiTemplates);
router.get("/textlocal/templates", controller.listTextLocalTemplates);
router.post("/textlocal/send-sms", controller.sendTextLocalSms);

module.exports = router;

