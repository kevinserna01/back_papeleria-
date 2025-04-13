const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;

const options = {
  maxPoolSize: 10, // Mantenerlo pequeño para Vercel (serverless)
  serverSelectionTimeoutMS: 5000, // Tiempo para esperar a que el servidor esté disponible
  socketTimeoutMS: 30000,         // Tiempo máximo para operaciones de red
  connectTimeoutMS: 10000,        // Tiempo máximo para conectar al cluster
  family: 4,                      // Preferir IPv4
  // ✅ keepAlive ya no es válido en MongoClient, por eso lo eliminamos
};

let client;
let db;

// Solo una conexión para todas las llamadas (importante en Vercel/serverless)
const connectDb = async () => {
  try {
    if (!client) {
      client = new MongoClient(uri, options);
      await client.connect();
      console.log('✅ MongoDB connected');

      // No es necesario configurar eventos como 'timeout' manualmente aquí.
      // MongoClient ya maneja reconexiones internamente en driver >= 5.x
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

// Manejo de cierre de la app (útil para local o procesos persistentes, no tanto en Vercel)
process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeConnection();
  process.exit(0);
});

module.exports = { connectDb, getDb, closeConnection };
