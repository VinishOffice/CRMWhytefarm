const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['locations_data'] || mongoose.model('locations_data', schema, 'locations_data');

module.exports = createController(Model);
