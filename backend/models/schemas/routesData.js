const mongoose = require('mongoose');

const routesDataSchema = new mongoose.Schema({
    created_date: { type: String },
    hub_name: { type: String },
    locations: [{ type: String }],
    route: { type: String },
    status: { type: String },
    updated_date: { type: String }
}, { collection: 'routes_data' });

module.exports = mongoose.model('RoutesData', routesDataSchema);