const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['hubs_locations_data'] || mongoose.model('hubs_locations_data', schema, 'hubs_locations_data');

module.exports = createController(Model);