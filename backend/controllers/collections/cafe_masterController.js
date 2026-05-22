const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['cafe_master'] || mongoose.model('cafe_master', schema, 'cafe_master');

module.exports = createController(Model);
