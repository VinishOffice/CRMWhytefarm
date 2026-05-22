const mongoose = require('mongoose');

const schema = new mongoose.Schema({}, { strict: false }, { collection: 'product_categories' });

module.exports = mongoose.model('ProductCategories', schema, 'product_categories');
