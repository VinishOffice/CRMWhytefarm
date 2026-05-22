const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    createdAt: { type: String },
    expireAt: { type: String },
    otp: { type: String },
    updatedAt: { type: String }
}, { collection: 'otp' });

module.exports = mongoose.model('Otp', otpSchema);