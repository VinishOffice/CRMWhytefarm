const mongoose = require('mongoose');

const logTableSchema = new mongoose.Schema({
    activity_date: { type: Date },
    activity_type: { type: String },
    customer_address: { type: String, default: null },
    customer_id: { type: String },
    customer_name: { type: String, default: null },
    customer_phone: { type: String, default: null },
    delivery_exe_id: { type: String },
    description: { type: String },
    hub_name: { type: String }
}, { collection: 'logtables' });

module.exports = mongoose.model('LogTable', logTableSchema);