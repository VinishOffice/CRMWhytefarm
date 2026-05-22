const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['bulk_update_quantity'] || mongoose.model('bulk_update_quantity', schema, 'bulk_update_quantity');

module.exports = createController(Model);
