const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['cradit_limit_call_test'] || mongoose.model('cradit_limit_call_test', schema, 'cradit_limit_call_test');

module.exports = createController(Model);
