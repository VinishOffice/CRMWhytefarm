const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['tickets'] || mongoose.model('tickets', schema, 'tickets');

module.exports = createController(Model);
