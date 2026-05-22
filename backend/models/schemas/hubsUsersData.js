const mongoose = require('mongoose');

const hubsUsersDataSchema = new mongoose.Schema({
    cash_collector: { type: Boolean },
    confirm_password: { type: String },
    created_date: { type: Date },
    email: { type: String },
    first_name: { type: String },
    hub_name: { type: String },
    hub_user_id: { type: String },
    image: { type: String },
    last_name: { type: String },
    password: { type: String },
    phone_no: { type: String },
    role: { type: String },
    status: { type: String },
    updated_date: { type: Date },
    username: { type: String }
}, { collection: 'hubs_users_data' });

module.exports = mongoose.model('HubsUsersData', hubsUsersDataSchema);