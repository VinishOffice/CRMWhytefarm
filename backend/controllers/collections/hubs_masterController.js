const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['hubs_master'] || mongoose.model('hubs_master', schema, 'hubs_master');

module.exports = createController(Model);
