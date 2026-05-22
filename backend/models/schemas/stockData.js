const mongoose = require('mongoose');

const schema = new mongoose.Schema({}, { strict: false }, { collection: 'stock_data' });

module.exports = mongoose.model('StockData', schema, 'stock_data');
