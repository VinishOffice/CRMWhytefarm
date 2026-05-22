const mongoose = require('mongoose');

const schema = new mongoose.Schema({}, { strict: false }, { collection: 'user_details' });

module.exports = mongoose.model('UserDetails', schema, 'userDetails');
