const mongoose = require('mongoose');

const traiOrdersSchema = new mongoose.Schema({
    created_date: { type: String },
    customer_address: { type: String },
    customer_name: { type: String },
    customer_phone: { type: String },
    delivery_date: { type: String },
    delivery_executive: { type: String },
    hub_name: { type: String },
    location: { type: String },
    package_unit: { type: String },
    product_name: { type: String },
    status: { type: String }
}, { collection: 'trai_orders' });

module.exports = mongoose.model('TraiOrders', traiOrdersSchema);