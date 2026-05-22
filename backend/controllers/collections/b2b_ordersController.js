const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['b2b_orders'] || mongoose.model('b2b_orders', schema, 'b2b_orders');

module.exports = createController(Model);
