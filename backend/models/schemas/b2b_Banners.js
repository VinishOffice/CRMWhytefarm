const mongoose = require('mongoose');

const b2bBannerSchema = new mongoose.Schema({
    created_at: { type: Date, default: Date.now },
    name : { type: String, required: true },
    url : { type: String, required: true }
}, { collection: 'b2b_banner' });

// Model ka naam wahi rakhein jo kaam hai (Banners)
module.exports = mongoose.model('B2BBanner', b2bBannerSchema);