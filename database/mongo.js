const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;

// Opciones optimizadas para Vercel y producción
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
    keepAlive: true,
    connectTimeoutMS: 10000,
};

let client = null;
let db = null;

const connectDb = async () => {
    try {
        if (!client) {
            client = new MongoClient(uri, options);
            await client.connect();
            console.log('MongoDB connection established');
            
            // Configurar event listeners para manejar reconexiones
            client.on('connectionPoolCreated', (event) => {
                console.log('Connection pool created');
            });

            client.on('connectionPoolClosed', (event) => {
                console.log('Connection pool closed');
                client = null;
                db = null;
            });

            client.on('timeout', (event) => {
                console.log('MongoDB operation timeout');
                client = null;
                db = null;
            });
        }

        if (!db) {
            db = client.db(process.env.DB_NAME);
        }

        // Verificar la conexión
        await db.command({ ping: 1 });
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        // Limpiar las conexiones en caso de error
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

// Función para cerrar la conexión de manera limpia
const closeConnection = async () => {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('MongoDB connection closed');
    }
};

// Manejar el cierre de la aplicación
process.on('SIGINT', async () => {
    await closeConnection();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await closeConnection();
    process.exit(0);
});

module.exports = { connectDb, getDb, closeConnection };
