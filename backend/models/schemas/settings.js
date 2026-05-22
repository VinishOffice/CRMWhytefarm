const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    settings_id: { type: String },
    app_key: { type: String },
    otp_api_key: { type: String },
    payU_prod_key: { type: String },
    payU_prod_salt: { type: String },
    payU_test_key: { type: String },
    payU_test_salt: { type: String },
    subscription_deadline: { type: String },
    support_email: { type: String },
    support_phone: { type: String },
    support_toll_free: { type: String },
    txt_local_api_key: { type: String },
    txt_local_sender: { type: String }
}, { collection: 'settings' });

module.exports = mongoose.model('Settings', settingsSchema);
