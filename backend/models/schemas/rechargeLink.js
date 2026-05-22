const mongoose = require('mongoose');

const rechargeLinkSchema = new mongoose.Schema({
    amount: { type: String },
    created_date: { type: String },
    customer_id: { type: String },
    email: { type: String },
    name: { type: String },
    phone: { type: String }
}, { collection: 'recharge_link' });

module.exports = mongoose.model('RechargeLink', rechargeLinkSchema);