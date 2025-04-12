const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI; // Asegúrate de que tu URI esté correctamente definido
const client = new MongoClient(uri);

let db;

const connectDb = async () => {
  if (!db) {
    await client.connect();
    db = client.db(process.env.DB_NAME); // Asegúrate de que esto apunte a la base de datos correcta
  }
};

const getDb = () => {
  if (!db) {
    throw new Error("No database found!");
  }
  return db;
};

module.exports = { connectDb, getDb };
