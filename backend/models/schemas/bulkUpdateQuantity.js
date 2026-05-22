const mongoose = require('mongoose');

const bulkUpdateQuantitySchema = new mongoose.Schema({
    customer_id : { type : String , required :true} ,
    date : { type : Date , default : Date.now },
    delivery_date : { type : Date , required : true },
    product_name : { type : String , required : true },
    quantity : { type : Number , required : true },
    status : { type : String , enum : ["0" , "1"], default : "" },
    subscription_id : { type : String , required : true }
}, { collection: 'bulk_update_quantity' });

module.exports = mongoose.model('BulkUpdateQuantity', bulkUpdateQuantitySchema);