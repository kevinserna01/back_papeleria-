/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// ============================================
// AUTENTICACIÓN
// ============================================

/**
 * @swagger
 * /registertrabajador:
 *   post:
 *     summary: Registrar un nuevo trabajador
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - correo
 *               - contraseña
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: Juan Pérez
 *               fecha:
 *                 type: string
 *                 example: "2025-01-26"
 *               cedula:
 *                 type: string
 *                 example: "1234567890"
 *               correo:
 *                 type: string
 *                 example: "juan@email.com"
 *               celular:
 *                 type: string
 *                 example: "3001234567"
 *               ciudad:
 *                 type: string
 *                 example: "Medellín"
 *               contraseña:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: Trabajador registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "Éxito"
 *                 message:
 *                   type: string
 *                 emailSent:
 *                   type: boolean
 *       400:
 *         description: Error en la validación o correo ya en uso
 */

/**
 * @swagger
 * /logintrabajador:
 *   post:
 *     summary: Iniciar sesión como trabajador
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - contraseña
 *             properties:
 *               correo:
 *                 type: string
 *                 example: "juan@email.com"
 *               contraseña:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login exitoso, código de verificación enviado por email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "Éxito"
 *                 message:
 *                   type: string
 *                 requiresVerification:
 *                   type: boolean
 *                 userId:
 *                   type: string
 *                 userType:
 *                   type: string
 *       400:
 *         description: Credenciales inválidas
 */

/**
 * @swagger
 * /logouttrabajador:
 *   post:
 *     summary: Cerrar sesión de trabajador
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *             properties:
 *               correo:
 *                 type: string
 *                 example: "juan@email.com"
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 */

/**
 * @swagger
 * /registeradminapi:
 *   post:
 *     summary: Registrar un nuevo administrador
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - correo
 *               - contraseña
 *             properties:
 *               nombre:
 *                 type: string
 *               correo:
 *                 type: string
 *               contraseña:
 *                 type: string
 *     responses:
 *       201:
 *         description: Administrador registrado exitosamente
 */

/**
 * @swagger
 * /loginadminapi:
 *   post:
 *     summary: Iniciar sesión como administrador
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - contraseña
 *             properties:
 *               correo:
 *                 type: string
 *               contraseña:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 */

// ============================================
// PRODUCTOS
// ============================================

/**
 * @swagger
 * /newproductapi:
 *   post:
 *     summary: Crear un nuevo producto
 *     tags: [Productos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Producto'
 *             example:
 *               name: "Cuaderno"
 *               code: "CU001"
 *               costPrice: 5000
 *               salePrice: 8000
 *               category: "Oficina"
 *               description: "Cuaderno de 100 hojas"
 *               createNewCategory: false
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *       400:
 *         description: Error de validación
 *       409:
 *         description: Producto con código duplicado
 */

/**
 * @swagger
 * /getProductsapi:
 *   get:
 *     summary: Obtener todos los productos
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Producto'
 */

/**
 * @swagger
 * /updateProductapi:
 *   put:
 *     summary: Actualizar un producto existente
 *     tags: [Productos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: "CU001"
 *               name:
 *                 type: string
 *               costPrice:
 *                 type: number
 *               salePrice:
 *                 type: number
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *       404:
 *         description: Producto no encontrado
 */

/**
 * @swagger
 * /deleteProductapi:
 *   delete:
 *     summary: Eliminar un producto
 *     tags: [Productos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: "CU001"
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *       404:
 *         description: Producto no encontrado
 */

// ============================================
// INVENTARIO
// ============================================

/**
 * @swagger
 * /assignProductToInventoryapi:
 *   post:
 *     summary: Asignar producto al inventario
 *     tags: [Inventario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *               - category
 *               - stock
 *               - minStock
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               stock:
 *                 type: number
 *               minStock:
 *                 type: number
 *     responses:
 *       201:
 *         description: Producto asignado al inventario
 */

