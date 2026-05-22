const mongoose = require('mongoose');

// 1. Metadata Schema 
const metadataSchema = new mongoose.Schema({
  created_by: { type: String, default: "system" },
  note: { type: String },
  productName: { type: String },
  quantity: { type: Number, default: 0 },
  updated_at: { type: Date }
}, { collection: 'inventory' });

// 2. Dispatches Schema 
const dispatchSchema = new mongoose.Schema({
  created_at: { type: Date },
  created_date: { type: String },
  metadata: metadataSchema 
}, { collection: 'inventory' });

// 3. Main Inventory Schema 
const inventorySchema = new mongoose.Schema({
  farm_id: { type: String, required: true },
  dispatches: [dispatchSchema] 
}, { collection: 'inventory' });

module.exports = mongoose.model('Inventory', inventorySchema);