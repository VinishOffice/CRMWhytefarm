const mongoose = require('mongoose');

const ticketsSchema = new mongoose.Schema({
    attachment: { type: Array, default: [] },
    category: { type: String },
    created_date: { type: String },
    customer_id: { type: String },
    customer_name: { type: String },
    customer_phone: { type: String },
    description: { type: String },
    order_date: { type: String },
    preferred_mode: { type: String },
    status: { type: String },
    sub_category: { type: String },
    subject: { type: String },
    ticket_id: { type: String },
    updated_date: { type: String }
}, { collection: 'tickets' });

module.exports = mongoose.model('Tickets', ticketsSchema);