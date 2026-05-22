const mongoose = require('mongoose');

const CafeMasterSchema = new mongoose.Schema({ 
    buyer_name : { type : String, required: true },
    cafe_address : { type : String, required: true },
    cafe_id : { type : String, required: true , unique: true },
    cafe_name : { type : String, required: true },
    cafe_location : { type : String, required: true },
    consignee_address : { type : String, required: true },
    consignee_name : { type : String, required: true },
    contact_person_name : { type : String, required: true  },
    created_by : { type : String, required: true },
    created_date : { type : Date, required: true , default: Date.now },
    delivery_hub : { type : String, required: true },
    gst_no_buyer : { type : String, required: true },
    gst_no_ship : { type : String, required: true },
    password : { type : String, required: true },
    type    : { type : String, required: true },    
    user_name : { type : String, required: true },

}, { collection: 'cafe_master' });

module.exports = mongoose.model('CafeMaster', CafeMasterSchema);

