const mongoose = require('mongoose');

const schema = new mongoose.Schema({}, { strict: false }, { collection: 'b2b_orders' });

module.exports = mongoose.model('B2bOrders', schema, 'b2b_orders');
