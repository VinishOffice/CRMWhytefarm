const mongoose = require('mongoose');

const deliveryItemSchema = new mongoose.Schema({
    B2B_predicted_orders: { type: Number },
    B2C_predicted_orders: { type: Number },
    analysisDate: { type: String },
    buffer_added: { type: Number },
    day: { type: String },
    final_order: { type: Number },
    product_name: { type: String },
    stock: { type: Number },
    stock_need_exceed: { type: Number }
}, { collection: 'order_locks' });

const orderLocksSchema = new mongoose.Schema({
    bufferPercentage: { type: Number },
    created_at: { type: Date },
    created_date: { type: String },
    deliveryList: [deliveryItemSchema],
    isLocked: { type: Boolean },
    lockedAt: { type: Date }
}, { collection: 'order_locks' });

module.exports = mongoose.model('OrderLocks', orderLocksSchema);