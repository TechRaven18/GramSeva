const mongoose = require('mongoose');
const dns = require('dns');
const seedHardcodedUsers = require('./seedAdmin');

// Force Google DNS to resolve MongoDB Atlas SRV records on Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async (retryCount = 0) => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/panchayat_db';

    await mongoose.connect(mongoUri, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log(`[MongoDB Atlas] ✓ Connected: ${mongoose.connection.host}`);
    
    // Seed hardcoded Admin, Staff, and Citizen test accounts
    await seedHardcodedUsers();

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Connection lost — attempting to reconnect...');
      setTimeout(() => connectDB(0), RETRY_DELAY_MS);
    });

    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB] Runtime error: ${err.message}`);
    });

  } catch (error) {
    console.error(`[MongoDB] Connection attempt ${retryCount + 1} failed: ${error.message}`);

    if (retryCount < MAX_RETRIES) {
      console.log(`[MongoDB] Retrying in ${RETRY_DELAY_MS / 1000}s... (${retryCount + 1}/${MAX_RETRIES})`);
      await wait(RETRY_DELAY_MS);
      return connectDB(retryCount + 1);
    } else {
      console.error('[MongoDB] ❌ Could not connect after multiple retries.');
      console.error('[MongoDB] ⚠️  ACTION NEEDED: Go to MongoDB Atlas → Network Access → Add your current IP address or allow 0.0.0.0/0');
    }
  }
};

module.exports = connectDB;
