const express = require("express");
const Model = require("../../../../models/schemas/payments.js");
const { createController } = require("../../../../controllers/baseController");
const operationsRouter = require("./operations");

const router = express.Router();
const controller = createController(Model);

router.use("/operations", operationsRouter);

router.get("/", controller.list);
router.post("/query", controller.query);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.put("/:id", controller.set);
router.delete("/:id", controller.remove);

module.exports = router;
