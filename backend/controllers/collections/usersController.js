const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['users'] || mongoose.model('users', schema, 'users');

module.exports = createController(Model);
