const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['customer_activities'] || mongoose.model('customer_activities', schema, 'customer_activities');

module.exports = createController(Model);
