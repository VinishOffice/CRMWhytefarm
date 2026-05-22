const mongoose = require('mongoose');

const creditLimitCallTestSchema = new mongoose.Schema({
    assignBy: { type: String },
    assigned_date: { type: String },
    assigned_to: { type: String },
    assigned_to_name: { type: String },
    customer_id: { type: String },
    customer_name: { type: String },
    customer_phone: { type: String },
    isBalanceSufficient: { type: String },
    requiredBalance: { type: Number },
    status: { type: String },
    total_price: { type: Number },
    updated_date: { type: String }
}, { collection: 'credit_limit_call_test' });

module.exports = mongoose.model('CreditLimitCallTest', creditLimitCallTestSchema);