# 📋 README - Sistema de Facturación y Cartera - API Backend

## 🚀 Nuevas Funcionalidades Implementadas

Se ha implementado un sistema completo de facturación y gestión de cartera con las siguientes funcionalidades:

- ✅ **CRUD de Clientes Mejorado**
- ✅ **Sistema de Facturación**
- ✅ **Sistema de Abonos**
- ✅ **Estado de Cuenta por Cliente**
- ✅ **Reportes de Cartera Avanzados**

---

## 🔗 Base URL
```
https://back-papeleria-two.vercel.app/v1/papeleria
```

---

## 👥 Gestión de Clientes

### 1. Crear Cliente
```http
POST /clientes
Content-Type: application/json

{
  "tipoIdentificacion": "CC",
  "numeroIdentificacion": "12345678",
  "nombre": "Juan Pérez",
  "email": "juan@email.com",
  "telefono": "3001234567",
  "departamento": "Cundinamarca",
  "ciudad": "Bogotá",
  "ubicacionLocal": "Calle 123 #45-67",
  "tipoCliente": "individual",
  "descuentoPersonalizado": 5
}
```

**Tipos de Identificación válidos:** `CC`, `NIT`, `CE`, `TI`, `RC`, `PAS`

### 2. Listar Clientes
```http
GET /clientes?page=1&limit=10&search=juan&estado=activo
```

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10)
- `search` (opcional): Búsqueda por nombre, documento, email o ciudad
- `estado` (opcional): `activo`, `inactivo`, `all` (default: `activo`)

### 3. Obtener Cliente por ID
```http
GET /clientes/:id
```

### 4. Actualizar Cliente
```http
PUT /clientes/:id
Content-Type: application/json

{
  "nombre": "Juan Carlos Pérez",
  "email": "juancarlos@email.com",
  "descuentoPersonalizado": 10
}
```

### 5. Eliminar Cliente
```http
DELETE /clientes/:id
```

### 6. Buscar Clientes
```http
GET /clientes/search?q=juan&tipo=individual
```

**Query Parameters:**
- `q` (requerido): Término de búsqueda (mínimo 2 caracteres)
- `tipo` (opcional): `individual`, `empresa`, `mayorista`, `all`

---

## 🧾 Sistema de Facturación

### 1. Crear Factura
```http
POST /facturas
Content-Type: application/json

{
  "clienteId": "64a1b2c3d4e5f6789012345",
  "productos": [
    {
      "code": "PROD001",
      "cantidad": 2,
      "precioUnitario": 15000
    }
  ],
  "descuentoAplicado": 5,
  "iva": 19,
  "observaciones": "Factura con descuento especial",
  "metodoPago": "Efectivo",
  "diasVencimiento": 30
}
```

**Métodos de Pago:** `Efectivo`, `Nequi`, `Transferencia`

### 2. Listar Facturas
```http
GET /facturas?page=1&limit=10&estado=pendiente&clienteId=64a1b2c3d4e5f6789012345&desde=2024-01-01&hasta=2024-12-31
```

**Query Parameters:**
- `page`, `limit`: Paginación
- `estado`: `pendiente`, `pagada`, `parcialmente_pagada`, `vencida`, `cancelada`, `all`
- `clienteId`: Filtrar por cliente específico
- `desde`, `hasta`: Filtro por fechas (YYYY-MM-DD)

### 3. Obtener Factura por ID
```http
GET /facturas/:id
```

### 4. Actualizar Estado de Factura
```http
PUT /facturas/:id/estado
Content-Type: application/json

{
  "estado": "pagada",
  "observaciones": "Factura pagada completamente"
}
```

### 5. Facturas por Cliente
```http
GET /facturas/cliente/:clienteId?estado=pendiente
```

---

## 💰 Sistema de Abonos

### 1. Registrar Abono
```http
POST /abonos
Content-Type: application/json

{
  "facturaId": "64a1b2c3d4e5f6789012345",
  "montoAbono": 50000,
  "metodoPago": "Efectivo",
  "observaciones": "Abono parcial",
  "usuarioRegistra": "admin"
}
```

### 2. Abonos por Factura
```http
GET /abonos/factura/:facturaId
```

### 3. Abonos por Cliente
```http
GET /abonos/cliente/:clienteId?desde=2024-01-01&hasta=2024-12-31
```