/**
 * @swagger
 * /getInventoryProductsapi:
 *   get:
 *     summary: Obtener todos los productos del inventario
 *     tags: [Inventario]
 *     responses:
 *       200:
 *         description: Lista de productos en inventario
 */

/**
 * @swagger
 * /updateInventoryProductapi:
 *   put:
 *     summary: Actualizar producto en inventario
 *     tags: [Inventario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *               stock:
 *                 type: number
 *               minStock:
 *                 type: number
 *     responses:
 *       200:
 *         description: Producto actualizado
 */

/**
 * @swagger
 * /deleteInventoryProductapi:
 *   delete:
 *     summary: Eliminar producto del inventario
 *     tags: [Inventario]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Producto eliminado del inventario
 */

/**
 * @swagger
 * /getProductsWithStockapi:
 *   get:
 *     summary: Obtener productos con stock disponible
 *     tags: [Inventario]
 *     responses:
 *       200:
 *         description: Lista de productos con stock
 */

// ============================================
// VENTAS
// ============================================

/**
 * @swagger
 * /createSaleapi:
 *   post:
 *     summary: Crear una nueva venta
 *     tags: [Ventas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Venta'
 *             example:
 *               code: "VTA-027"
 *               productos:
 *                 - code: "CU001"
 *                   cantidad: 2
 *                   precioUnitario: 8000
 *                   total: 16000
 *               metodoPago: "Efectivo"
 *               cliente:
 *                 name: "Juan Pérez"
 *                 document: "1234567890"
 *                 email: "juan@email.com"
 *                 phone: "3001234567"
 *               trabajador:
 *                 correo: "vendedor@email.com"
 *                 nombre: "Carlos Vendedor"
 *               totalVenta: 16000
 *               descuentoAplicado: 0
 *     responses:
 *       201:
 *         description: Venta creada exitosamente
 *       400:
 *         description: Error de validación
 *       409:
 *         description: Código de venta duplicado o stock insuficiente
 */

/**
 * @swagger
 * /salesapi:
 *   get:
 *     summary: Obtener todas las ventas
 *     tags: [Ventas]
 *     parameters:
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de ventas
 */

/**
 * @swagger
 * /getLastSaleCodeapi:
 *   get:
 *     summary: Obtener el último código de venta registrado
 *     tags: [Ventas]
 *     responses:
 *       200:
 *         description: Último código de venta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 lastCode:
 *                   type: string
 *                   example: "VTA-027"
 */

/**
 * @swagger
 * /checkAndReserveSaleCodeapi/{code}:
 *   post:
 *     summary: Verificar y reservar código de venta
 *     tags: [Ventas]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Código reservado exitosamente
 */

/**
 * @swagger
 * /releaseSaleCodeapi/{code}:
 *   post:
 *     summary: Liberar código de venta reservado
 *     tags: [Ventas]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Código liberado exitosamente
 */

// ============================================
// FACTURAS PDF
// ============================================

/**
 * @swagger
 * /invoice-pdf/{saleId}:
 *   get:
 *     summary: Generar PDF de factura por ID de venta
 *     tags: [Facturas PDF]
 *     parameters:
 *       - in: path
 *         name: saleId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la venta
 *         example: "68d6bc80e8e7bad4fd954e1d"
 *     responses:
 *       200:
 *         description: PDF generado exitosamente
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Venta no encontrada
 */

/**
 * @swagger
 * /factura-pdf/{facturaId}:
 *   get:
 *     summary: Generar PDF de factura por ID de factura
 *     tags: [Facturas PDF]
 *     parameters:
 *       - in: path
 *         name: facturaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la factura
 *     responses:
 *       200:
 *         description: PDF generado exitosamente
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */

