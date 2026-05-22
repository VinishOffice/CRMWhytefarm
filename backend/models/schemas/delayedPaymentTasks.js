const mongoose = require('mongoose');

const delayedPaymentTaskSchema = new mongoose.Schema({
    attempts: { type: Number },
    created_at: { type: String },
    scheduled_for: { type: String },
    status: { type: String },
    webhook_data: { type: String }
}, { collection: 'delayed_payment_task' });

module.exports = mongoose.model('DelayedPaymentTask', delayedPaymentTaskSchema);