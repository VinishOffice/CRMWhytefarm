const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['trai_orders'] || mongoose.model('trai_orders', schema, 'trai_orders');

module.exports = createController(Model);
