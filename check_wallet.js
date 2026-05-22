const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, 'backend/.env') });
const MONGO_URI = process.env.MONGO_URI;

async function check() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const id = 37858013; // or string
  let customer = await db.collection("customers_data").findOne({ customer_id: id });
  if (!customer) {
      customer = await db.collection("customers_data").findOne({ customer_id: String(id) });
  }

  if (customer) { 
      console.log(`Customer ${id} wallet balance: ${customer.wallet_balance}, credit limit: ${customer.credit_limit}`); 
  } else {
      console.log(`Customer ${id} not found`);
  }

  await mongoose.connection.close();
}

check().catch(console.error);
