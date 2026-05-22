const mongoose =require('mongoose');

const bannerSchema = new mongoose.Schema({
    banner_order: { type: String, required: true }, 
    click_action_type: { type: String, required: true }, 
    created_date: { type: Date, default: Date.now }, 
    end_date_time: { type: Date, required: true },
    hub_name: { type: String, default: "" }, 
    image: { type: String, required: true }, 
    navigation_type: { type: String }, 
    platform: { type: String }, 
    start_date_time: { type: Date },
    status: { type: String }, 
    updated_date: { type: String }
}, { collection: 'banner' });

module.exports = mongoose.model('Banner', bannerSchema);


