const mongoose = require('mongoose');

const customerActivitiesCopySchema = new mongoose.Schema({
    action: { type: String },
    created_date: { type: String },
    customer_id: { type: String },
    customer_name: { type: String },
    customer_phone: { type: String },
    description: { type: String },
    object: { type: String },
    user: { type: String }
}, { collection: 'customer_activities_copy' });

module.exports = mongoose.model('CustomerActivitiesCopy', customerActivitiesCopySchema);