# 📚 Documentación Swagger - PymeTrack API

## 🚀 Acceso a la Documentación

Una vez que el servidor esté corriendo, puedes acceder a la documentación interactiva de Swagger en:

- **Producción**: `https://back-papeleria-two.vercel.app/api-docs`
- **Local**: `http://localhost:4000/api-docs`

## 📦 Instalación

Las dependencias de Swagger ya están incluidas en `package.json`:

```json
{
  "swagger-jsdoc": "^6.2.8",
  "swagger-ui-express": "^5.0.0"
}
```

Para instalar:

```bash
npm install
```

## 🎯 Características

- ✅ **Documentación Interactiva**: Prueba los endpoints directamente desde el navegador
- ✅ **Esquemas Definidos**: Modelos de datos reutilizables (Producto, Venta, Cliente, Factura, Abono)
- ✅ **Ejemplos de Request/Response**: Ejemplos completos para cada endpoint
- ✅ **Validación de Parámetros**: Documentación de parámetros requeridos y opcionales
- ✅ **Códigos de Respuesta**: Documentación de todos los códigos HTTP posibles
- ✅ **Tags Organizados**: Endpoints agrupados por funcionalidad (12 categorías)

## 📋 Estructura de la Documentación

### **Tags Disponibles:**

1. **Autenticación** - Login, registro de trabajadores y administradores
2. **Productos** - CRUD completo de productos
3. **Inventario** - Gestión de stock e inventario
4. **Ventas** - Creación y consulta de ventas
5. **Facturas PDF** - Generación y envío de facturas
6. **Clientes** - CRUD completo de clientes
7. **Facturación** - Sistema de facturación
8. **Abonos** - Gestión de pagos y abonos
9. **Reportes** - Generación de reportes y análisis
10. **Categorías** - Gestión de categorías
11. **Usuarios** - Gestión de usuarios del sistema
12. **Seguridad** - Códigos aleatorios, OTP y verificación

## 🔧 Uso de Swagger UI

### **1. Probar un Endpoint:**

1. Abre `/api-docs` en tu navegador
2. Expande el endpoint que quieres probar
3. Haz clic en "Try it out"
4. Completa los parámetros requeridos
5. Haz clic en "Execute"
6. Ve la respuesta en tiempo real

### **2. Ver Ejemplos:**

Cada endpoint incluye ejemplos de:
- **Request Body**: Estructura JSON esperada
- **Response**: Respuestas exitosas y de error
- **Parámetros**: Query params, path params, headers

### **3. Descargar Especificación:**

Puedes descargar la especificación OpenAPI en formato JSON desde:
- `https://back-papeleria-two.vercel.app/api-docs/swagger.json`

## 📝 Endpoints Documentados

### **Autenticación (5 endpoints)**
- `POST /registertrabajador` - Registrar trabajador
- `POST /logintrabajador` - Login trabajador
- `POST /logouttrabajador` - Logout trabajador
- `POST /registeradminapi` - Registrar administrador
- `POST /loginadminapi` - Login administrador

### **Productos (4 endpoints)**
- `POST /newproductapi` - Crear producto
- `GET /getProductsapi` - Listar productos
- `PUT /updateProductapi` - Actualizar producto
- `DELETE /deleteProductapi` - Eliminar producto

### **Inventario (5 endpoints)**
- `POST /assignProductToInventoryapi` - Asignar a inventario
- `GET /getInventoryProductsapi` - Listar inventario
- `PUT /updateInventoryProductapi` - Actualizar inventario
- `DELETE /deleteInventoryProductapi` - Eliminar de inventario
- `GET /getProductsWithStockapi` - Productos con stock

### **Ventas (5 endpoints)**
- `POST /createSaleapi` - Crear venta
- `GET /salesapi` - Listar ventas
- `GET /getLastSaleCodeapi` - Último código de venta
- `POST /checkAndReserveSaleCodeapi/{code}` - Reservar código
- `POST /releaseSaleCodeapi/{code}` - Liberar código

### **Facturas PDF (5 endpoints)**
- `GET /invoice-pdf/{saleId}` - Generar PDF por venta
- `GET /factura-pdf/{facturaId}` - Generar PDF por factura
- `POST /send-invoice-n8n` - Enviar factura por n8n
- `POST /send-invoice-email` - Enviar factura por email
- `GET /test-n8n-connection` - Probar conexión n8n

### **Clientes (6 endpoints)**
- `POST /clientes` - Crear cliente
- `GET /clientes` - Listar clientes
- `GET /clientes/{id}` - Obtener cliente
- `PUT /clientes/{id}` - Actualizar cliente
- `DELETE /clientes/{id}` - Eliminar cliente
- `GET /clientes/search` - Buscar clientes

### **Facturación (5 endpoints)**
- `POST /facturas` - Crear factura
- `GET /facturas` - Listar facturas
- `GET /facturas/{id}` - Obtener factura
- `PUT /facturas/{id}/estado` - Actualizar estado
- `GET /facturas/cliente/{clienteId}` - Facturas por cliente
- `GET /estado-cuenta/{clienteId}` - Estado de cuenta

