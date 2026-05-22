const mongoose = require('mongoose');

const schema = new mongoose.Schema({}, { strict: false }, { collection: 'farm_stock_history' });

module.exports = mongoose.model('FarmStockHistory', schema, 'farm_stock_history');
