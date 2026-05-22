const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['hubs_data'] || mongoose.model('hubs_data', schema, 'hubs_data');

module.exports = createController(Model);