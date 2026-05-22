const mongoose = require('mongoose');

const walletHistorySchema = new mongoose.Schema({
    amount: { type: Number },
    created_date: { type: String },
    current_wallet_balance: { type: Number },
    customer_id: { type: String },
    customer_name: { type: String },
    customer_phone: { type: String },
    delivery_executive: { type: String },
    description: { type: String },
    hub_name: { type: String },
    reason: { type: String },
    source: { type: String },
    status: { type: String },
    txn_id: { type: Number },
    type: { type: String },
    user: { type: String },
    utilised_credit_limit: { type: Number },
    utilised_wallet_balance: { type: Number }
}, { collection: 'wallet_history' });

module.exports = mongoose.model('WalletHistory', walletHistorySchema);