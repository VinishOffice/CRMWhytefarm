const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['customers_vacation'] || mongoose.model('customers_vacation', schema, 'customers_vacation');

module.exports = createController(Model);