---

## 📊 Estado de Cuenta

### Estado de Cuenta Completo
```http
GET /estado-cuenta/:clienteId
```

**Respuesta incluye:**
- Información del cliente
- Resumen financiero (total facturado, abonado, saldo pendiente)
- Lista de facturas con estados
- Historial de abonos
- Métricas de vencimiento

---

## 📈 Reportes de Cartera

### 1. Reporte de Cartera
```http
GET /reportes/cartera?desde=2024-01-01&hasta=2024-12-31&estado=pendiente&diasVencimiento=30&format=json
```

**Query Parameters:**
- `desde`, `hasta`: Filtro por fechas
- `estado`: Estado de facturas
- `diasVencimiento`: Mínimo días de vencimiento
- `format`: `json`, `pdf`, `excel`

### 2. Facturas Vencidas
```http
GET /reportes/facturas-vencidas?diasVencimiento=30
```

### 3. Análisis de Pagos
```http
GET /reportes/analisis-pagos?desde=2024-01-01&hasta=2024-12-31&metodoPago=all&format=json
```

**Query Parameters:**
- `desde`, `hasta`: Filtro por fechas
- `metodoPago`: `Efectivo`, `Nequi`, `Transferencia`, `all`
- `format`: `json`, `pdf`, `excel`

---

## 📋 Estructura de Respuestas

### Respuesta Exitosa
```json
{
  "status": "Success",
  "message": "Operación realizada correctamente",
  "data": {
    // Datos específicos de la operación
  }
}
```

### Respuesta con Paginación
```json
{
  "status": "Success",
  "message": "Datos obtenidos correctamente",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

### Respuesta de Error
```json
{
  "status": "Error",
  "message": "Descripción del error",
  "error": "Detalles técnicos del error"
}
```

---

## 🔍 Códigos de Estado HTTP

- **200**: Operación exitosa
- **201**: Recurso creado exitosamente
- **400**: Error en la petición (datos inválidos)
- **404**: Recurso no encontrado
- **409**: Conflicto (recurso ya existe)
- **500**: Error interno del servidor

---

## ⚠️ Validaciones Importantes

### Clientes
- Email debe tener formato válido
- Tipo de identificación debe ser uno de los valores permitidos
- Número de identificación debe ser único por tipo
- Email debe ser único

### Facturas
- Cliente debe existir
- Productos deben tener stock suficiente
- Cantidades deben ser mayores a 0
- Descuentos se aplican automáticamente según el cliente

### Abonos
- Monto debe ser mayor a 0
- No puede exceder el saldo pendiente
- Factura no puede estar cancelada o completamente pagada

---

## 📱 Ejemplos de Uso Frontend

### Flujo de Creación de Factura
1. Buscar cliente: `GET /clientes/search?q=juan`
2. Obtener productos con stock: `GET /getProductsWithStockapi`
3. Crear factura: `POST /facturas`
4. Registrar abono (opcional): `POST /abonos`

### Flujo de Consulta de Estado de Cuenta
1. Buscar cliente: `GET /clientes/search?q=juan`
2. Obtener estado de cuenta: `GET /estado-cuenta/:clienteId`
3. Ver facturas del cliente: `GET /facturas/cliente/:clienteId`
4. Registrar abono si es necesario: `POST /abonos`

### Flujo de Reportes
1. Generar reporte de cartera: `GET /reportes/cartera?format=json`
2. Exportar a PDF: `GET /reportes/cartera?format=pdf`
3. Exportar a Excel: `GET /reportes/cartera?format=excel`

---

## 🛠️ Notas Técnicas

- Todas las fechas están en zona horaria de Colombia (America/Bogota)
- Los números de factura se generan automáticamente de forma secuencial
- Los descuentos se aplican automáticamente según el cliente
- El stock se actualiza automáticamente al crear facturas
- Los estados de factura se actualizan automáticamente con los abonos
- Los productos ahora incluyen precio de costo y precio de venta para trazabilidad
- Las categorías se pueden crear dinámicamente al crear productos
- El margen de ganancia se calcula automáticamente

---

## 📦 Gestión de Productos Mejorada

### 1. Crear Producto (Actualizado)
```http
POST /newproductapi
Content-Type: application/json

