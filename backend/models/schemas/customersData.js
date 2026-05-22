const mongoose = require('mongoose');

const customerDataSchema = new mongoose.Schema({
    alt_phone: { type: String },
    anniversary_date: { type: String },
    created_date: { type: String },
    credit_limit: { type: Number },
    customer_address: { type: String },
    customer_category: { type: String },
    customer_email: { type: String },
    customer_id: { type: String },
    customer_image: { type: String },
    customer_name: { type: String },
    customer_phone: { type: String },
    customer_type: { type: Boolean },
    delivery_exe_id: { type: String },
    dob: { type: String },
    flat_villa_no: { type: String },
    floor: { type: String },
    gender: { type: String },
    hub_name: { type: String },
    landmark: { type: String },
    latitude: { type: String },
    location: { type: String },
    longitude: { type: String },
    pincode: { type: String },
    platform: { type: String },
    referral_code: { type: String },
    registered_date: { type: String },
    source: { type: String },
    status: { type: String },
    updated_date: { type: String },
    wallet_balance: { type: Number }
}, { collection: 'customers_data' });

module.exports = mongoose.model('CustomerData', customerDataSchema);