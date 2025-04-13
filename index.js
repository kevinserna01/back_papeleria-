const express = require('express');
const { urlencoded, json } = require('express');
const router = require('./routes/papeleria.routes.js');
const cors = require('cors');
const { connectDb } = require('./database/mongo.js');
require('dotenv').config();

const app = express();

const corsOptions = {
    origin: [
      'http://localhost:5173', // Para desarrollo local
      'https://back-papeleria-two.vercel.app', // Para producción
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Aplicar CORS con las opciones configuradas
app.use(cors(corsOptions));

// Middleware para analizar datos codificados y JSON
app.use(urlencoded({ extended: true }));
app.use(json());

// Middleware para manejar timeouts
app.use((req, res, next) => {
    // Establecer timeout de 30 segundos para todas las solicitudes
    req.setTimeout(30000);
    res.setTimeout(30000);
    next();
});

// Middleware para verificar la conexión a la base de datos
app.use(async (req, res, next) => {
    try {
        await connectDb();
        next();
    } catch (error) {
        console.error('Error de conexión a la base de datos:', error);
        res.status(503).json({
            success: false,
            message: 'Error de conexión a la base de datos. Por favor, intente más tarde.'
        });
    }
});

// Manejador para la ruta raíz
app.get('/', (req, res) => {
    res.send('Bienvenido al backend de Kevin!');
});

app.use('/v1/papeleria', router);

// Manejador global de errores
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Iniciar el servidor
const port = process.env.PORT || 4000;

const startServer = async () => {
    try {
        // Intentar conectar a la base de datos antes de iniciar el servidor
        await connectDb();
        
        app.listen(port, () => {
            console.log(`Servidor corriendo en el puerto ${port}`);
        });
    } catch (error) {
        console.error('Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();