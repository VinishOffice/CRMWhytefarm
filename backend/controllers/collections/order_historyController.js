const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['order_history'] || mongoose.model('order_history', schema, 'order_history');

module.exports = createController(Model);
