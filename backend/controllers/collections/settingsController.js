const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['settings'] || mongoose.model('settings', schema, 'settings');

module.exports = createController(Model);
