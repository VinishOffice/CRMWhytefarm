const mongoose = require('mongoose');

const productsDataSchema = new mongoose.Schema({
    brand: { type: String },
    category: { type: String },
    created_date: { type: String },
    enableLogistic: { type: Boolean },
    gst: { type: String },
    id: { type: String },
    image: { type: String },
    image_transparent_bg: { type: String },
    inStock: { type: Boolean },
    launchDate: { type: String },
    packagingOptions: [{
        packaging: { type: String },
        pkgUnit: { type: String },
        price: { type: String },
        priceBeforeDiscount: { type: String }
    }],
    productDescription: { type: String },
    productId: { type: String },
    productName: { type: String },
    publishOnApp: { type: Boolean },
    publishOnB2B: { type: Boolean },
    publishOnCRM: { type: Boolean },
    updated_date: { type: String }
}, { collection: 'products_data' });

module.exports = mongoose.model('ProductsData', productsDataSchema);