const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 30000,
  connectTimeoutMS: 10000,
  family: 4, // Forzar IPv4
  // ❌ No incluyas keepAlive, useUnifiedTopology, useNewUrlParser
};

let client = null;
let db = null;

const connectDb = async () => {
  try {
    if (!client) {
      client = new MongoClient(uri, options);
      await client.connect();
      console.log('✅ MongoDB connected');
    }

    if (!db) {
      db = client.db(process.env.DB_NAME);
    }

    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    if (client) {
      await client.close();
      client = null;
    }
    db = null;
    throw error;
  }
};

const getDb = async () => {
  if (!db) {
    db = await connectDb();
  }
  return db;
};

const closeConnection = async () => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('🛑 MongoDB connection closed');
  }
};

// Por si corres el backend localmente o en servicios con procesos largos (no aplica en Vercel)
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeConnection();
  process.exit(0);
});

module.exports = { connectDb, getDb, closeConnection };
