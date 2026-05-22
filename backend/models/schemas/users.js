const mongoose = require('mongoose');

const usersSchema = new mongoose.Schema({
    created_date: { type: String },
    email: { type: String },
    first_name: { type: String },
    id: { type: String },
    last_name: { type: String },
    password: { type: String },
    phone_no: { type: String },
    role: { type: String, enum: ['admin', 'customer', 'hub manager', 'customer support team lead', 'customer care agent part lead', 'accounts team lead', 'junior accounts'] },
    status: { type: Boolean },
    updated_date: { type: String },
    user_id: { type: String },
    user_image: { type: String, default: null },
    username: { type: String }
}, { collection: 'users' });

module.exports = mongoose.model('Users', usersSchema);