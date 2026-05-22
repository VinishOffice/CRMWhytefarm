const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['cart_data'] || mongoose.model('cart_data', schema, 'cart_data');

module.exports = createController(Model);
