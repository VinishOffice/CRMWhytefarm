const mongoose = require('mongoose');
const { createIndexes } = require('./AgentsData');

const brands_dataSchema = new mongoose.Schema({
    brand_banner: { type: String , required: true},
    brand_name: { type: String , required: true},
    brand_thumbnail: { type: String , required: true},
    created_at: { type: Date, default: Date.now },
    status: { type: String, default: "" },
    updated_date: { type: Date , default: Date.now }
}, { collection: 'brands_data' });
const BrandsData = mongoose.model('BrandsData', brands_dataSchema);
module.exports = BrandsData;    