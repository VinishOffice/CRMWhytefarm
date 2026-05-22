const mongoose = require("mongoose");

const dynamicSchema = new mongoose.Schema({}, { strict: false });

const getModel = (collectionName) => {
  if (!collectionName) {
    throw new Error("collectionName is required");
  }
  // Cache per collection to avoid OverwriteModelError
  if (mongoose.models[collectionName]) {
    return mongoose.models[collectionName];
  }
  return mongoose.model(collectionName, dynamicSchema, collectionName);
};

module.exports = { getModel };
