const mongoose = require('mongoose');

const customerTicketSchema = new mongoose.Schema({
    category: { type: String },
    created_date: { type: String },
    customer_id: { type: String },
    customer_name: { type: String },
    customer_phone: { type: String },
    data_status: { type: String },
    description: { type: String },
    due_date: { type: String },
    owner: { type: String },
    priority: { type: String },
    source: { type: String },
    status: { type: String },
    ticket_id: { type: String },
    updated_date: { type: String },
    visible_on: { type: String }
}, { collection: 'customer_ticket' });

module.exports = mongoose.model('CustomerTicket', customerTicketSchema);