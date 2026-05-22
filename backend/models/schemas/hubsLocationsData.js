const mongoose = require('mongoose');

const hubsLocationsDataSchema = new mongoose.Schema({
    created_date: { type: Date },
    delivery_exe_id: { type: String },
    hub_name: { type: String },
    location: { type: String },
    location_id: { type: String },
    route: { type: String },
    status: { type: String },
    updated_date: { type: Date }
}, { collection: 'hubs_locations_data' });

module.exports = mongoose.model('HubsLocationsData', hubsLocationsDataSchema);