{
  "name": "Maletín Ejecutivo",
  "code": "MA001",
  "costPrice": 15000,
  "salePrice": 25000,
  "category": "Útiles",
  "description": "Maletín para documentos",
  "createNewCategory": false
}
```

**Nuevos campos:**
- `costPrice`: Precio de costo del producto
- `salePrice`: Precio de venta del producto
- `createNewCategory`: Si es true, crea la categoría si no existe

### 2. Actualizar Producto (Actualizado)
```http
PUT /updateProductapi
Content-Type: application/json

{
  "code": "MA001",
  "costPrice": 16000,
  "salePrice": 26000,
  "category": "Nueva Categoría",
  "createNewCategory": true
}
```

### 3. Productos con Stock (Actualizado)
```http
GET /getProductsWithStockapi
```

**Respuesta incluye:**
- `precioCosto`: Precio de costo
- `margenGanancia`: Margen de ganancia calculado automáticamente

---

## 🏷️ Gestión de Categorías

### 1. Crear Categoría
```http
POST /categorias
Content-Type: application/json

{
  "name": "Útiles Escolares",
  "description": "Productos para estudiantes"
}
```

### 2. Listar Categorías
```http
GET /categorias
```

### 3. Actualizar Categoría
```http
PUT /categorias/:id
Content-Type: application/json

