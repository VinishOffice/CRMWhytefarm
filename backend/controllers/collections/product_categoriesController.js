const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['product_categories'] || mongoose.model('product_categories', schema, 'product_categories');

module.exports = createController(Model);
