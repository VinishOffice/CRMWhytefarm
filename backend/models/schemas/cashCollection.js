const mongoose = require('mongoose');

const cashCollectionSchema = new mongoose.Schema({
    amount: { type: Number, required: true },
    collected_amount: { type: Number, required: true },
    created_by: { type: String, required: true },
    created_date: { type: Date, required: true, default: Date.now },
    created_user_id: { type: String, required: true , unique: true },
    customer_address: { type: String, required: true },
    collection_date: { type: Date, required: true },
    customer_id: { type: String, required: true , unique: true },
    customer_name: { type: String, required: true },
    customer_phone: { type: String, required: true ,unique: true },
    date   : { type: String, required: true },
    delivery_exe_id : { type: String, required: true },
    delivery_executive_name : { type: String, required: true },
    delivery_executive_phone : { type: String, required: true , unique: true },
    description : { type: String, required: true },
    status : { type: String, required: true , default: '0' },
    time : { type: String, required: true },
    updated_date : { type: Date, required: true , default: Date.now },

}, { collection: 'cash_collection' });

module.exports = mongoose.model('CashCollection', cashCollectionSchema);    