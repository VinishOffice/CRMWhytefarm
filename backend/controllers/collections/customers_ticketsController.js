const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['customers_tickets'] || mongoose.model('customers_tickets', schema, 'customers_tickets');

module.exports = createController(Model);
