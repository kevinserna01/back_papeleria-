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
      // Agrega otros orígenes permitidos si es necesario
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos HTTP permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Headers permitidos
    credentials: true, // Permite credenciales
    optionsSuccessStatus: 200 // Para navegadores antiguos que no soportan 204
  };

// Middleware para analizar datos codificados y JSON
app.use(urlencoded({ extended: true }));
app.use(json());
app.use(cors());

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