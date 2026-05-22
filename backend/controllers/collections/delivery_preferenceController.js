const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['delivery_preference'] || mongoose.model('delivery_preference', schema, 'delivery_preference');

module.exports = createController(Model);
