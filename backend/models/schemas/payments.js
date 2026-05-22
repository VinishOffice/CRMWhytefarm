const mongoose = require('mongoose');

const paymentsSchema = new mongoose.Schema({
    amount: { type: Number },
    customer_id: { type: String },
    email: { type: String },
    paymentId: { type: String },
    phone: { type: String },
    timestamp: { type: String }
}, { collection: 'payments' });

module.exports = mongoose.model('Payments', paymentsSchema);