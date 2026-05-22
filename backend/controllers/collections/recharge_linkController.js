const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['recharge_link'] || mongoose.model('recharge_link', schema, 'recharge_link');

module.exports = createController(Model);
