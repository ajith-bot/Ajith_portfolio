require('dotenv').config();
const mongoose = require('mongoose');

// Your connection string from .env
const MONGODB_URI = process.env.MONGODB_URI;

console.log('🔄 Testing connection...');
console.log('📍 URI (masked):', MONGODB_URI.replace(/:[^:@]*@/, ':****@'));

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ SUCCESS! Connected to MongoDB Atlas');
    console.log('📊 Database:', mongoose.connection.name);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ FAILED:', error.message);
    process.exit(1);
  });