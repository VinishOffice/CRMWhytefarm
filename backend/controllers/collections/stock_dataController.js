const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['stock_data'] || mongoose.model('stock_data', schema, 'stock_data');

module.exports = createController(Model);
