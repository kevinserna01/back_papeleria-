const express = require('express');
const { urlencoded, json } = require('express');
const router = require('./routes/papeleria.routes.js');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger.js');
const path = require('path');
require('dotenv').config();

const app = express();

const corsOptions = {
    origin: [
      'http://localhost:5173', // Para desarrollo local
      'https://back-papeleria-two.vercel.app', // Para producción
      'https://react-cabina.vercel.app', // Nuevo frontend permitido
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

// Swagger Documentation
try {
  // Endpoint para servir el JSON de Swagger
  app.get('/api-docs.json', (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      res.send(swaggerSpec);
    } catch (error) {
      console.error('Error sirviendo swagger.json:', error);
      res.status(500).json({ error: 'Error generando documentación Swagger' });
    }
  });

  // Servir archivos estáticos de Swagger UI desde node_modules (para Vercel)
  try {
    const swaggerUiDistPath = path.join(__dirname, 'node_modules', 'swagger-ui-dist');
    app.use('/swagger-ui', express.static(swaggerUiDistPath, { index: false }));
  } catch (error) {
    console.warn('No se pudo servir archivos estáticos desde node_modules:', error.message);
  }

  // Swagger UI - Configuración usando CDN para archivos estáticos (más confiable en Vercel)
  const swaggerUiOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'PymeTrack API Documentation',
    explorer: true,
    customCssUrl: 'https://unpkg.com/swagger-ui-dist@5.30.2/swagger-ui.css',
    customJs: [
      'https://unpkg.com/swagger-ui-dist@5.30.2/swagger-ui-bundle.js',
      'https://unpkg.com/swagger-ui-dist@5.30.2/swagger-ui-standalone-preset.js'
    ],
    swaggerOptions: {
      url: '/api-docs.json',
      persistAuthorization: true,
      displayRequestDuration: true,
      tryItOutEnabled: true
    }
  };

  // Configurar Swagger UI
  app.use('/api-docs', swaggerUi.serveFiles(swaggerSpec, swaggerUiOptions));
  app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  
  console.log('Swagger UI configurado correctamente en /api-docs');
} catch (error) {
  console.error('Error configurando Swagger:', error);
}

// Manejador para la ruta raíz
app.get('/', (req, res) => {
    res.send('Bienvenido al backend de PymeTrack! Visita /api-docs para la documentación completa de la API.');
});

app.use('/v1/papeleria', router);

// Iniciar el servidor
const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});