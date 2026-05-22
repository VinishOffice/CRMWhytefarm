const mongoose = require('mongoose');
const { createController } = require('../baseController');

const schema = new mongoose.Schema({}, { strict: false });
const Model = mongoose.models['subscriptions_data'] || mongoose.model('subscriptions_data', schema, 'subscriptions_data');

module.exports = createController(Model);
