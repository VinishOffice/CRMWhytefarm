const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['farm_stock_data'] || mongoose.model('farm_stock_data', schema, 'farm_stock_data');

module.exports = createController(Model);
