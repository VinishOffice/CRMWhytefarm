const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    Timestamp: { type: String },
    endDate: { type: String },
    friday: { type: Number },
    image: { type: String },
    interval: { type: Number },
    monday: { type: Number },
    next_delivery_date: { type: String },
    package_unit: { type: String },
    price: { type: Number }
}, { collection: 'cart' });

const cartSchema = new mongoose.Schema({
    customer_id: { type: String, required: true },
    customer_name: { type: String, required: true },
    customer_phone: { type: String, required: true },
    products: [productSchema], 
    update_date: { type: String }, 
    update_timestamp: { type: Date } 
}, { collection: 'cart' });

module.exports = mongoose.model('Cart', cartSchema);