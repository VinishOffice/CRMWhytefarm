const mongoose = require('mongoose');

const customerVacationSchema = new mongoose.Schema({
    created_date: { type: String },
    customer_id: { type: String },
    customer_name: { type: String },
    customer_phone: { type: String },
    end_date: { type: String },
    hub_name: { type: String },
    start_date: { type: String },
    source: { type: String },
    status: { type: String },
    updated_by: { type: String },
    updated_date: { type: String },
    vacation_id: { type: String }
}, { collection: 'customer_vacation' });

module.exports = mongoose.model('CustomerVacation', customerVacationSchema);
