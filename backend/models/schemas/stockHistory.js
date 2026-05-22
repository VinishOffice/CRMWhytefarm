const mongoose = require('mongoose');

const stockHistorySchema = new mongoose.Schema({
    action: { type: String },
    created_date: { type: String },
    date: { type: String },
    hub: { type: String },
    productId: { type: String },
    productName: { type: String },
    quantity: { type: Number },
    status: { type: String },
    type: { type: String },
    user: { type: String },
    user_id: { type: String }
}, { collection: 'stock_history' });

module.exports = mongoose.model('StockHistory', stockHistorySchema);