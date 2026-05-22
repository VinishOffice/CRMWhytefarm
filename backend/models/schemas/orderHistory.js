const mongoose = require('mongoose');

const orderHistorySchema = new mongoose.Schema({
    cancelled_reason: { type: String, default: "" },
    cancelled_time: { type: String, default: "" },
    created_date: { type: Date },
    customer_id: { type: String },
    customer_name: { type: String },
    customer_phone: { type: String },
    delivering_to: { type: String },
    delivery_date: { type: String },
    delivery_exe_id: { type: String },
    delivery_time: { type: String },
    delivery_timestamp: { type: Date },
    handling_charges: { type: String },
    hub_name: { type: String },
    latitude: { type: String, default: "" },
    location: { type: String },
    longitude: { type: String, default: "" },
    marked_delivered_by: { type: String },
    order_id: { type: String },
    order_type: { type: String },
    package_unit: { type: String },
    price: { type: Number },
    product_name: { type: String },
    quantity: { type: Number },
    quantity_backup: { type: Number },
    status: { type: String },
    subscription_id: { type: String },
    tax: { type: Number },
    total_amount: { type: Number },
    update_date: { type: Date },
    utilised_credit_limit: { type: Number },
    utilised_wallet_balance: { type: Number }
}, { collection: 'order_history' });

module.exports = mongoose.model('OrderHistory', orderHistorySchema);