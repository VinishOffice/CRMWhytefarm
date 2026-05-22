const express = require("express");
const controller = require("../../../../controllers/collections/cart_dataController.js");

const router = express.Router();

router.get("/", controller.list);
router.post("/query", controller.query);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.put("/:id", controller.set);
router.delete("/:id", controller.remove);

module.exports = router;