{
  "name": "Útiles de Oficina",
  "description": "Productos para oficina"
}
```

### 4. Eliminar Categoría
```http
DELETE /categorias/:id
```

**Nota:** No se puede eliminar una categoría si hay productos usándola.

---

## 📊 Nuevas Funcionalidades de Productos

### Campos Actualizados:
- **`costPrice`**: Precio de costo (obligatorio)
- **`salePrice`**: Precio de venta (obligatorio)
- **`profitMargin`**: Margen de ganancia (calculado automáticamente)
- **`category`**: Categoría (opcional, se puede crear dinámicamente)

### Validaciones:
- El precio de venta no puede ser menor al precio de costo
- Los precios no pueden ser negativos
- Las categorías se crean automáticamente si no existen
- El margen de ganancia se calcula: `((salePrice - costPrice) / costPrice) * 100`

---

## 📞 Soporte

Para dudas o problemas con la API, contactar al equipo de backend.

**¡Sistema listo para implementar en el frontend! 🚀**

---

## 📚 Endpoints Completos

### Clientes
- `POST /clientes` - Crear cliente
- `GET /clientes` - Listar clientes
- `GET /clientes/:id` - Obtener cliente por ID
- `PUT /clientes/:id` - Actualizar cliente
- `DELETE /clientes/:id` - Eliminar cliente
- `GET /clientes/search` - Buscar clientes

### Facturas
- `POST /facturas` - Crear factura
- `GET /facturas` - Listar facturas
- `GET /facturas/:id` - Obtener factura por ID
- `PUT /facturas/:id/estado` - Actualizar estado de factura
- `GET /facturas/cliente/:clienteId` - Facturas por cliente

### Abonos
- `POST /abonos` - Registrar abono
- `GET /abonos/factura/:facturaId` - Abonos por factura
- `GET /abonos/cliente/:clienteId` - Abonos por cliente

### Estado de Cuenta
- `GET /estado-cuenta/:clienteId` - Estado de cuenta completo

### Reportes
- `GET /reportes/cartera` - Reporte de cartera
- `GET /reportes/facturas-vencidas` - Facturas vencidas
- `GET /reportes/analisis-pagos` - Análisis de pagos
- `GET /reportsapi` - **REPORTES AVANZADOS DE VENTAS** (NUEVO)

### Ventas
- `POST /createSaleapi` - Crear venta (ACTUALIZADO CON TRABAJADOR)

#### Crear Venta (Actualizado)
**Endpoint:** `POST /createSaleapi`

**Body:**
```json
{
  "code": "V001",
  "productos": [
    {
      "code": "P001",
      "cantidad": 2
    }
  ],
  "metodoPago": "Efectivo",
  "cliente": {
    "name": "Juan Pérez",
    "document": "12345678",
    "email": "juan@email.com",
    "phone": "3001234567"
  },
  "trabajador": {
    "correo": "trabajador@empresa.com"
  }
}
```

**Respuesta:**
```json
{
  "status": "Success",
  "message": "Venta registrada correctamente.",
  "data": {
    "code": "V001",
    "fecha": "2024-01-15T10:30:00.000Z",
    "hora": "10:30:00",
    "cliente": {
      "name": "Juan Pérez",
      "document": "12345678",
      "email": "juan@email.com",
      "phone": "3001234567"
    },
    "trabajador": {
      "correo": "trabajador@empresa.com",
      "nombre": "Carlos García",
      "cedula": "87654321"
    },
    "productos": [...],
    "totalVenta": 50000,
    "metodoPago": "Efectivo",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Notas importantes:**
- El campo `trabajador` es opcional pero recomendado para trazabilidad
- Si se proporciona `trabajador.correo`, se valida que el trabajador exista
- El trabajador se busca en la colección `trabajadores` por correo
- Si el trabajador no existe, la venta falla con error 404



#### Reportes Avanzados de Ventas
El endpoint `/reportsapi` ahora incluye un sistema completo de reportes con múltiples filtros y análisis:

**Parámetros de consulta:**
- `periodo` - Tipo de período: `dia`, `semana`, `mes`, `año`, `custom`
- `fechaEspecifica` - Fecha específica para filtros (formato: YYYY-MM-DD)
- `startDate` - Fecha de inicio (para período personalizado)
- `endDate` - Fecha de fin (para período personalizado)
- `type` - Tipo de reporte específico
- `format` - Formato de salida: `json`, `pdf`, `excel`

**Tipos de reporte disponibles:**
- `completo` - Reporte completo con todos los análisis
- `resumen` - Resumen general del período
- `departamentos` - Ventas por departamentos
- `categorias` - Ventas por categorías de productos
- `mensual` - Ventas por mes (desde fecha específica hasta año actual)
- `trabajadores` - Ventas por trabajador/empleado
- `productos-mas-cantidad` - Top productos más vendidos por cantidad
- `productos-menos-cantidad` - Productos menos vendidos por cantidad
- `productos-mas-total` - Top productos más vendidos por total generado
- `productos-menos-total` - Productos menos vendidos por total generado

**Ejemplos de uso:**
```
# Reporte completo del día actual
GET /reportsapi?periodo=dia&type=completo

# Reporte de ventas por departamentos del mes actual
GET /reportsapi?periodo=mes&type=departamentos

# Top productos más vendidos en PDF
GET /reportsapi?periodo=mes&type=productos-mas-cantidad&format=pdf

# Reporte personalizado de una semana específica
GET /reportsapi?startDate=2024-01-01&endDate=2024-01-07&type=completo&format=excel

# Ventas por categorías de un día específico
GET /reportsapi?periodo=dia&fechaEspecifica=2024-01-15&type=categorias
```

**Análisis incluidos en el reporte completo:**
1. **Resumen General** - Totales, promedios, métricas clave
2. **Ventas por Departamentos** - Análisis geográfico de ventas
3. **Ventas por Categorías** - Performance por categoría de producto
4. **Ventas por Mes** - Tendencias mensuales desde fecha específica
5. **Ventas por Trabajador** - Performance individual de empleados
6. **Top 20 Productos** - Más y menos vendidos por cantidad y total
7. **Exportación** - PDF y Excel con múltiples hojas

---

## 🗄️ Colecciones de MongoDB

- **`clientes`** - Información completa de clientes
- **`facturas`** - Sistema de facturación
- **`abonos`** - Registro de pagos
- **`clientesHistorial`** - Historial de clientes eliminados

---

## 📊 Métricas y Análisis Disponibles

- **Cartera por cliente** con totales y saldos
- **Análisis de morosidad** con días de vencimiento
- **Top clientes** por pagos realizados
- **Análisis por método de pago**
- **Tendencias temporales** (día, mes)
- **Reportes exportables** en múltiples formatos

---

## 🔧 Características Técnicas

1. **Validaciones robustas** en todos los endpoints
2. **Manejo de errores** consistente
3. **Paginación** en listados grandes
4. **Filtros avanzados** por fechas, estados, etc.
5. **Exportación** a PDF y Excel
6. **Cálculos automáticos** de totales y saldos
7. **Zona horaria** configurada para Colombia
8. **Logs de auditoría** para eliminaciones
