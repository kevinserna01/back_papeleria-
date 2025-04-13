const express = require('express');
const { urlencoded, json } = require('express');
const router = require('./routes/papeleria.routes.js');
const cors = require('cors');
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

// Manejador para la ruta raíz
app.get('/', (req, res) => {
    res.send('Bienvenido al backend de Kevin!');
});

app.use('/v1/papeleria', router);

// Iniciar el servidor
const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});