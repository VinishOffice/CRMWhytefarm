const express = require("express");
const controller = require("../../controllers/usersController");
const usersAuthController = require("../../controllers/usersAuthController");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const loginLimit = rateLimit({
    windowMs: 1 * 60 * 1000,
    max:2,
    message:"Too many login attempts, please try again later",

});


router.get("/", controller.list);
router.post("/login", loginLimit, usersAuthController.login);
router.post("/signup", usersAuthController.signup);
router.post("/query", controller.query);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.put("/:id", controller.set);
router.delete("/:id", controller.remove);

module.exports = router;
