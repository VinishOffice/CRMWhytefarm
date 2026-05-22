const mongoose = require('mongoose');

const createdBySchema = new mongoose.Schema({
    email: { type: String }, 
    id: { type: String }, 
    name: { type: String }, 
    phone: { type: String }, 
    role: { type: String }, 
    created_date: { type: String } 
}, { collection: 'communication_history' });

const commsStatsSchema = new mongoose.Schema({
    failed: { type: Number, default: 0 }, 
    sent: { type: Number, default: 0 }, 
    total: { type: Number } 
}, { collection: 'communication_history' });

const communicationHistorySchema = new mongoose.Schema({
    AbandonedCart: { type: String, default: null }, 
    TrialUser: { type: String, default: null }, 
    created_by: createdBySchema,
    hub: [{ type: String }],
    medium: [{ type: String }], 
    metadata: {
        source: { type: String },
        status: { type: String }, 
        timestamp: { type: Number }
    },
    platform: { type: Array, default: [] }, 
    sms: commsStatsSchema, 
    whatsapp: commsStatsSchema, 
    status: [{ type: String }], 
    subscription_type: [{ type: String }], 
    title: { type: String }, 
    user_id: { type: String }, 
    whatsapp_template: { type: String } 
}, { collection: 'communication_history' });

module.exports = mongoose.model('CommunicationHistory', communicationHistorySchema);