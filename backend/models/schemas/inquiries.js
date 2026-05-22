const mongoose = require('mongoose');

const inquiriesSchema = new mongoose.Schema({
    email: { type: String },
    message: { type: String },
    mobile: { type: String },
    name: { type: String },
    timestamp: { type: Date }
}, { collection: 'inquiries' });

module.exports = mongoose.model('Inquiries', inquiriesSchema);