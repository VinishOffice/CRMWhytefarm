const mongoose = require('mongoose');

const customerActivitiesSchema = new mongoose.Schema({
    action: { type: String },
    created_date: { type: String },
    customer_address: { type: String },
    customer_id: { type: String },
    customer_name: { type: String },
    customer_phone: { type: String },
    delivery_exe_id: { type: String },
    description: { type: String },
    hub_name: { type: String },
    object: { type: String },
    user: { type: String }
}, { collection: 'customer_activities' });

module.exports = mongoose.model('CustomerActivities', customerActivitiesSchema);