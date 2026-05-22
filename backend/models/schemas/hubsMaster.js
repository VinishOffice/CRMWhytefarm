const mongoose = require('mongoose');

const schema = new mongoose.Schema({}, { strict: false }, { collection: 'hubs_master' });

module.exports = mongoose.model('HubsMaster', schema, 'hubs_master');
