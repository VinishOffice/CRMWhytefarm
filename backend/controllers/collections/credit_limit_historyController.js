const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['credit_limit_history'] || mongoose.model('credit_limit_history', schema, 'credit_limit_history');

module.exports = createController(Model);
