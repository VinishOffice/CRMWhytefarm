const Orders = require("../models/schemas/orders");
const OrderHistory = require("../models/schemas/orderHistory");
const { createController } = require("./baseController");

const orders = createController(Orders);
const history = createController(OrderHistory);

module.exports = { orders, history };
