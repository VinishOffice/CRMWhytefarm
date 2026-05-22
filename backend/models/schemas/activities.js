const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  
  changes: {
    next_delivery_date: {
      new: { type: Date },
      old: { type: Date }
    },
    created_date: { type: Date, default: Date.now },
    description: { type: String },
    platform: { type: String }
  },
  original_firestore_id: { type: String }
}, { collection: 'customer_activities' });

module.exports = mongoose.model('Activity', activitySchema);