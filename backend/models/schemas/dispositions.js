const mongoose = require('mongoose');

const subdispositionSchema = new mongoose.Schema({
    name: { type: String },
    subsubdispositions: { type: Array, default: [] }
}, { collection: 'disposition' });

const dispositionSchema = new mongoose.Schema({
    created_at: { type: Date },
    name: { type: String },
    subdispositions: [subdispositionSchema],
    updated_at: { type: Date }
}, { collection: 'disposition' });

module.exports = mongoose.model('Disposition', dispositionSchema);