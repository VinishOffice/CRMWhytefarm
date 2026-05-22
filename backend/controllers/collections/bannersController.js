const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['banners'] || mongoose.model('banners', schema, 'banners');

module.exports = createController(Model);
