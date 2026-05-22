const mongoose = require('mongoose');

const hubsDataSchema = new mongoose.Schema({
    address: { type: String },
    city: { type: String },
    created_date: { type: Date },
    hub_display_name: { type: String },
    hub_name: { type: String },
    mobile_no: { type: String },
    state: { type: String },
    status: { type: String },
    updated_date: { type: Date }
}, { collection: 'hubs_data' });

module.exports = mongoose.model('HubsData', hubsDataSchema);