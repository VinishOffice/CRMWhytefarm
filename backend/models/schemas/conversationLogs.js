const mongoose = require('mongoose');

const conversationLogSchema = new mongoose.Schema({
    call_type: { type: String }, 
    conversation_notes: { type: String }, 
    created_at: { type: Date }, 
    created_by: { type: String }, 
    customer_email: { type: String, default: "" },
    customer_id: { type: String, required: true }, 
    customer_name: { type: String }, 
    customer_phone: { type: String }, 
    disposition: { type: String }, 
    follow_up_date: { type: String }, 
    followup_required: { type: Boolean, default: false },
    hub: { type: String }, 
    interaction_type: { type: String }, 
    selected_products: [{ type: String }], 
    sub_disposition: { type: String }, 
    sub_sub_disposition: { type: String, default: "" },
    tags: { type: Array, default: [] }
}, { collection: 'conversation_log' });

module.exports = mongoose.model('ConversationLog', conversationLogSchema);