const mongoose = require('mongoose');

const tagsSchema = new mongoose.Schema({
    created_at: { type: String },
    tag_name: { type: String }
}, { collection: 'tags' });

module.exports = mongoose.model('Tags', tagsSchema);