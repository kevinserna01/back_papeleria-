const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;

// Opciones de conexión optimizadas para Vercel
const options = {
    connectTimeoutMS: 10000, // 10 segundos
    socketTimeoutMS: 45000,  // 45 segundos
    maxPoolSize: 50,
    wtimeoutMS: 25000,
    retryWrites: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
};

const client = new MongoClient(uri, options);

let db;
let isConnecting = false;

const connectDb = async () => {
    try {
        if (!db && !isConnecting) {
            isConnecting = true;
            console.log('Iniciando conexión a MongoDB...');
            
            await client.connect();
            db = client.db(process.env.DB_NAME);
            
            // Verificar la conexión
            await db.command({ ping: 1 });
            console.log('Conexión exitosa a MongoDB');
            
            // Manejar eventos de la conexión
            client.on('error', (error) => {
                console.error('Error en la conexión MongoDB:', error);
                db = null;
                isConnecting = false;
            });

            client.on('timeout', () => {
                console.error('Timeout en la conexión MongoDB');
                db = null;
                isConnecting = false;
            });

            client.on('close', () => {
                console.log('Conexión MongoDB cerrada');
                db = null;
                isConnecting = false;
            });

            isConnecting = false;
        }
        return db;
    } catch (error) {
        console.error('Error al conectar a MongoDB:', error);
        db = null;
        isConnecting = false;
        throw error;
    }
};

const getDb = () => {
    if (!db) {
        throw new Error("No hay conexión a la base de datos. Intente nuevamente.");
    }
    return db;
};

// Función para cerrar la conexión limpiamente
const closeDb = async () => {
    try {
        if (client) {
            await client.close();
            db = null;
            console.log('Conexión a MongoDB cerrada correctamente');
        }
    } catch (error) {
        console.error('Error al cerrar la conexión:', error);
        throw error;
    }
};

module.exports = { connectDb, getDb, closeDb };
