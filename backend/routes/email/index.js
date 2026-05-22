const express = require("express");
const controller = require("../../controllers/emailController");
const rateLimit = require("express-rate-limit")

const router = express.Router();

const emailRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max:50,
    message:"Too many requests from this IP, please try again after 15 minutes",
});

router.post("/list", emailRateLimit, controller.listEmails);
router.post("/send", emailRateLimit, controller.sendEmail);

module.exports = router;

