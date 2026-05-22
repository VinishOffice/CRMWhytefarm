const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    Timestamp: { type: String },
    endDate: { type: String },
    friday: { type: Number },
    image: { type: String },
    interval: { type: Number },
    monday: { type: Number },
    next_delivery_date: { type: String },
    package_unit: { type: String },
    price: { type: Number },
    product: { type: String },
    productName: { type: String },
    product_id: { type: String, default: "" },
    quantity: { type: Number },
    reason: { type: String, default: "" },
    saturday: { type: Number },
    startDate: { type: String },
    subscriptionType: { type: String },
    sunday: { type: Number },
    thursday: { type: Number },
    tuesday: { type: Number },
    wednesday: { type: Number }
}, { collection: 'cod_order' });


const summarySchema = new mongoose.Schema({
    handlingCharges: { type: Number },
    subtotal: { type: Number },
    total: { type: Number }
}, { collection: 'cod_order' });

const codOrderSchema = new mongoose.Schema({
    items: [orderItemSchema], 
    orderDate: { type: String },
    paymentMethod: { type: String }, 
    status: { type: String }, 
    summary: summarySchema 
}, { collection: 'cod_order' });

module.exports = mongoose.model('CodOrder', codOrderSchema);