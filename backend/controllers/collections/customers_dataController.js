const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['customers_data'] || mongoose.model('customers_data', schema, 'customers_data');

module.exports = createController(Model);
