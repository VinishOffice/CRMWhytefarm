const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const Users = require("./models/schemas/users");

async function seedTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Delete existing test user
    await Users.deleteOne({ username: "shruti" });
    console.log("Deleted existing shruti user if any");

    // Create test user
    const testUser = new Users({
      username: "shruti",
      password: "shruti@123",
      email: "shruti@whytefarms.com",
      first_name: "Shruti",
      last_name: "Test",
      phone_no: "9999999999",
      user_id: "shruti_001",
      role: "Admin",
      status: true,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    });

    await testUser.save();
    console.log("Test user 'shruti' created successfully");
  } catch (err) {
    console.error("Error seeding test user:", err.message);
  } finally {
    await mongoose.connection.close();
  }
}

seedTestUser();
