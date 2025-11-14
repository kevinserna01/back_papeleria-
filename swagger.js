const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PymeTrack API - Sistema de Gestión para PymeTrack',
      version: '1.0.0',
      description: `
        API REST completa para gestión de PymeTrack, incluyendo:
        - Gestión de productos e inventario
        - Sistema de ventas y facturación
        - Gestión de clientes y cartera
        - Sistema de abonos y pagos
        - Reportes y análisis
        - Autenticación y usuarios
        - Generación de PDFs y envío de facturas por email
      `,
      contact: {
        name: 'Kevin Serna',
        email: 'kevinfernandoserna11@gmail.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'https://back-papeleria-two.vercel.app/v1/papeleria',
        description: 'Servidor de Producción'
      },
      {
        url: 'http://localhost:4000/v1/papeleria',
        description: 'Servidor de Desarrollo Local'
      }
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'Error'
            },
            message: {
              type: 'string',
              example: 'Mensaje de error descriptivo'
            },
            error: {
              type: 'string',
              example: 'Detalles del error'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'Success'
            },
            message: {
              type: 'string',
              example: 'Operación exitosa'
            },
            data: {
              type: 'object'
            }
          }
        },
        Producto: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'Cuaderno'
            },
            code: {
              type: 'string',
              example: 'CU001'
            },
            costPrice: {
              type: 'number',
              example: 5000
            },
            salePrice: {
              type: 'number',
              example: 8000
            },
            category: {
              type: 'string',
              example: 'Oficina'
            },
            description: {
              type: 'string',
              example: 'Cuaderno de 100 hojas'
            }
          },
          required: ['name', 'code']
        },
        Venta: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              example: 'VTA-027'
            },
            productos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'CU001' },
                  cantidad: { type: 'number', example: 2 },
                  precioUnitario: { type: 'number', example: 8000 },
                  total: { type: 'number', example: 16000 }
                }
              }
            },
            metodoPago: {
              type: 'string',
              enum: ['Efectivo', 'Nequi', 'Transferencia'],
              example: 'Efectivo'
            },
            cliente: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Juan Pérez' },
                document: { type: 'string', example: '1234567890' },
                email: { type: 'string', example: 'juan@email.com' },
                phone: { type: 'string', example: '3001234567' }
              }
            },
            trabajador: {
              type: 'object',
              properties: {
                correo: { type: 'string', example: 'vendedor@email.com' },
                nombre: { type: 'string', example: 'Carlos Vendedor' }
              }
            },
            totalVenta: {
              type: 'number',
              example: 16000
            },
            descuentoAplicado: {
              type: 'number',
              example: 0
            }
          },
          required: ['code', 'productos', 'metodoPago']
        },
        Cliente: {
          type: 'object',
          properties: {
            tipoIdentificacion: {
              type: 'string',
              enum: ['CC', 'NIT', 'CE', 'TI', 'RC', 'PAS'],
              example: 'CC'
            },
            numeroIdentificacion: {
              type: 'string',
              example: '1234567890'
            },
            nombre: {
              type: 'string',
              example: 'Juan Pérez'
            },
            email: {
              type: 'string',
              example: 'juan@email.com'
            },
            telefono: {
              type: 'string',
              example: '3001234567'
            },
            departamento: {
              type: 'string',
              example: 'Antioquia'
            },
            ciudad: {
              type: 'string',
              example: 'Medellín'
            },
            tipoCliente: {
              type: 'string',
              enum: ['individual', 'empresa', 'mayorista'],
              example: 'individual'
            }
          },
          required: ['tipoIdentificacion', 'numeroIdentificacion', 'nombre', 'email', 'telefono']
        },
        Factura: {
          type: 'object',
          properties: {
            clienteId: {
              type: 'string',
              example: '64a1b2c3d4e5f6789012345'
            },
            productos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  cantidad: { type: 'number' },
                  precioUnitario: { type: 'number' }
                }
              }
            },
            subtotal: {
              type: 'number',
              example: 100000
            },
            descuentoAplicado: {
              type: 'number',
              example: 5
            },
            iva: {
              type: 'number',
              example: 19
            },
            metodoPago: {
              type: 'string',
              enum: ['Efectivo', 'Nequi', 'Transferencia'],
              example: 'Efectivo'
            },
            diasVencimiento: {
              type: 'number',
              example: 30
            }
          }
        },
        Abono: {
          type: 'object',
          properties: {
            facturaId: {
              type: 'string',
              example: '64a1b2c3d4e5f6789012345'
            },
            montoAbono: {
              type: 'number',
              example: 50000
            },
            metodoPago: {
              type: 'string',
              enum: ['Efectivo', 'Nequi', 'Transferencia'],
              example: 'Efectivo'
            },
            observaciones: {
              type: 'string',
              example: 'Abono parcial'
            }
          },
          required: ['facturaId', 'montoAbono', 'metodoPago']
        }
      }
    },
    tags: [
      {
        name: 'Autenticación',
        description: 'Endpoints para autenticación de trabajadores y administradores'
      },
      {
        name: 'Productos',
        description: 'Gestión de productos (CRUD completo)'
      },
      {
        name: 'Inventario',
        description: 'Gestión de inventario y stock'
      },
      {
        name: 'Ventas',
        description: 'Gestión de ventas y transacciones'
      },
      {
        name: 'Facturas PDF',
        description: 'Generación y envío de facturas en PDF'
      },
      {
        name: 'Clientes',
        description: 'Gestión de clientes (CRUD completo)'
      },
      {
        name: 'Facturación',
        description: 'Sistema de facturación y cartera'
      },
      {
        name: 'Abonos',
        description: 'Gestión de abonos y pagos'
      },
      {
        name: 'Reportes',
        description: 'Generación de reportes y análisis'
      },
      {
        name: 'Categorías',
        description: 'Gestión de categorías de productos'
      },
      {
        name: 'Usuarios',
        description: 'Gestión de usuarios del sistema'
      },
      {
        name: 'Seguridad',
        description: 'Códigos aleatorios, OTP y verificación'
      }
    ]
  },
  apis: [__dirname + '/swagger-docs.js', './swagger-docs.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

