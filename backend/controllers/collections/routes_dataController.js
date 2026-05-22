const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['routes_data'] || mongoose.model('routes_data', schema, 'routes_data');

module.exports = createController(Model);
