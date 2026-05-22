const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['userDetails'] || mongoose.model('userDetails', schema, 'userDetails');

module.exports = createController(Model);
