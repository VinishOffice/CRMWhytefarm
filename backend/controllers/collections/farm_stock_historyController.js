const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['farm_stock_history'] || mongoose.model('farm_stock_history', schema, 'farm_stock_history');

module.exports = createController(Model);
