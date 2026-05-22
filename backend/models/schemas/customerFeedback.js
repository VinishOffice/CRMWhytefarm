const mongoose = require('mongoose');

const customerFeedbackSchema = new mongoose.Schema({
    customer_id: { type: String },
    feedback_date: { type: String },
    feedback_id: { type: String },
    remarks: { type: String }
}, { collection: 'customer_feedback' });

module.exports = mongoose.model('CustomerFeedback', customerFeedbackSchema);