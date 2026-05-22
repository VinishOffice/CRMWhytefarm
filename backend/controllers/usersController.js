const Users = require("../models/schemas/users");
const { createController } = require("./baseController");

module.exports = createController(Users);