### **Abonos (6 endpoints)**
- `POST /abonos` - Registrar abono
- `GET /abonos/factura/{facturaId}` - Abonos por factura
- `GET /abonos/cliente/{clienteId}` - Abonos por cliente
- `POST /confirmar-abono` - Confirmar abono
- `PUT /editar-plan-abonos` - Editar plan de abonos
- `POST /suggest-payment-amounts` - Sugerir montos
- `GET /dashboard-abonos` - Dashboard de abonos

### **Reportes (7 endpoints)**
- `GET /reportsapi` - Reportes de ventas
- `GET /reportsapi/day` - Reporte del día
- `POST /reportsapi/export` - Exportar reporte PDF
- `GET /reportes/cartera` - Reporte de cartera
- `GET /reportes/facturas-vencidas` - Facturas vencidas
- `GET /reportes/analisis-pagos` - Análisis de pagos
- `GET /dashboardapi` - Dashboard general

### **Categorías (4 endpoints)**
- `POST /categorias` - Crear categoría
- `GET /categorias` - Listar categorías
- `PUT /categorias/{id}` - Actualizar categoría
- `DELETE /categorias/{id}` - Eliminar categoría

### **Usuarios (5 endpoints)**
- `GET /getUsersapi` - Listar usuarios
- `POST /createUserapi` - Crear usuario
- `PUT /updateUserapi/{id}` - Actualizar usuario
- `DELETE /deleteUserapi/{id}` - Eliminar usuario
- `POST /loginUserapi` - Login usuario

### **Seguridad (7 endpoints)**
- `POST /generate-code` - Generar código aleatorio
- `POST /validate-code` - Validar código
- `POST /send-otp-email` - Enviar OTP por email
- `POST /verify-otp` - Verificar OTP
- `POST /resend-otp` - Reenviar OTP
- `POST /send-credentials-email` - Enviar credenciales
- `POST /cleanup-codes` - Limpiar códigos expirados

**Total: 64+ endpoints documentados**

## 🎨 Personalización

La configuración de Swagger está en `swagger.js`. Puedes personalizar:

- **Título y descripción** de la API
- **Servidores** (URLs de producción y desarrollo)
- **Esquemas** reutilizables
- **Tags** y organización

## 🔍 Ejemplos de Uso

### **Ejemplo 1: Crear una Venta**

```bash
POST /v1/papeleria/createSaleapi
Content-Type: application/json

{
  "code": "VTA-027",
  "productos": [
    {
      "code": "CU001",
      "cantidad": 2,
      "precioUnitario": 8000,
      "total": 16000
    }
  ],
  "metodoPago": "Efectivo",
  "cliente": {
    "name": "Juan Pérez",
    "document": "1234567890",
    "email": "juan@email.com",
    "phone": "3001234567"
  },
  "trabajador": {
    "correo": "vendedor@email.com",
    "nombre": "Carlos Vendedor"
  },
  "totalVenta": 16000
}
```

### **Ejemplo 2: Generar PDF de Factura**

```bash
GET /v1/papeleria/invoice-pdf/68d6bc80e8e7bad4fd954e1d
```

### **Ejemplo 3: Enviar Factura por Email (n8n)**

```bash
POST /v1/papeleria/send-invoice-n8n
Content-Type: application/json

{
  "saleId": "68d6c5a5ab5fab56747c00f9",
  "email": "jose@jose.com",
  "subject": "Gracias por tu compra",
  "message": "Estimado cliente, adjunto encontrará la factura."
}
```

### **Ejemplo 4: Crear Cliente**

```bash
POST /v1/papeleria/clientes
Content-Type: application/json

{
  "tipoIdentificacion": "CC",
  "numeroIdentificacion": "1234567890",
  "nombre": "Juan Pérez",
  "email": "juan@email.com",
  "telefono": "3001234567",
  "departamento": "Antioquia",
  "ciudad": "Medellín",
  "tipoCliente": "individual"
}
```

## 📚 Recursos Adicionales

- **Swagger UI**: https://swagger.io/tools/swagger-ui/
- **OpenAPI Specification**: https://swagger.io/specification/
- **Swagger JSDoc**: https://github.com/Surnet/swagger-jsdoc

## ⚠️ Notas Importantes

1. **CORS**: Los endpoints están configurados para aceptar requests desde los dominios permitidos
2. **Autenticación**: Actualmente no hay autenticación JWT implementada (puede agregarse)
3. **Variables de Entorno**: Algunos endpoints requieren variables de entorno configuradas:
   - `MONGO_URI` - Conexión a MongoDB
   - `N8N_WEBHOOK_URL` - URL del webhook de n8n
   - `BASE_URL` - URL base del servidor
   - `CODE_SECRET_DATA` - Secreto para encriptación
4. **Base de Datos**: Todos los endpoints requieren conexión a MongoDB

## 🚀 Próximos Pasos

1. **Probar endpoints** desde Swagger UI
2. **Revisar documentación** de cada endpoint
3. **Integrar** en el frontend usando los ejemplos
4. **Personalizar** según necesidades específicas

## 📝 Agregar Nuevos Endpoints

Para documentar un nuevo endpoint, agrega comentarios JSDoc en `swagger-docs.js`:

```javascript
/**
 * @swagger
 * /nuevo-endpoint:
 *   post:
 *     summary: Descripción del endpoint
 *     tags: [Tag]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               campo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Respuesta exitosa
 */
```

¡La documentación está lista para usar! 🎉

