const mongoose = require('mongoose');

const creditLimitHistorySchema = new mongoose.Schema({
    created_date: { type: String },
    credit_date: { type: String },
    credit_limit: { type: Number },
    customer_id: { type: String },
    customer_name: { type: String },
    customer_phone: { type: String },
    send_notification: { type: Boolean },
    status: { type: String },
    txn_id: { type: String },
    user: { type: String },
    user_name: { type: String },
    userId: { type: String }
}, { collection: 'credit_limit_history' });

module.exports = mongoose.model('CreditLimitHistory', creditLimitHistorySchema);