/**
 * @swagger
 * /send-invoice-n8n:
 *   post:
 *     summary: Enviar factura por email usando n8n
 *     tags: [Facturas PDF]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - saleId
 *               - email
 *             properties:
 *               saleId:
 *                 type: string
 *                 example: "68d6c5a5ab5fab56747c00f9"
 *               email:
 *                 type: string
 *                 example: "jose@jose.com"
 *               subject:
 *                 type: string
 *                 example: "Gracias por tu compra, jose"
 *               message:
 *                 type: string
 *                 example: "Estimado jose, adjunto encontrará la factura de su compra (VTA-031). Gracias por elegirnos."
 *     responses:
 *       200:
 *         description: Datos enviados a n8n correctamente
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Venta no encontrada
 *       500:
 *         description: Error al conectar con n8n
 */

/**
 * @swagger
 * /send-invoice-email:
 *   post:
 *     summary: Enviar factura por email directamente
 *     tags: [Facturas PDF]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - saleId
 *               - email
 *             properties:
 *               saleId:
 *                 type: string
 *               email:
 *                 type: string
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email enviado exitosamente
 */

/**
 * @swagger
 * /test-n8n-connection:
 *   get:
 *     summary: Probar conexión con n8n
 *     tags: [Facturas PDF]
 *     responses:
 *       200:
 *         description: Conexión exitosa
 *       500:
 *         description: Error de conexión
 */

/**
 * @swagger
 * /test-n8n-webhook:
 *   get:
 *     summary: Probar webhook de n8n
 *     tags: [Facturas PDF]
 *     responses:
 *       200:
 *         description: Webhook funcionando
 */

// ============================================
// CLIENTES
// ============================================

/**
 * @swagger
 * /clientes:
 *   post:
 *     summary: Crear un nuevo cliente
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cliente'
 *     responses:
 *       201:
 *         description: Cliente creado exitosamente
 *       400:
 *         description: Error de validación
 *       409:
 *         description: Cliente ya existe
 *   get:
 *     summary: Obtener lista de clientes
 *     tags: [Clientes]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [activo, inactivo, all]
 *     responses:
 *       200:
 *         description: Lista de clientes
 */

/**
 * @swagger
 * /clientes/{id}:
 *   get:
 *     summary: Obtener cliente por ID
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *       404:
 *         description: Cliente no encontrado
 *   put:
 *     summary: Actualizar cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Cliente'
 *     responses:
 *       200:
 *         description: Cliente actualizado
 *   delete:
 *     summary: Eliminar cliente
 *     tags: [Clientes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cliente eliminado
 */

/**
 * @swagger
 * /clientes/search:
 *   get:
 *     summary: Buscar clientes
 *     tags: [Clientes]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Término de búsqueda (mínimo 2 caracteres)
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [all, individual, empresa]
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 */

/**
 * @swagger
 * /searchCustomersapi:
 *   get:
 *     summary: Buscar clientes (endpoint alternativo)
 *     tags: [Clientes]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 */

// ============================================
// FACTURACIÓN
// ============================================

/**
 * @swagger
 * /facturas:
 *   post:
 *     summary: Crear una nueva factura
 *     tags: [Facturación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Factura'
 *     responses:
 *       201:
 *         description: Factura creada exitosamente
 *   get:
 *     summary: Obtener lista de facturas
 *     tags: [Facturación]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *       - in: query
 *         name: clienteId
 *         schema:
 *           type: string
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de facturas
 */

/**
 * @swagger
 * /facturas/{id}:
 *   get:
 *     summary: Obtener factura por ID
 *     tags: [Facturación]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Factura encontrada
 *       404:
 *         description: Factura no encontrada
 */

/**
 * @swagger
 * /facturas/{id}/estado:
 *   put:
 *     summary: Actualizar estado de factura
 *     tags: [Facturación]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [pendiente, pagada, parcialmente_pagada, vencida, cancelada]
 *               observaciones:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado actualizado
 */

/**
 * @swagger
 * /facturas/cliente/{clienteId}:
 *   get:
 *     summary: Obtener facturas por cliente
 *     tags: [Facturación]
 *     parameters:
 *       - in: path
 *         name: clienteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de facturas del cliente
 */

/**
 * @swagger
 * /facturas-plan/{id}:
 *   get:
 *     summary: Obtener factura con plan de pagos
 *     tags: [Facturación]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Factura con plan de pagos
 */

