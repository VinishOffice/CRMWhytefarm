const express = require("express");
const { orders: ordersController, history: historyController } = require("../../controllers/ordersController");
const operationsRouter = require("./operations");

const router = express.Router();

router.get("/", ordersController.list);
router.post("/query", ordersController.query);
router.use("/operations", operationsRouter);
router.get("/:id", ordersController.getById);
router.post("/", ordersController.create);
router.patch("/:id", ordersController.update);
router.put("/:id", ordersController.set);
router.delete("/:id", ordersController.remove);

router.get("/history/all", historyController.list);
router.post("/history/query", historyController.query);
router.get("/history/:id", historyController.getById);
router.post("/history", historyController.create);
router.patch("/history/:id", historyController.update);
router.put("/history/:id", historyController.set);
router.delete("/history/:id", historyController.remove);

module.exports = router;
