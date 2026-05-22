const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['hubs_users_data'] || mongoose.model('hubs_users_data', schema, 'hubs_users_data');

module.exports = createController(Model);
