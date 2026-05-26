
const mongoose = require('mongoose');
const { ServerApiVersion } = require('mongodb');

// Updated with user-provided username 'API' and password '41IQUEqc8mp9qcWt'
const uri = "mongodb+srv://API:41IQUEqc8mp9qcWt@feed.jkbxs.mongodb.net/?appName=Feed";

const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      dbName: 'gpt_library',
      serverSelectionTimeoutMS: 5000,
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    
    if (mongoose.connection.db) {
        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log("✅ Successfully connected to MongoDB Atlas!");
    }
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
};

module.exports = connectDB;
