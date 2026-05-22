const mongoose = require('mongoose');

const userRolesSchema = new mongoose.Schema({
    index: { type: Number },
    role_type: { type: String },
    user_role: { type: String }
}, { collection: 'user_roles' });

module.exports = mongoose.model('UserRoles', userRolesSchema);