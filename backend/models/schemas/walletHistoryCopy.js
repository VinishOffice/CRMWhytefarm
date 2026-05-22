const mongoose = require('mongoose');

const walletHistoryCopySchema = new mongoose.Schema({
    amount: { type: String }, // Screenshot mein quotes ke sath hai
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
    txn_id: { type: String },
    type: { type: String },
    user: { type: String }
}, { collection: 'wallet_history_copy' });

module.exports = mongoose.model('WalletHistoryCopy', walletHistoryCopySchema);