const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({
  _id: String,
}, { strict: false });
const Model = mongoose.models['user_permissions'] || mongoose.model('user_permissions', schema, 'user_permissions');

module.exports = createController(Model);
