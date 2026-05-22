const mongoose = require('mongoose');

const tasksSchema = new mongoose.Schema({
    assigned_to: { type: String },
    created_at: { type: String },
    created_by: { type: String },
    customer_email: { type: String },
    customer_id: { type: String },
    customer_phone: { type: String },
    task_date: { type: String },
    task_id: { type: String },
    task_status: { type: String },
    task_type: { type: String }
}, { collection: 'tasks' });

module.exports = mongoose.model('Tasks', tasksSchema);