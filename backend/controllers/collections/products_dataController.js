const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['products_data'] || mongoose.model('products_data', schema, 'products_data');

module.exports = createController(Model);
