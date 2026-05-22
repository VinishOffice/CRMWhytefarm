const CustomerData = require("../models/schemas/customersData");
const { createController } = require("./baseController");

module.exports = createController(CustomerData);