// ============================================
// ABONOS
// ============================================

/**
 * @swagger
 * /abonos:
 *   post:
 *     summary: Registrar un abono a una factura
 *     tags: [Abonos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Abono'
 *     responses:
 *       201:
 *         description: Abono registrado exitosamente
 */

/**
 * @swagger
 * /abonos/factura/{facturaId}:
 *   get:
 *     summary: Obtener abonos por factura
 *     tags: [Abonos]
 *     parameters:
 *       - in: path
 *         name: facturaId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de abonos de la factura
 */

/**
 * @swagger
 * /abonos/cliente/{clienteId}:
 *   get:
 *     summary: Obtener abonos por cliente
 *     tags: [Abonos]
 *     parameters:
 *       - in: path
 *         name: clienteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de abonos del cliente
 */

/**
 * @swagger
 * /confirmar-abono:
 *   post:
 *     summary: Confirmar un abono programado
 *     tags: [Abonos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - abonoId
 *             properties:
 *               abonoId:
 *                 type: string
 *               montoPagado:
 *                 type: number
 *               fechaPago:
 *                 type: string
 *     responses:
 *       200:
 *         description: Abono confirmado exitosamente
 */

/**
 * @swagger
 * /editar-plan-abonos:
 *   put:
 *     summary: Editar plan de abonos de una factura
 *     tags: [Abonos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facturaId
 *               - abonos
 *             properties:
 *               facturaId:
 *                 type: string
 *               abonos:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Plan de abonos actualizado
 */

/**
 * @swagger
 * /suggest-payment-amounts:
 *   post:
 *     summary: Sugerir montos de abonos para una factura
 *     tags: [Abonos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facturaId
 *               - numeroAbonos
 *             properties:
 *               facturaId:
 *                 type: string
 *               numeroAbonos:
 *                 type: number
 *     responses:
 *       200:
 *         description: Sugerencias de montos de abonos
 */

/**
 * @swagger
 * /dashboard-abonos:
 *   get:
 *     summary: Obtener dashboard de abonos
 *     tags: [Abonos]
 *     parameters:
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dashboard de abonos
 */

// ============================================
// ESTADO DE CUENTA
// ============================================

/**
 * @swagger
 * /estado-cuenta/{clienteId}:
 *   get:
 *     summary: Obtener estado de cuenta de un cliente
 *     tags: [Facturación]
 *     parameters:
 *       - in: path
 *         name: clienteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado de cuenta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     cliente:
 *                       type: object
 *                     resumenFinanciero:
 *                       type: object
 *                     facturas:
 *                       type: array
 *                     abonos:
 *                       type: array
 */

// ============================================
// REPORTES
// ============================================

/**
 * @swagger
 * /reportsapi:
 *   get:
 *     summary: Generar reportes de ventas
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [completo, resumen, departamentos, categorias, mensual, trabajadores, productos-mas-cantidad, productos-menos-cantidad, productos-mas-total, productos-menos-total]
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf, excel]
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           enum: [dia, semana, mes, año, custom]
 *     responses:
 *       200:
 *         description: Reporte generado exitosamente
 */

/**
 * @swagger
 * /reportsapi/day:
 *   get:
 *     summary: Obtener reporte de un día específico
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Reporte del día
 */

/**
 * @swagger
 * /reportsapi/export:
 *   post:
 *     summary: Exportar reporte en PDF
 *     tags: [Reportes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fecha:
 *                 type: string
 *     responses:
 *       200:
 *         description: PDF generado
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */

/**
 * @swagger
 * /reportes/cartera:
 *   get:
 *     summary: Reporte de cartera
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf, excel]
 *     responses:
 *       200:
 *         description: Reporte de cartera generado
 */

/**
 * @swagger
 * /reportes/facturas-vencidas:
 *   get:
 *     summary: Obtener facturas vencidas
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: diasVencimiento
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de facturas vencidas
 */

