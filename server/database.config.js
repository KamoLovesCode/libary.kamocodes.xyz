const dns = require('node:dns');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config({ quiet: true });

const MONGO_ENABLED = ['1', 'true', 'yes', 'on'].includes(
  String(process.env.MONGO_ENABLED || 'true').toLowerCase()
);

let mongoReady = false;
let mongoClient = null;
let mongoDb = null;
let chatEntriesCollection = null;
let usersCollection = null;

async function connectDB() {
  if (!MONGO_ENABLED) {
    console.log('⚠️  MongoDB disabled (MONGO_ENABLED=false). Using local JSON storage.');
    return { mongoReady: false, mongoDb: null, chatEntriesCollection: null, usersCollection: null };
  }

  dns.setServers(['8.8.8.8', '1.1.1.1']);

  const uri = process.env.MONGODB_URI || 'mongodb+srv://Admin:Ninemillionby30@mydb.df6jv0x.mongodb.net/?appName=MyDb';
  const dbName = process.env.MONGODB_DB || 'connect-Ninemillionby30';

  try {
    mongoClient = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      serverSelectionTimeoutMS: 6000,
    });

    await mongoClient.connect();
    await mongoClient.db('admin').command({ ping: 1 });

    mongoDb = mongoClient.db(dbName);
    chatEntriesCollection = mongoDb.collection('chatEntries');
    usersCollection = mongoDb.collection('users');
    
    // Create indexes
    await chatEntriesCollection.createIndex({ id: 1 }, { unique: true });
    await chatEntriesCollection.createIndex({ username: 1 });
    await usersCollection.createIndex({ username: 1 }, { unique: true });

    mongoReady = true;
    console.log(`✅ MongoDB connected (${dbName})`);
    return { mongoReady, mongoDb, chatEntriesCollection, usersCollection, mongoClient };
  } catch (err) {
    console.warn(`⚠️  MongoDB connect failed: ${err.message}`);
    mongoReady = false;
    chatEntriesCollection = null;
    usersCollection = null;
    mongoDb = null;
    if (mongoClient) {
      try {
        await mongoClient.close();
      } catch {}
      mongoClient = null;
    }
    console.warn('⚠️  MongoDB unavailable. Continuing with local JSON storage only.');
    return { mongoReady: false, mongoDb: null, chatEntriesCollection: null, usersCollection: null };
  }
}

function getMongoStatus() {
  return { mongoReady, mongoDb, chatEntriesCollection, usersCollection, mongoClient };
}

module.exports = { connectDB, getMongoStatus };
