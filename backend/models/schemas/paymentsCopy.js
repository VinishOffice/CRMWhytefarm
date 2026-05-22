const mongoose = require('mongoose');

const paymentsCopySchema = new mongoose.Schema({
    amount: { type: Number },
    customer_id: { type: String },
    paymentId: { type: String },
    phone: { type: String },
    timestamp: { type: String }
}, { collection: 'payments_copy' });

module.exports = mongoose.model('PaymentsCopy', paymentsCopySchema);