const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    next_delivery_date: { type: String },
    price_per_unit: { type: Number },
    product: { type: String },
    qty: { type: Number },
    status: { type: String },
    total_price: { type: Number }
}, { collection: 'orders' });

const ordersSchema = new mongoose.Schema({
    OneTime: { type: String },
    createdAt: { type: Date },
    customer_id: { type: String },
    customer_name: { type: String },
    email: { type: String, default: "" },
    hub: { type: String },
    items: [orderItemSchema],
    payment_mode: { type: String },
    phone: { type: String },
    status: { type: String },
    total_price: { type: Number }
}, { collection: 'orders' });

module.exports = mongoose.model('Orders', ordersSchema);