/**
 * @swagger
 * /reportes/analisis-pagos:
 *   get:
 *     summary: Análisis de pagos
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: desde
 *         schema:
 *           type: string
 *       - in: query
 *         name: hasta
 *         schema:
 *           type: string
 *       - in: query
 *         name: metodoPago
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf, excel]
 *     responses:
 *       200:
 *         description: Análisis de pagos generado
 */

/**
 * @swagger
 * /dashboardapi:
 *   get:
 *     summary: Obtener datos del dashboard
 *     tags: [Reportes]
 *     responses:
 *       200:
 *         description: Datos del dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 */

// ============================================
// CATEGORÍAS
// ============================================

/**
 * @swagger
 * /categorias:
 *   post:
 *     summary: Crear una nueva categoría
 *     tags: [Categorías]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Oficina"
 *               description:
 *                 type: string
 *                 example: "Productos de oficina"
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
 *   get:
 *     summary: Obtener todas las categorías
 *     tags: [Categorías]
 *     responses:
 *       200:
 *         description: Lista de categorías
 */

/**
 * @swagger
 * /categorias/{id}:
 *   put:
 *     summary: Actualizar categoría
 *     tags: [Categorías]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Categoría actualizada
 *   delete:
 *     summary: Eliminar categoría
 *     tags: [Categorías]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Categoría eliminada
 */

// ============================================
// USUARIOS
// ============================================

/**
 * @swagger
 * /getUsersapi:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */

/**
 * @swagger
 * /createUserapi:
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, worker, user]
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 */

/**
 * @swagger
 * /updateUserapi/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado
 */

/**
 * @swagger
 * /deleteUserapi/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     tags: [Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario eliminado
 */

/**
 * @swagger
 * /loginUserapi:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 */

// ============================================
// SEGURIDAD - CÓDIGOS Y OTP
// ============================================

/**
 * @swagger
 * /generate-code:
 *   post:
 *     summary: Generar código aleatorio después del login
 *     tags: [Seguridad]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userType
 *             properties:
 *               userId:
 *                 type: string
 *               userType:
 *                 type: string
 *                 enum: [trabajador, admin, user]
 *     responses:
 *       200:
 *         description: Código generado y enviado por email
 */

/**
 * @swagger
 * /validate-code:
 *   post:
 *     summary: Validar código aleatorio
 *     tags: [Seguridad]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - userId
 *               - userType
 *             properties:
 *               code:
 *                 type: string
 *               userId:
 *                 type: string
 *               userType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Código válido
 *       400:
 *         description: Código inválido o expirado
 */

/**
 * @swagger
 * /send-otp-email:
 *   post:
 *     summary: Generar y enviar OTP por email
 *     tags: [Seguridad]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userType
 *               - email
 *               - userName
 *             properties:
 *               userId:
 *                 type: string
 *               userType:
 *                 type: string
 *               email:
 *                 type: string
 *               userName:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP generado y enviado
 */

/**
 * @swagger
 * /verify-otp:
 *   post:
 *     summary: Verificar OTP y completar login
 *     tags: [Seguridad]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userType
 *               - otpCode
 *             properties:
 *               userId:
 *                 type: string
 *               userType:
 *                 type: string
 *               otpCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verificado, login completado
 *       400:
 *         description: OTP inválido
 */

/**
 * @swagger
 * /resend-otp:
 *   post:
 *     summary: Reenviar código OTP
 *     tags: [Seguridad]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userType
 *             properties:
 *               userId:
 *                 type: string
 *               userType:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP reenviado
 */

/**
 * @swagger
 * /send-credentials-email:
 *   post:
 *     summary: Enviar credenciales por email
 *     tags: [Seguridad]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - userName
 *               - userType
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               userName:
 *                 type: string
 *               userType:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Credenciales enviadas por email
 */

/**
 * @swagger
 * /cleanup-codes:
 *   post:
 *     summary: Limpiar códigos expirados
 *     tags: [Seguridad]
 *     responses:
 *       200:
 *         description: Códigos expirados eliminados
 */

module.exports = {};

