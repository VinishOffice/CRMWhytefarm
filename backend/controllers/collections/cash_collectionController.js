const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['cash_collection'] || mongoose.model('cash_collection', schema, 'cash_collection');

module.exports = createController(Model);
