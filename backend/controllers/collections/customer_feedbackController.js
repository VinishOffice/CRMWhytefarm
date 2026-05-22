const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['customer_feedback'] || mongoose.model('customer_feedback', schema, 'customer_feedback');

module.exports = createController(Model);
