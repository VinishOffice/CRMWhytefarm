const mongoose = require('mongoose');

const locationsDataSchema = new mongoose.Schema({
    area: { type: String },
    hub_name: { type: String },
    status: { type: String },
    subarea: { type: String },
    updated_date: { type: Date },
    visible_on: { type: String }
}, { collection: 'locations_data' });

module.exports = mongoose.model('LocationsData', locationsDataSchema);