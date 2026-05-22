const mongoose = require('mongoose');

const AgentSchema = new mongoose.Schema({
  agent_id: { type: String, required: true },
  agent_name: { type: String, required: true },
  agent_number: { type: String },
  role: { type: String, default: "Agent" },
  userId: { type: String },
  created_date: { type: Date, default: Date.now },
  update_date: { type: Date, default: Date.now }
}, { collection: 'agent' });

module.exports = mongoose.model('Agent', AgentSchema);