const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['communication_history'] || mongoose.model('communication_history', schema, 'communication_history');

module.exports = createController(Model);
