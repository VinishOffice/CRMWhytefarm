const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['wallet_history'] || mongoose.model('wallet_history', schema, 'wallet_history');

module.exports = createController(Model);
