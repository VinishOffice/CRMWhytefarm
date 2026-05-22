const mongoose = require("mongoose");

const connectDB = async (mongoUri) => {
  if (!mongoUri) {
    throw new Error("MONGO_URI is not defined. Please set it in your .env file.");
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    throw err;
  }
};

module.exports = connectDB;
