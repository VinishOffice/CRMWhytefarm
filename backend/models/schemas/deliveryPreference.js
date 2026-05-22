const mongoose = require('mongoose');

const deliveryPreferenceSchema = new mongoose.Schema({
    additional_instruction: { type: String, default: "" },
    created_date: { type: Date },
    customer_id: { type: String },
    customer_name: { type: String },
    customer_phone: { type: String },
    delivery_mode: { type: String },
    selected_days: { type: [String], default: [] },
    time: { type: String },
    status: { type: String },
    updated_date: { type: Date }
}, { collection: 'delivery_preference' });

module.exports = mongoose.model('DeliveryPreference', deliveryPreferenceSchema);
