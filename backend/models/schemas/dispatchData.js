const mongoose = require('mongoose');

const dispatchDataSchema = new mongoose.Schema({
    created_by: { type: String },
    created_date: { type: String }, // Stored as String in your screenshot
    created_user_id: { type: String },
    date: { type: Date },
    dispatch_date: { type: Date },
    dispatch_id: { type: String },
    dispatch_sub_id: { type: String },
    productName: { type: String },
    quantity: { type: Number },
    status: { type: String },
    type: { type: String },
    type_val: { type: Number }
}, { collection: 'dispatch_data' });

module.exports = mongoose.model('DispatchData', dispatchDataSchema);