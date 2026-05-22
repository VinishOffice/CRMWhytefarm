const mongoose = require('mongoose');

const ticketCategorySchema = new mongoose.Schema({
    created_at: { type: String },
    name: { type: String },
    sub_category: [{
        name: { type: String },
        subsub_category: { type: Array, default: [] }
    }]
}, { collection: 'ticket_category' });

module.exports = mongoose.model('TicketCategory', ticketCategorySchema);