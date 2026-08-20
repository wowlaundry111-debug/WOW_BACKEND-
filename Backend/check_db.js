require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Error: MONGODB_URI is not set. Add it to Backend/.env');
  process.exit(1);
}

async function checkDB() {
  await mongoose.connect(uri);
  const shops = await mongoose.connection.db.collection('shops').find({}).toArray();
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  console.log('Shops in DB:', shops.map(s => s.name));
  console.log('Users in DB:', users.map(u => ({ email: u.email, role: u.role, shopId: u.shopId })));
  process.exit(0);
}

checkDB();
