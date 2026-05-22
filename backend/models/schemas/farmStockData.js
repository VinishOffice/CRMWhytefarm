const mongoose = require('mongoose');

const schema = new mongoose.Schema({}, { strict: false }, { collection: 'farm_stock_data' });

module.exports = mongoose.model('FarmStockData', schema, 'farm_stock_data');
