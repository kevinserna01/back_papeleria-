const CryptoJS = require('crypto-js');
const moment = require('moment-timezone');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const { getDb }  = require('../../database/mongo');
const nodemailer = require('nodemailer'); 



const registertrabajador = async (req, res) => {
    const { nombre, fecha, cedula, correo, celular, ciudad, contraseña } = req.body;
  
    const hashedPassword = CryptoJS.SHA256(contraseña, process.env.CODE_SECRET_DATA).toString();
  
    try {
        await connectDb(); // Conectar a la base de datos
        const db = getDb(); // Obtener la referencia a la base de datos
  
        const existingUser = await db.collection('trabajadores').findOne({ correo });
        if (existingUser) {
            return res.status(400).json({ status: "Error", message: "El correo ya está en uso" });
        }
  
        const newUser = {
            nombre,
            fecha,
            cedula,
            correo,
            celular,
            ciudad,
            password: hashedPassword,
            role: 'trabajador'
        };
  
        await db.collection('trabajadores').insertOne(newUser);
        res.status(201).json({ status: "Éxito", message: "Usuario registrado correctamente" });
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        res.status(500).json({ status: "Error", message: "Internal Server Error" });
    }
  };
  const loginTrabajador = async (req, res) => {
    const { correo, contraseña } = req.body;

    try {
        await connectDb(); // Conectar a la base de datos
        const db = getDb(); // Obtener la referencia a la base de datos

        // Buscar al usuario por correo
        const user = await db.collection('trabajadores').findOne({ correo });
        if (!user) {
            return res.status(400).json({ status: "Error", message: "Credenciales inválidas" });
        }

        // Comparar la contraseña cifrada
        const hashedPassword = CryptoJS.SHA256(contraseña, process.env.CODE_SECRET_DATA).toString();
        if (hashedPassword !== user.password) {
            return res.status(400).json({ status: "Error", message: "Credenciales inválidas" });
        }

        // Registrar hora de entrada
        const entrada = moment().tz("America/Bogota").format('YYYY-MM-DD HH:mm:ss');

        // Crear el log
        const logEntry = {
            userId: user._id,
            correo: user.correo,
            entrada,
            salida: null, // La hora de salida se establece más tarde
            createdAt: new Date() // Fecha de creación del log
        };

        // Insertar el log en la colección de logs
        await db.collection('logs').insertOne(logEntry);

        // Generar código aleatorio después del login exitoso
        const codeData = await generateRandomCode(user._id.toString(), 'trabajador');
        
        // Enviar código por email
        const emailResult = await sendOTPByEmail(user.correo, codeData.code, user.nombre, 'trabajador');

        res.status(200).json({ 
            status: "Éxito", 
            message: "Credenciales correctas. Se ha enviado un código de verificación a tu email.", 
            logEntry,
            requiresVerification: true,
            userId: user._id.toString(),
            userType: 'trabajador',
            emailSent: emailResult.success,
            emailMessage: emailResult.success ? "Código enviado exitosamente" : "Error enviando código por email"
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ status: "Error", message: "Internal Server Error" });
    }
};
const logoutTrabajador = async (req, res) => {
    const { correo } = req.body;

    try {
        await connectDb(); // Conectar a la base de datos
        const db = getDb(); // Obtener la referencia a la base de datos

        // Encontrar el log más reciente del usuario
        const log = await db.collection('logs').findOne({ correo, salida: null });
        if (!log) {
            return res.status(400).json({ status: "Error", message: "No hay sesión activa para este usuario" });
        }

        // Registrar hora de salida
        const salida = moment().tz("America/Bogota").format('YYYY-MM-DD HH:mm:ss');

        // Actualizar el log con la hora de salida
        await db.collection('logs').updateOne(
            { _id: log._id },
            { $set: { salida, updatedAt: new Date() } }
        );

        res.status(200).json({ status: "Éxito", message: "Cierre de sesión exitoso", log });
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        res.status(500).json({ status: "Error", message: "Internal Server Error" });
    }
};

/*---------------------------------CRUD_productos--------------------------------------------------------------*/

const newProduct = async (req, res) => {
  try {
    const db = await getDb();

    const { 
      name, 
      code, 
      costPrice = 0, 
      salePrice = 0, 
      category, 
      description = '',
      createNewCategory = false
    } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        status: "Error",
        message: "Los campos name y code son obligatorios."
      });
    }

    if (costPrice < 0 || salePrice < 0) {
      return res.status(400).json({
        status: "Error",
        message: "Los precios no pueden ser negativos."
      });
    }

    if (salePrice < costPrice) {
      return res.status(400).json({
        status: "Error",
        message: "El precio de venta no puede ser menor al precio de costo."
      });
    }

    const existingProduct = await db.collection('productos').findOne({ code });
    if (existingProduct) {
      return res.status(409).json({
        status: "Error",
        message: "Ya existe un producto con ese código."
      });
    }

    // Manejar categoría
    let finalCategory = category;
    if (createNewCategory && category) {
      // Verificar si la categoría ya existe
      const existingCategory = await db.collection('categorias').findOne({ 
        name: { $regex: new RegExp(`^${category}$`, 'i') } 
      });
      
      if (!existingCategory) {
        // Crear nueva categoría
        const newCategory = {
          name: category,
          description: `Categoría creada automáticamente para ${name}`,
          createdAt: new Date(),
          lastUpdate: new Date()
        };
        await db.collection('categorias').insertOne(newCategory);
      }
    }

    // Calcular margen de ganancia
    const profitMargin = costPrice > 0 ? ((salePrice - costPrice) / costPrice * 100) : 0;

    const newProduct = {
      name,
      code,
      costPrice: Number(costPrice),
      salePrice: Number(salePrice),
      category: finalCategory || 'Sin categoría',
      description,
      profitMargin: Number(profitMargin.toFixed(2)),
      createdAt: new Date(),
      lastUpdate: new Date()
    };

    await db.collection('productos').insertOne(newProduct);

    return res.status(201).json({
      status: "Success",
      message: "Producto creado correctamente.",
      data: newProduct
    });

  } catch (error) {
    console.error('Error al crear el producto:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const db = await getDb();

    const productos = await db.collection('productos')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    if (productos.length === 0) {
      return res.status(200).json({
        status: "Success",
        message: "No hay productos registrados aún.",
        data: []
      });
    }

    return res.status(200).json({
      status: "Success",
      message: "Productos obtenidos correctamente.",
      data: productos
    });

  } catch (error) {
    console.error('Error al obtener los productos:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al obtener los productos.",
      error: error.message
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const db = await getDb();

    const { 
      code, 
      name, 
      costPrice, 
      salePrice, 
      category, 
      description,
      createNewCategory = false
    } = req.body;

    if (!code) {
      return res.status(400).json({
        status: "Error",
        message: "El código del producto es obligatorio para actualizar."
      });
    }

    const existingProduct = await db.collection('productos').findOne({ code });

    if (!existingProduct) {
      return res.status(404).json({
        status: "Error",
        message: "Producto no encontrado."
      });
    }

    // Validaciones de precios
    if (costPrice !== undefined && costPrice < 0) {
      return res.status(400).json({
        status: "Error",
        message: "El precio de costo no puede ser negativo."
      });
    }

    if (salePrice !== undefined && salePrice < 0) {
      return res.status(400).json({
        status: "Error",
        message: "El precio de venta no puede ser negativo."
      });
    }

    // Validar que el precio de venta no sea menor al de costo
    const finalCostPrice = costPrice !== undefined ? costPrice : existingProduct.costPrice;
    const finalSalePrice = salePrice !== undefined ? salePrice : existingProduct.salePrice;
    
    if (finalSalePrice < finalCostPrice) {
      return res.status(400).json({
        status: "Error",
        message: "El precio de venta no puede ser menor al precio de costo."
      });
    }

    // Manejar categoría
    let finalCategory = category || existingProduct.category;
    if (createNewCategory && category) {
      // Verificar si la categoría ya existe
      const existingCategory = await db.collection('categorias').findOne({ 
        name: { $regex: new RegExp(`^${category}$`, 'i') } 
      });
      
      if (!existingCategory) {
        // Crear nueva categoría
        const newCategory = {
          name: category,
          description: `Categoría creada automáticamente para ${name || existingProduct.name}`,
          createdAt: new Date(),
          lastUpdate: new Date()
        };
        await db.collection('categorias').insertOne(newCategory);
      }
    }

    // Calcular margen de ganancia
    const profitMargin = finalCostPrice > 0 ? ((finalSalePrice - finalCostPrice) / finalCostPrice * 100) : 0;

    const updatedFields = {
      ...(name && { name }),
      ...(costPrice !== undefined && { costPrice: Number(costPrice) }),
      ...(salePrice !== undefined && { salePrice: Number(salePrice) }),
      ...(category && { category: finalCategory }),
      ...(description !== undefined && { description }),
      profitMargin: Number(profitMargin.toFixed(2)),
      lastUpdate: new Date()
    };

    await db.collection('productos').updateOne({ code }, { $set: updatedFields });

    const updatedProduct = await db.collection('productos').findOne({ code });

    res.status(200).json({
      status: "Success",
      message: "Producto actualizado correctamente.",
      producto: updatedProduct
    });

  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({
      status: "Error",
      message: "Error interno al intentar actualizar el producto.",
      error: error.message
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const db = await getDb();

    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        status: "Error",
        message: "El código del producto es obligatorio para eliminar."
      });
    }

    const productToDelete = await db.collection('productos').findOne({ code });

    if (!productToDelete) {
      return res.status(404).json({
        status: "Error",
        message: "Producto no encontrado."
      });
    }

    const logEntry = {
      ...productToDelete,
      deletedAt: new Date()
    };

    await db.collection('logproduct').insertOne(logEntry);

    await db.collection('productos').deleteOne({ code });

    res.status(200).json({
      status: "Success",
      message: "Producto eliminado correctamente y registrado en logproduct.",
      eliminado: logEntry
    });

  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({
      status: "Error",
      message: "Error interno al intentar eliminar el producto.",
      error: error.message
    });
  }
};

const assignProductToInventory = async (req, res) => {
  try {
    const db = await getDb();

    const { code, name, category, stock, minStock } = req.body;

    if (!code || !name || !category || stock == null || minStock == null) {
      return res.status(400).json({
        status: "Error",
        message: "Todos los campos son obligatorios (código, nombre, categoría, stock y stock mínimo)."
      });
    }

    const alreadyInInventory = await db.collection('inventario').findOne({ code });
    if (alreadyInInventory) {
      return res.status(409).json({
        status: "Error",
        message: "Este producto ya está en el inventario."
      });
    }

    const inventoryItem = {
      code,
      name,
      category,
      stock: Number(stock),
      minStock: Number(minStock),
      lastUpdate: new Date()
    };

    await db.collection('inventario').insertOne(inventoryItem);

    return res.status(201).json({
      status: "Success",
      message: "Producto asignado al inventario correctamente.",
      data: inventoryItem
    });

  } catch (error) {
    console.error("Error al asignar producto al inventario:", error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al asignar producto al inventario.",
      error: error.message
    });
  }
};

const getInventoryProducts = async (req, res) => {
  try {
    const db = await getDb();

    const inventory = await db.collection('inventario')
      .find({})
      .sort({ lastUpdate: -1 })
      .toArray();

    if (inventory.length === 0) {
      return res.status(200).json({
        status: "Success",
        message: "No hay productos en el inventario aún.",
        data: []
      });
    }

    return res.status(200).json({
      status: "Success",
      message: "Inventario obtenido correctamente.",
      data: inventory
    });

  } catch (error) {
    console.error("Error al obtener el inventario:", error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al obtener el inventario.",
      error: error.message
    });
  }
};

const updateInventoryProduct = async (req, res) => {
  try {
    const db = await getDb();

    const { code, stock, minStock } = req.body;

    if (!code || stock == null || minStock == null) {
      return res.status(400).json({
        status: "Error",
        message: "Todos los campos son obligatorios (código, stock y stock mínimo)."
      });
    }

    const result = await db.collection('inventario').findOneAndUpdate(
      { code },
      {
        $set: {
          stock: Number(stock),
          minStock: Number(minStock),
          lastUpdate: new Date()
        }
      },
      { returnDocument: "after" } // Devuelve el documento actualizado
    );

    if (!result.value) {
      return res.status(404).json({
        status: "Error",
        message: "No se encontró un producto con ese código en el inventario."
      });
    }

    return res.status(200).json({
      status: "Success",
      message: "Producto actualizado correctamente en el inventario.",
      data: result.value
    });

  } catch (error) {
    console.error("Error al actualizar el inventario:", error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al actualizar el inventario.",
      error: error.message
    });
  }
};

const deleteInventoryProduct = async (req, res) => {
  try {
    const db = await getDb();
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        status: "Error",
        message: "El código del producto es obligatorio."
      });
    }

    const product = await db.collection('inventario').findOne({ code });

    if (!product) {
      return res.status(404).json({
        status: "Error",
        message: "No se encontró un producto con ese código en el inventario."
      });
    }

    // Registrar en loginventory antes de eliminar
    const logEntry = {
      ...product,
      deletedAt: new Date()
    };

    await db.collection('loginventory').insertOne(logEntry);

    // Eliminar el producto del inventario
    await db.collection('inventario').deleteOne({ code });

    return res.status(200).json({
      status: "Success",
      message: "Producto eliminado del inventario y registrado en loginventory.",
      data: logEntry
    });

  } catch (error) {
    console.error("Error al eliminar el producto del inventario:", error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al eliminar el producto del inventario.",
      error: error.message
    });
  }
};

const getProductsWithStock = async (req, res) => {
  try {
    const db = await getDb();

    const productos = await db.collection('productos').find().toArray();
    const inventario = await db.collection('inventario').find().toArray();

    // Creamos un mapa del inventario para acceder rápido al stock
    const stockMap = {};
    for (const item of inventario) {
      if (item.stock > 0) {
        stockMap[item.code] = item.stock;
      }
    }

    // Solo productos que tengan stock
    const productosConStock = productos
      .filter(p => stockMap[p.code] !== undefined)
      .map(p => ({
        code: p.code,
        nombre: p.name,
        categoria: p.category,
        precio: p.salePrice || p.price, // Usar salePrice si existe, sino price
        precioCosto: p.costPrice || 0,
        margenGanancia: p.profitMargin || 0,
        stock: stockMap[p.code]
      }));

    return res.status(200).json({
      status: "Success",
      message: "Productos con stock listos para la venta.",
      data: productosConStock
    });

  } catch (error) {
    console.error("Error al listar productos para venta:", error);
    return res.status(500).json({
      status: "Error",
      message: "Error al obtener los productos.",
      error: error.message
    });
  }
};

/*---------------------------------GESTION_DE_CATEGORIAS--------------------------------------------------------------*/

const createCategory = async (req, res) => {
  try {
    const db = await getDb();
    const { name, description = '' } = req.body;

    if (!name) {
      return res.status(400).json({
        status: "Error",
        message: "El nombre de la categoría es obligatorio."
      });
    }

    // Verificar si la categoría ya existe
    const existingCategory = await db.collection('categorias').findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (existingCategory) {
      return res.status(409).json({
        status: "Error",
        message: "Ya existe una categoría con ese nombre."
      });
    }

    const newCategory = {
      name,
      description,
      createdAt: new Date(),
      lastUpdate: new Date()
    };

    await db.collection('categorias').insertOne(newCategory);

    return res.status(201).json({
      status: "Success",
      message: "Categoría creada correctamente.",
      data: newCategory
    });

  } catch (error) {
    console.error('Error al crear categoría:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const db = await getDb();

    const categorias = await db.collection('categorias')
      .find({})
      .sort({ name: 1 })
      .toArray();

    return res.status(200).json({
      status: "Success",
      message: "Categorías obtenidas correctamente.",
      data: categorias
    });

  } catch (error) {
    console.error('Error al obtener categorías:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al obtener las categorías.",
      error: error.message
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { name, description } = req.body;

    if (!id) {
      return res.status(400).json({
        status: "Error",
        message: "ID de la categoría es requerido."
      });
    }

    if (!name) {
      return res.status(400).json({
        status: "Error",
        message: "El nombre de la categoría es obligatorio."
      });
    }

    const existingCategory = await db.collection('categorias').findOne({ _id: new ObjectId(id) });
    if (!existingCategory) {
      return res.status(404).json({
        status: "Error",
        message: "Categoría no encontrada."
      });
    }

    // Verificar si el nuevo nombre ya existe en otra categoría
    const duplicateCategory = await db.collection('categorias').findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      _id: { $ne: new ObjectId(id) }
    });

    if (duplicateCategory) {
      return res.status(409).json({
        status: "Error",
        message: "Ya existe otra categoría con ese nombre."
      });
    }

    const updateFields = {
      name,
      ...(description !== undefined && { description }),
      lastUpdate: new Date()
    };

    await db.collection('categorias').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    const updatedCategory = await db.collection('categorias').findOne({ _id: new ObjectId(id) });

    return res.status(200).json({
      status: "Success",
      message: "Categoría actualizada correctamente.",
      data: updatedCategory
    });

  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al actualizar la categoría.",
      error: error.message
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: "Error",
        message: "ID de la categoría es requerido."
      });
    }

    const category = await db.collection('categorias').findOne({ _id: new ObjectId(id) });
    if (!category) {
      return res.status(404).json({
        status: "Error",
        message: "Categoría no encontrada."
      });
    }

    // Verificar si hay productos usando esta categoría
    const productsUsingCategory = await db.collection('productos').countDocuments({ 
      category: category.name 
    });

    if (productsUsingCategory > 0) {
      return res.status(400).json({
        status: "Error",
        message: `No se puede eliminar la categoría porque ${productsUsingCategory} producto(s) la están usando.`
      });
    }

    await db.collection('categorias').deleteOne({ _id: new ObjectId(id) });

    return res.status(200).json({
      status: "Success",
      message: "Categoría eliminada correctamente."
    });

  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al eliminar la categoría.",
      error: error.message
    });
  }
};

const createSale = async (req, res) => {
  try {
    const db = await getDb();
    const {
      code,
      productos,
      metodoPago,
      cliente, // { name, document, email, phone }
      trabajador, // { correo, nombre }
      totalVenta: totalVentaPayload, // Total de venta del payload
      descuentoAplicado, // Descuento aplicado (opcional)
      // NUEVOS CAMPOS PARA FINANCIAMIENTO
      tipoVenta = 'contado', // 'contado' o 'financiado'
      planAbonos = [], // Array de abonos programados si es financiado
      diasVencimiento = 30, // Días para vencimiento si es financiado
      observaciones = ''
    } = req.body;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        status: "Error",
        message: "Debe proporcionar un código único para la venta (code)."
      });
    }
    
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({
        status: "Error",
        message: "Debe proporcionar al menos un producto para la venta."
      });
    }
    
    // Validar método de pago según tipo de venta
    const metodosPagoValidos = tipoVenta === 'contado' 
      ? ['Efectivo', 'Nequi', 'Transferencia'] 
      : ['Efectivo', 'Nequi', 'Transferencia', 'Credito'];
      
    if (!metodoPago || !metodosPagoValidos.includes(metodoPago)) {
      return res.status(400).json({
        status: "Error",
        message: `Debe especificar un método de pago válido: ${metodosPagoValidos.join(', ')}.`
      });
    }

    // Si es financiado, validar plan de abonos (más flexible)
    if (tipoVenta === 'financiado') {
      if (!planAbonos || !Array.isArray(planAbonos) || planAbonos.length === 0) {
        return res.status(400).json({
          status: "Error",
          message: "Para ventas financiadas debe proporcionar un plan de abonos."
        });
      }

      // Procesar abonos flexibles
      const abonosProcesados = planAbonos.map((abono, index) => {
        const abonoProcesado = { ...abono };
        
        // Si no tiene monto o es 0, calcular automáticamente
        if (!abonoProcesado.monto || abonoProcesado.monto === 0) {
          abonoProcesado.monto = 0; // Se calculará después
          abonoProcesado.esFlexible = true;
        } else {
          abonoProcesado.esFlexible = false;
        }
        
        // Si no tiene fecha, asignar fecha automática (cada mes)
        if (!abonoProcesado.fechaProgramada) {
          const fechaBase = new Date();
          fechaBase.setMonth(fechaBase.getMonth() + index + 1);
          abonoProcesado.fechaProgramada = fechaBase;
        }
        
        return abonoProcesado;
      });

      // Calcular montos para abonos flexibles
      const abonosConMonto = abonosProcesados.filter(abono => !abono.esFlexible);
      const abonosFlexibles = abonosProcesados.filter(abono => abono.esFlexible);
      
      if (abonosFlexibles.length > 0) {
        const sumaAbonosDefinidos = abonosConMonto.reduce((sum, abono) => sum + abono.monto, 0);
        const montoRestante = (totalVentaPayload || 0) - sumaAbonosDefinidos;
        
        if (montoRestante > 0) {
          const montoPorAbono = montoRestante / abonosFlexibles.length;
          abonosFlexibles.forEach(abono => {
            abono.monto = Math.round(montoPorAbono * 100) / 100;
          });
        }
      }

      // Actualizar el array de abonos procesados
      planAbonos.splice(0, planAbonos.length, ...abonosProcesados);
    }

    // Validar que el cliente esté completo para poder crear la factura
    if (!cliente || !cliente.name || !cliente.document || !cliente.email || !cliente.phone) {
      return res.status(400).json({
        status: "Error",
        message: "Para crear la factura, los datos del cliente (name, document, email, phone) son obligatorios."
      });
    }
    
    const ventasCol = db.collection('ventas');
    const inventarioCol = db.collection('inventario');
    const productosCol = db.collection('productos');
    const clientesCol = db.collection('clientes');
    const usuariosCol = db.collection('usuarios');
    
    // Verificar si ya existe una venta con ese código
    const ventaExistente = await ventasCol.findOne({ code });
    if (ventaExistente) {
      return res.status(409).json({
        status: "Error",
        message: "Ya existe una venta con ese código."
      });
    }
    
    // Validar y obtener información del trabajador
    let trabajadorInfo = null;
    if (trabajador && trabajador.correo) {
      const trabajadorEncontrado = await usuariosCol.findOne({ 
        email: trabajador.correo, 
        role: 'worker' 
      });
      if (trabajadorEncontrado) {
        trabajadorInfo = {
          correo: trabajadorEncontrado.email,
          nombre: trabajadorEncontrado.name,
          cedula: trabajadorEncontrado.cedula || 'N/A'
        };
      } else {
        return res.status(404).json({
          status: "Error",
          message: "Trabajador no encontrado."
        });
      }
    }
    
    let totalVenta = 0;
    const detalleVenta = [];
    
    for (const item of productos) {
      const { code: productCode, cantidad, precioUnitario, total } = item;
    
      if (!productCode || cantidad <= 0) {
        return res.status(400).json({
          status: "Error",
          message: "Código de producto inválido o cantidad no válida."
        });
      }
    
      const prodInventario = await inventarioCol.findOne({ code: productCode });
      const prodInfo = await productosCol.findOne({ code: productCode });
    
      if (!prodInventario || !prodInfo) {
        return res.status(404).json({
          status: "Error",
          message: `El producto con código ${productCode} no existe en inventario o productos.`
        });
      }
    
      if (prodInventario.stock < cantidad) {
        return res.status(409).json({
          status: "Error",
          message: `No hay suficiente stock para el producto ${prodInfo.name}.`
        });
      }
    
      // Usar precios del payload si están disponibles, sino calcular desde la BD
      const precioFinal = precioUnitario || prodInfo.salePrice;
      const subtotal = total || (precioFinal * cantidad);
      totalVenta += subtotal;
    
      detalleVenta.push({
        code: prodInfo.code,
        name: prodInfo.name,
        categoria: prodInfo.category,
        cantidad,
        precioUnitario: precioFinal,
        total: subtotal
      });
    
      await inventarioCol.updateOne(
        { code: productCode },
        { $inc: { stock: -cantidad }, $set: { lastUpdate: new Date() } }
      );
    }
    
    // Usar totalVenta del payload si está disponible, sino usar el calculado
    const totalVentaSinDescuento = totalVentaPayload || totalVenta;
    
    // Validar descuento si está especificado
    if (descuentoAplicado !== undefined && descuentoAplicado !== null) {
      if (typeof descuentoAplicado !== 'number' || descuentoAplicado < 0 || descuentoAplicado > 100) {
        return res.status(400).json({
          status: "Error",
          message: "El descuento debe ser un número entre 0 y 100."
        });
      }
    }
    
    // Calcular descuento usando la función helper
    const descuentoInfo = calcularDescuento(totalVentaSinDescuento, descuentoAplicado);
    const totalVentaFinal = descuentoInfo.totalConDescuento;
    
    // SIEMPRE guardar/obtener cliente para la factura
    let clienteId = null;
    const existente = await clientesCol.findOne({ numeroIdentificacion: cliente.document });
    
    if (!existente) {
      const nuevoCliente = {
        tipoIdentificacion: cliente.tipoIdentificacion || 'CC',
        numeroIdentificacion: cliente.document,
        nombre: cliente.name,
        email: cliente.email,
        telefono: cliente.phone,
        departamento: cliente.departamento || '',
        ciudad: cliente.ciudad || '',
        ubicacionLocal: cliente.ubicacionLocal || '',
        tipoCliente: 'individual',
        descuentoPersonalizado: 0,
        estado: 'activo',
        fechaRegistro: moment().tz("America/Bogota").format('YYYY-MM-DD HH:mm:ss'),
        createdAt: new Date(),
        lastUpdate: new Date()
      };
      await clientesCol.insertOne(nuevoCliente);
      clienteId = nuevoCliente._id;
    } else {
      clienteId = existente._id;
    }
    
    const horaColombia = require('moment-timezone')().tz('America/Bogota').format('HH:mm:ss');
    
    const venta = {
      code,
      fecha: new Date(),
      hora: horaColombia,
      cliente: cliente,
      trabajador: trabajadorInfo,
      productos: detalleVenta,
      totalVenta: totalVentaFinal,
      totalVentaSinDescuento: totalVentaSinDescuento,
      descuentoAplicado: descuentoInfo.descuentoAplicado,
      montoDescuento: descuentoInfo.montoDescuento,
      metodoPago,
      // NUEVOS CAMPOS
      tipoVenta, // 'contado' o 'financiado'
      estadoPago: tipoVenta === 'contado' ? 'pagado' : 'pendiente',
      facturaId: null, // Se llenará cuando se cree la factura
      observaciones,
      createdAt: new Date()
    };
    
    await ventasCol.insertOne(venta);
    
    // SIEMPRE crear factura
    const numeroFactura = await generateInvoiceNumber(db);
    
    const fechaEmision = new Date();
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaEmision.getDate() + diasVencimiento);
    
    const factura = {
      numeroFactura,
      ventaId: venta._id, // RELACIÓN CON LA VENTA
      clienteId: clienteId,
      cliente: {
        id: clienteId,
        nombre: cliente.name,
        tipoIdentificacion: cliente.tipoIdentificacion || 'CC',
        numeroIdentificacion: cliente.document,
        email: cliente.email,
        telefono: cliente.phone,
        ciudad: cliente.ciudad || '',
        ubicacionLocal: cliente.ubicacionLocal || ''
      },
      productos: detalleVenta,
      subtotal: totalVentaSinDescuento,
      descuentoAplicado: descuentoInfo.descuentoAplicado,
      descuentoTotal: descuentoInfo.montoDescuento,
      iva: 0,
      ivaTotal: 0,
      total: totalVentaFinal,
      estado: tipoVenta === 'contado' ? 'pagada' : 'pendiente',
      metodoPago,
      observaciones,
      fechaEmision,
      fechaVencimiento,
      saldoPendiente: tipoVenta === 'contado' ? 0 : totalVentaFinal,
      abonos: [],
      // Solo agregar plan de abonos si es financiado
      ...(tipoVenta === 'financiado' && {
        planAbonos: planAbonos.map((abono, index) => ({
          numero: index + 1,
          monto: abono.monto,
          fechaProgramada: new Date(abono.fechaProgramada),
          estado: 'pendiente',
          fechaPago: null,
          montoPagado: 0,
          observaciones: abono.observaciones || ''
        }))
      }),
      createdAt: new Date(),
      lastUpdate: new Date()
    };
    
    await db.collection('facturas').insertOne(factura);
    
    // Actualizar la venta con el ID de la factura
    await ventasCol.updateOne(
      { _id: venta._id },
      { $set: { facturaId: factura._id } }
    );
    
    res.status(201).json({
      status: "Success",
      message: "Venta y factura registradas correctamente.",
      data: {
        venta: {
          ...venta,
          facturaId: factura._id
        },
        factura: {
          id: factura._id,
          numeroFactura: factura.numeroFactura,
          cliente: factura.cliente,
          total: factura.total,
          estado: factura.estado,
          fechaEmision: factura.fechaEmision,
          fechaVencimiento: factura.fechaVencimiento,
          saldoPendiente: factura.saldoPendiente
        },
        tipoVenta,
        estadoPago: venta.estadoPago
      }
    });
  } catch (error) {
    console.error("Error al registrar la venta:", error);
    res.status(500).json({
      status: "Error",
      message: "Error interno al registrar la venta.",
      error: error.message
    });
  }
};
  

// Función helper para calcular descuentos
const calcularDescuento = (totalVenta, descuentoPorcentaje) => {
  if (!descuentoPorcentaje || descuentoPorcentaje <= 0) {
    return {
      montoDescuento: 0,
      totalConDescuento: totalVenta,
      descuentoAplicado: 0
    };
  }
  
  const montoDescuento = (totalVenta * descuentoPorcentaje) / 100;
  const totalConDescuento = totalVenta - montoDescuento;
  
  return {
    montoDescuento: Math.round(montoDescuento * 100) / 100, // Redondear a 2 decimales
    totalConDescuento: Math.round(totalConDescuento * 100) / 100,
    descuentoAplicado: descuentoPorcentaje
  };
};

const checkAndReserveSaleCode = async (req, res) => {
  try {
    const db = await getDb();
    const { code } = req.params;

    const ventasCol = db.collection('ventas');
    const reservadosCol = db.collection('codigosReservados');

    const yaExiste = await ventasCol.findOne({ code });
    const yaReservado = await reservadosCol.findOne({ code });

    if (yaExiste || yaReservado) {
      return res.status(200).json({ reserved: false });
    }

    // Reservar el código con timestamp (para limpieza futura si quieres usar cron)
    await reservadosCol.insertOne({
      code,
      reservedAt: moment().tz("America/Bogota").toDate()
    });

    res.status(200).json({ reserved: true });

  } catch (error) {
    console.error("Error al verificar y reservar el código:", error);
    res.status(500).json({ reserved: false, error: error.message });
  }
};


const releaseSaleCode = async (req, res) => {
  try {
    const db = await getDb();
    const { code } = req.params;

    const reservadosCol = db.collection('codigosReservados');
    await reservadosCol.deleteOne({ code });

    res.status(200).json({ released: true });

  } catch (error) {
    console.error("Error al liberar código de venta:", error);
    res.status(500).json({ released: false, error: error.message });
  }
};

const getLastRegisteredSaleCode = async (req, res) => {
  try {
    const db = await getDb();
    const ventasCol = db.collection('ventas');

    const ultimaVenta = await ventasCol
      .find({})
      .sort({ createdAt: -1 }) // Orden descendente por fecha de creación
      .limit(1)
      .toArray();

    if (ultimaVenta.length === 0) {
      return res.status(200).json({ lastCode: null });
    }

    return res.status(200).json({ lastCode: ultimaVenta[0].code });
    
  } catch (error) {
    console.error("Error al obtener el último código de venta:", error);
    res.status(500).json({
      status: "Error",
      message: "No se pudo obtener el último código de venta.",
      error: error.message
    });
  }
};
const getAllSales = async (req, res) => {
  try {
    const db = await getDb();
    const ventasCol = db.collection('ventas');

    const { desde, hasta } = req.query;

    const query = {};

    if (desde || hasta) {
      query.fecha = {};
      if (desde) query.fecha.$gte = new Date(desde);
      if (hasta) query.fecha.$lte = new Date(hasta);
    }

    const ventas = await ventasCol
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Agregar campo de fecha en hora Colombia
    const ventasConFormato = ventas.map(v => ({
      ...v,
      fechaColombia: moment(v.fecha).tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss')
    }));

    res.status(200).json(ventasConFormato);
  } catch (error) {
    console.error("Error al obtener las ventas:", error);
    res.status(500).json({
      status: "Error",
      message: "No se pudieron obtener las ventas.",
      error: error.message
    });
  }
};

const getReportsData = async (req, res) => {
  try {
    const db = await getDb();
    const ventasCol = db.collection('ventas');
    const usuariosCol = db.collection('usuarios');

    const { 
      startDate, 
      endDate, 
      type, 
      format,
      periodo = 'custom', // 'dia', 'semana', 'mes', 'año', 'custom'
      fechaEspecifica = null // Para filtros específicos
    } = req.query;

    // Calcular fechas según el período
    let start, end;
    const now = moment().tz('America/Bogota');

    if (periodo === 'dia') {
      const fecha = fechaEspecifica ? moment.tz(fechaEspecifica, 'America/Bogota') : now;
      start = fecha.startOf('day').toDate();
      end = fecha.endOf('day').toDate();
    } else if (periodo === 'semana') {
      const fecha = fechaEspecifica ? moment.tz(fechaEspecifica, 'America/Bogota') : now;
      start = fecha.startOf('week').toDate();
      end = fecha.endOf('week').toDate();
    } else if (periodo === 'mes') {
      const fecha = fechaEspecifica ? moment.tz(fechaEspecifica, 'America/Bogota') : now;
      start = fecha.startOf('month').toDate();
      end = fecha.endOf('month').toDate();
    } else if (periodo === 'año') {
      const fecha = fechaEspecifica ? moment.tz(fechaEspecifica, 'America/Bogota') : now;
      start = fecha.startOf('year').toDate();
      end = fecha.endOf('year').toDate();
    } else {
      // Período personalizado
      if (!startDate || !endDate) {
        return res.status(400).json({
          status: 'Error',
          message: 'Para período personalizado debe proporcionar startDate y endDate.'
        });
      }
      start = moment.tz(startDate, 'America/Bogota').startOf('day').toDate();
      end = moment.tz(endDate, 'America/Bogota').endOf('day').toDate();
    }

    const query = {
      fecha: { $gte: start, $lte: end }
    };

    const ventas = await ventasCol.find(query).toArray();

    // Función para obtener información de trabajadores
    const getTrabajadorInfo = async (correo) => {
      if (!correo) return { nombre: 'Sistema', correo: 'sistema' };
      const trabajador = await usuariosCol.findOne({ email: correo, role: 'worker' });
      return trabajador ? { nombre: trabajador.name, correo: trabajador.email } : { nombre: 'Desconocido', correo };
    };

    // 1. VENTAS POR DEPARTAMENTOS
    const buildVentasPorDepartamentos = () => {
      const departamentos = {};
      
      ventas.forEach(v => {
        const departamento = v.cliente?.departamento || 'Sin departamento';
        if (!departamentos[departamento]) {
          departamentos[departamento] = {
            departamento,
            totalVentas: 0,
            totalVentasSinDescuento: 0,
            totalDescuentos: 0,
            cantidadVentas: 0,
            ventasConDescuento: 0,
            clientes: new Set()
          };
        }
        departamentos[departamento].totalVentas += (v.totalVenta || 0);
        departamentos[departamento].totalVentasSinDescuento += (v.totalVentaSinDescuento || v.totalVenta || 0);
        departamentos[departamento].totalDescuentos += (v.montoDescuento || 0);
        departamentos[departamento].cantidadVentas += 1;
        if ((v.descuentoAplicado || 0) > 0) {
          departamentos[departamento].ventasConDescuento += 1;
        }
        if (v.cliente?.name || v.cliente?.nombre) {
          departamentos[departamento].clientes.add(v.cliente.name || v.cliente.nombre);
        }
      });

      return Object.values(departamentos).map(d => ({
        Departamento: d.departamento,
        TotalVentas: d.totalVentas,
        TotalVentasSinDescuento: d.totalVentasSinDescuento,
        TotalDescuentos: d.totalDescuentos,
        CantidadVentas: d.cantidadVentas,
        VentasConDescuento: d.ventasConDescuento,
        ClientesUnicos: d.clientes.size
      })).sort((a, b) => b.TotalVentas - a.TotalVentas);
    };

    // 2. VENTAS POR CATEGORÍAS
    const buildVentasPorCategorias = () => {
      const categorias = {};

      ventas.forEach(v => {
        v.productos.forEach(p => {
          const categoria = p.categoria || 'Sin categoría';
          if (!categorias[categoria]) {
            categorias[categoria] = {
              categoria,
              cantidadVendida: 0,
              totalGenerado: 0,
              productos: new Set()
            };
          }
          categorias[categoria].cantidadVendida += (p.cantidad || 0);
          categorias[categoria].totalGenerado += (p.precioUnitario || 0) * (p.cantidad || 0);
          categorias[categoria].productos.add(p.name);
        });
      });

      return Object.values(categorias).map(c => ({
        Categoria: c.categoria,
        CantidadVendida: c.cantidadVendida,
        TotalGenerado: c.totalGenerado,
        ProductosUnicos: c.productos.size
      })).sort((a, b) => b.TotalGenerado - a.TotalGenerado);
    };

    // 3. VENTAS POR MES (desde fecha específica hasta año actual)
    const buildVentasPorMes = () => {
      const ventasPorMes = {};
      const fechaInicio = fechaEspecifica ? moment.tz(fechaEspecifica, 'America/Bogota') : moment().tz('America/Bogota').subtract(1, 'year');
      const fechaFin = moment().tz('America/Bogota');

      // Obtener todas las ventas desde la fecha de inicio
      const queryMensual = {
        fecha: { 
          $gte: fechaInicio.startOf('month').toDate(), 
          $lte: fechaFin.endOf('month').toDate() 
        }
      };

      return ventasCol.find(queryMensual).toArray().then(ventasMensuales => {
        ventasMensuales.forEach(v => {
          const mes = moment(v.fecha).tz('America/Bogota').format('YYYY-MM');
          if (!ventasPorMes[mes]) {
            ventasPorMes[mes] = {
              mes,
              totalVentas: 0,
              cantidadVentas: 0,
              clientes: new Set()
            };
          }
          ventasPorMes[mes].totalVentas += (v.totalVenta || 0);
          ventasPorMes[mes].cantidadVentas += 1;
          if (v.cliente?.name || v.cliente?.nombre) {
            ventasPorMes[mes].clientes.add(v.cliente.name || v.cliente.nombre);
          }
        });

        return Object.values(ventasPorMes).map(m => ({
          Mes: m.mes,
          TotalVentas: m.totalVentas,
          CantidadVentas: m.cantidadVentas,
          ClientesUnicos: m.clientes.size
        })).sort((a, b) => a.Mes.localeCompare(b.Mes));
      });
    };

    // 4. VENTAS POR TRABAJADOR
    const buildVentasPorTrabajador = async () => {
      const trabajadores = {};
      
      for (const v of ventas) {
        const trabajadorInfo = await getTrabajadorInfo(v.trabajador?.correo);
        const key = trabajadorInfo.correo;
        
        if (!trabajadores[key]) {
          trabajadores[key] = {
            trabajador: trabajadorInfo.nombre,
            correo: trabajadorInfo.correo,
            totalVentas: 0,
            totalVentasSinDescuento: 0,
            totalDescuentos: 0,
            cantidadVentas: 0,
            ventasConDescuento: 0,
            clientes: new Set()
          };
        }
        
        trabajadores[key].totalVentas += (v.totalVenta || 0);
        trabajadores[key].totalVentasSinDescuento += (v.totalVentaSinDescuento || v.totalVenta || 0);
        trabajadores[key].totalDescuentos += (v.montoDescuento || 0);
        trabajadores[key].cantidadVentas += 1;
        if ((v.descuentoAplicado || 0) > 0) {
          trabajadores[key].ventasConDescuento += 1;
        }
        if (v.cliente?.name || v.cliente?.nombre) {
          trabajadores[key].clientes.add(v.cliente.name || v.cliente.nombre);
        }
      }

      return Object.values(trabajadores).map(t => ({
        Trabajador: t.trabajador,
        Correo: t.correo,
        TotalVentas: t.totalVentas,
        TotalVentasSinDescuento: t.totalVentasSinDescuento,
        TotalDescuentos: t.totalDescuentos,
        CantidadVentas: t.cantidadVentas,
        VentasConDescuento: t.ventasConDescuento,
        ClientesAtendidos: t.clientes.size
      })).sort((a, b) => b.TotalVentas - a.TotalVentas);
    };

    // 5. PRODUCTOS MÁS VENDIDOS POR CANTIDAD
    const buildProductosMasVendidosCantidad = () => {
      const productos = {};

      ventas.forEach(v => {
        v.productos.forEach(p => {
          if (!productos[p.name]) {
            productos[p.name] = {
              producto: p.name,
              codigo: p.code,
              categoria: p.categoria || 'Sin categoría',
              cantidadVendida: 0,
              totalGenerado: 0
            };
          }
          productos[p.name].cantidadVendida += (p.cantidad || 0);
          productos[p.name].totalGenerado += (p.precioUnitario || 0) * (p.cantidad || 0);
        });
      });

      return Object.values(productos)
        .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
        .map(p => ({
          Producto: p.producto,
          Codigo: p.codigo,
          Categoria: p.categoria,
          CantidadVendida: p.cantidadVendida,
          TotalGenerado: p.totalGenerado
        }));
    };

    // 6. PRODUCTOS MENOS VENDIDOS POR CANTIDAD
    const buildProductosMenosVendidosCantidad = () => {
      const productos = {};

      ventas.forEach(v => {
        v.productos.forEach(p => {
          if (!productos[p.name]) {
            productos[p.name] = {
              producto: p.name,
              codigo: p.code,
              categoria: p.categoria || 'Sin categoría',
              cantidadVendida: 0,
              totalGenerado: 0
            };
          }
          productos[p.name].cantidadVendida += (p.cantidad || 0);
          productos[p.name].totalGenerado += (p.precioUnitario || 0) * (p.cantidad || 0);
        });
      });

      return Object.values(productos)
        .sort((a, b) => a.cantidadVendida - b.cantidadVendida)
        .map(p => ({
          Producto: p.producto,
          Codigo: p.codigo,
          Categoria: p.categoria,
          CantidadVendida: p.cantidadVendida,
          TotalGenerado: p.totalGenerado
        }));
    };

    // 7. PRODUCTOS MÁS VENDIDOS POR TOTAL
    const buildProductosMasVendidosTotal = () => {
      const productos = {};

      ventas.forEach(v => {
        v.productos.forEach(p => {
          if (!productos[p.name]) {
            productos[p.name] = {
              producto: p.name,
              codigo: p.code,
              categoria: p.categoria || 'Sin categoría',
              cantidadVendida: 0,
              totalGenerado: 0
            };
          }
          productos[p.name].cantidadVendida += (p.cantidad || 0);
          productos[p.name].totalGenerado += (p.precioUnitario || 0) * (p.cantidad || 0);
        });
      });

      return Object.values(productos)
        .sort((a, b) => b.totalGenerado - a.totalGenerado)
        .map(p => ({
          Producto: p.producto,
          Codigo: p.codigo,
          Categoria: p.categoria,
          CantidadVendida: p.cantidadVendida,
          TotalGenerado: p.totalGenerado
        }));
    };

    // 8. PRODUCTOS MENOS VENDIDOS POR TOTAL
    const buildProductosMenosVendidosTotal = () => {
      const productos = {};

      ventas.forEach(v => {
        v.productos.forEach(p => {
          if (!productos[p.name]) {
            productos[p.name] = {
              producto: p.name,
              codigo: p.code,
              categoria: p.categoria || 'Sin categoría',
              cantidadVendida: 0,
              totalGenerado: 0
            };
          }
          productos[p.name].cantidadVendida += (p.cantidad || 0);
          productos[p.name].totalGenerado += (p.precioUnitario || 0) * (p.cantidad || 0);
        });
      });

      return Object.values(productos)
        .sort((a, b) => a.totalGenerado - b.totalGenerado)
        .map(p => ({
          Producto: p.producto,
          Codigo: p.codigo,
          Categoria: p.categoria,
          CantidadVendida: p.cantidadVendida,
          TotalGenerado: p.totalGenerado
        }));
    };

    // 9. RESUMEN GENERAL
    const buildResumenGeneral = () => {
      const totalVentas = ventas.reduce((sum, v) => sum + (v.totalVenta || 0), 0);
      const totalVentasSinDescuento = ventas.reduce((sum, v) => sum + (v.totalVentaSinDescuento || v.totalVenta || 0), 0);
      const totalDescuentos = ventas.reduce((sum, v) => sum + (v.montoDescuento || 0), 0);
      const ventasConDescuento = ventas.filter(v => (v.descuentoAplicado || 0) > 0).length;
      const cantidadVentas = ventas.length;
      const clientesUnicos = new Set(ventas.map(v => v.cliente?.name || v.cliente?.nombre).filter(Boolean)).size;
      const productosVendidos = new Set(ventas.flatMap(v => (v.productos || []).map(p => p.name)).filter(Boolean)).size;
      const categoriasVendidas = new Set(ventas.flatMap(v => (v.productos || []).map(p => p.categoria || 'Sin categoría')).filter(Boolean)).size;
      const trabajadoresUnicos = new Set(ventas.map(v => v.trabajador?.correo).filter(Boolean)).size;

      return [{
        Periodo: periodo,
        FechaInicio: moment(start).tz('America/Bogota').format('YYYY-MM-DD'),
        FechaFin: moment(end).tz('America/Bogota').format('YYYY-MM-DD'),
        TotalVentas: totalVentas,
        TotalVentasSinDescuento: totalVentasSinDescuento,
        TotalDescuentos: totalDescuentos,
        CantidadVentas: cantidadVentas,
        VentasConDescuento: ventasConDescuento,
        ClientesUnicos: clientesUnicos,
        TrabajadoresUnicos: trabajadoresUnicos,
        ProductosVendidos: productosVendidos,
        CategoriasVendidas: categoriasVendidas,
        PromedioVenta: cantidadVentas > 0 ? (totalVentas / cantidadVentas).toFixed(2) : 0,
        PromedioDescuento: ventasConDescuento > 0 ? (totalDescuentos / ventasConDescuento).toFixed(2) : 0
      }];
    };

    // Función para generar reporte completo
    const generateCompleteReport = async () => {
      const [
        ventasPorDepartamentos,
        ventasPorCategorias,
        ventasPorMes,
        ventasPorTrabajador,
        productosMasVendidosCantidad,
        productosMenosVendidosCantidad,
        productosMasVendidosTotal,
        productosMenosVendidosTotal,
        resumenGeneral
      ] = await Promise.all([
        buildVentasPorDepartamentos(),
        buildVentasPorCategorias(),
        buildVentasPorMes(),
        buildVentasPorTrabajador(),
        buildProductosMasVendidosCantidad(),
        buildProductosMenosVendidosCantidad(),
        buildProductosMasVendidosTotal(),
        buildProductosMenosVendidosTotal(),
        buildResumenGeneral()
      ]);

      return {
        resumen: resumenGeneral,
        ventasPorDepartamentos,
        ventasPorCategorias,
        ventasPorMes,
        ventasPorTrabajador,
        productosMasVendidosCantidad: productosMasVendidosCantidad.slice(0, 20), // Top 20
        productosMenosVendidosCantidad: productosMenosVendidosCantidad.slice(0, 20), // Top 20
        productosMasVendidosTotal: productosMasVendidosTotal.slice(0, 20), // Top 20
        productosMenosVendidosTotal: productosMenosVendidosTotal.slice(0, 20) // Top 20
      };
    };

    // Tipos de reporte válidos
    const tiposValidos = [
      'completo', 'resumen', 'departamentos', 'categorias', 'mensual', 
      'trabajadores', 'productos-mas-cantidad', 'productos-menos-cantidad',
      'productos-mas-total', 'productos-menos-total'
    ];

    if (!type || type === 'completo') {
      const reporteCompleto = await generateCompleteReport();
      
      if (format === 'pdf') {
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte-completo.pdf');
        doc.pipe(res);

        // Portada
        doc.fontSize(20).text('REPORTE COMPLETO DE VENTAS', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Período: ${reporteCompleto.resumen[0].FechaInicio} - ${reporteCompleto.resumen[0].FechaFin}`);
        doc.text(`Tipo: ${reporteCompleto.resumen[0].Periodo}`);
        doc.moveDown();

        // Resumen
        doc.fontSize(16).text('RESUMEN GENERAL', { underline: true });
        doc.moveDown();
        Object.entries(reporteCompleto.resumen[0]).forEach(([key, value]) => {
          doc.text(`${key}: ${value}`);
        });
        doc.addPage();

        // Ventas por departamentos
        doc.fontSize(16).text('VENTAS POR DEPARTAMENTOS', { underline: true });
        doc.moveDown();
        reporteCompleto.ventasPorDepartamentos.forEach(d => {
          doc.text(`${d.Departamento}: $${d.TotalVentas.toLocaleString()} (${d.CantidadVentas} ventas)`);
        });
        doc.addPage();

        // Ventas por categorías
        doc.fontSize(16).text('VENTAS POR CATEGORÍAS', { underline: true });
        doc.moveDown();
        reporteCompleto.ventasPorCategorias.forEach(c => {
          doc.text(`${c.Categoria}: $${c.TotalGenerado.toLocaleString()} (${c.CantidadVendida} unidades)`);
        });
        doc.addPage();

        // Top productos
        doc.fontSize(16).text('TOP 20 PRODUCTOS MÁS VENDIDOS (CANTIDAD)', { underline: true });
        doc.moveDown();
        reporteCompleto.productosMasVendidosCantidad.forEach((p, i) => {
          doc.text(`${i + 1}. ${p.Producto}: ${p.CantidadVendida} unidades - $${p.TotalGenerado.toLocaleString()}`);
        });

        doc.end();
      } else if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();

        // Hoja de resumen
        const resumenSheet = workbook.addWorksheet('Resumen');
        resumenSheet.addRow(['Métrica', 'Valor']);
        Object.entries(reporteCompleto.resumen[0]).forEach(([key, value]) => {
          resumenSheet.addRow([key, value]);
        });

        // Hoja de departamentos
        const deptSheet = workbook.addWorksheet('Ventas por Departamentos');
        deptSheet.columns = [
          { header: 'Departamento', key: 'departamento', width: 25 },
          { header: 'Total Ventas', key: 'totalVentas', width: 15 },
          { header: 'Cantidad Ventas', key: 'cantidadVentas', width: 15 },
          { header: 'Clientes Únicos', key: 'clientesUnicos', width: 15 }
        ];
        reporteCompleto.ventasPorDepartamentos.forEach(d => {
          deptSheet.addRow({
            departamento: d.Departamento,
            totalVentas: d.TotalVentas,
            cantidadVentas: d.CantidadVentas,
            clientesUnicos: d.ClientesUnicos
          });
        });

        // Hoja de categorías
        const catSheet = workbook.addWorksheet('Ventas por Categorías');
        catSheet.columns = [
          { header: 'Categoría', key: 'categoria', width: 25 },
          { header: 'Cantidad Vendida', key: 'cantidadVendida', width: 15 },
          { header: 'Total Generado', key: 'totalGenerado', width: 15 },
          { header: 'Productos Únicos', key: 'productosUnicos', width: 15 }
        ];
        reporteCompleto.ventasPorCategorias.forEach(c => {
          catSheet.addRow({
            categoria: c.Categoria,
            cantidadVendida: c.CantidadVendida,
            totalGenerado: c.TotalGenerado,
            productosUnicos: c.ProductosUnicos
          });
        });

        // Hoja de top productos
        const topSheet = workbook.addWorksheet('Top Productos');
        topSheet.columns = [
          { header: 'Producto', key: 'producto', width: 30 },
          { header: 'Código', key: 'codigo', width: 15 },
          { header: 'Categoría', key: 'categoria', width: 20 },
          { header: 'Cantidad Vendida', key: 'cantidadVendida', width: 15 },
          { header: 'Total Generado', key: 'totalGenerado', width: 15 }
        ];
        reporteCompleto.productosMasVendidosCantidad.forEach(p => {
          topSheet.addRow({
            producto: p.Producto,
            codigo: p.Codigo,
            categoria: p.Categoria,
            cantidadVendida: p.CantidadVendida,
            totalGenerado: p.TotalGenerado
          });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte-completo.xlsx');
        await workbook.xlsx.write(res);
        res.end();
      } else {
        return res.status(200).json({
          status: 'Success',
          message: 'Reporte completo generado correctamente.',
          data: reporteCompleto
        });
      }
    }

    if (!tiposValidos.includes(type)) {
      return res.status(400).json({
        status: 'Error',
        message: `El parámetro "type" debe ser uno de: ${tiposValidos.join(', ')}.`
      });
    }

    // Generar reporte específico
    let report = [];
    const reporteCompleto = await generateCompleteReport();

    switch (type) {
      case 'resumen':
        report = reporteCompleto.resumen;
        break;
      case 'departamentos':
        report = reporteCompleto.ventasPorDepartamentos;
        break;
      case 'categorias':
        report = reporteCompleto.ventasPorCategorias;
        break;
      case 'mensual':
        report = reporteCompleto.ventasPorMes;
        break;
      case 'trabajadores':
        report = reporteCompleto.ventasPorTrabajador;
        break;
      case 'productos-mas-cantidad':
        report = reporteCompleto.productosMasVendidosCantidad;
        break;
      case 'productos-menos-cantidad':
        report = reporteCompleto.productosMenosVendidosCantidad;
        break;
      case 'productos-mas-total':
        report = reporteCompleto.productosMasVendidosTotal;
        break;
      case 'productos-menos-total':
        report = reporteCompleto.productosMenosVendidosTotal;
        break;
    }

    if (format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=reporte-${type}.pdf`);
      doc.pipe(res);

      doc.fontSize(18).text(`Reporte: ${type.toUpperCase()}`, { align: 'center' });
      doc.moveDown();

      report.forEach(row => {
        Object.entries(row).forEach(([key, val]) => {
          doc.fontSize(12).text(`${key}: ${val}`);
        });
        doc.moveDown();
      });

      doc.end();
    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(`Reporte-${type}`);

      if (report.length > 0) {
        worksheet.columns = Object.keys(report[0]).map(key => ({
          header: key,
          key: key,
          width: 20
        }));
        worksheet.addRows(report);
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=reporte-${type}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(200).json({
        status: 'Success',
        message: `Reporte de ${type} generado correctamente.`,
        data: report
      });
    }

  } catch (error) {
    console.error('Error generando el reporte:', error);
    res.status(500).json({
      status: 'Error',
      message: 'No se pudo generar el reporte.',
      error: error.message
    });
  }
};
const getSpecificDayReport = async (req, res) => {
  try {
    const db = await getDb();
    const ventasCol = db.collection('ventas');

    const dateParam = req.query.startDate || req.query.date;
    const format = req.query.format;

    if (!dateParam) {
      return res.status(400).json({
        status: 'Error',
        message: 'Debe proporcionar una fecha específica (startDate o date).'
      });
    }

    const dayStart = moment.tz(dateParam, 'America/Bogota').startOf('day').toDate();
    const dayEnd = moment.tz(dateParam, 'America/Bogota').endOf('day').toDate();
    const query = { fecha: { $gte: dayStart, $lte: dayEnd } };

    const ventas = await ventasCol.find(query).toArray();

    const resumen = ventas.map(v => ({
      Código: v.code,
      Cliente: v.cliente?.nombre || 'Sin cliente',
      Documento: v.cliente?.document || 'N/A',
      Email: v.cliente?.email || 'N/A',
      Teléfono: v.cliente?.phone || 'N/A',
      Trabajador: v.trabajador?.nombre || 'Sin trabajador',
      EmailTrabajador: v.trabajador?.correo || 'N/A',
      Total: v.totalVenta,
      TotalSinDescuento: v.totalVentaSinDescuento || v.totalVenta,
      Descuento: v.descuentoAplicado || 0,
      MontoDescuento: v.montoDescuento || 0,
      Método: v.metodoPago,
      Fecha: moment(v.fecha).tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss')
    }));

    const total = [{
      TotalVentas: ventas.reduce((sum, v) => sum + v.totalVenta, 0),
      TotalVentasSinDescuento: ventas.reduce((sum, v) => sum + (v.totalVentaSinDescuento || v.totalVenta), 0),
      TotalDescuentos: ventas.reduce((sum, v) => sum + (v.montoDescuento || 0), 0),
      VentasConDescuento: ventas.filter(v => v.descuentoAplicado > 0).length,
      CantidadVentas: ventas.length,
      PromedioVenta: ventas.length > 0 ? (ventas.reduce((sum, v) => sum + v.totalVenta, 0) / ventas.length).toFixed(2) : 0
    }];

    const productosVendidos = {};
    ventas.forEach(v => {
      v.productos?.forEach(p => {
        productosVendidos[p.name] = (productosVendidos[p.name] || 0) + p.cantidad;
      });
    });

    const top = Object.entries(productosVendidos)
      .map(([name, cantidad]) => ({ Producto: name, Cantidad: cantidad }))
      .sort((a, b) => b.Cantidad - a.Cantidad);

    const categoriasMap = {};
    ventas.forEach(v => {
      v.productos?.forEach(p => {
        const cat = p.categoria || 'Sin categoría';
        if (!categoriasMap[cat]) {
          categoriasMap[cat] = {
            Categoria: cat,
            CantidadVendida: 0,
            TotalGenerado: 0,
            PrecioUnitario: p.precioUnitario || 0
          };
        }
        categoriasMap[cat].CantidadVendida += p.cantidad;
        categoriasMap[cat].TotalGenerado += p.total;
      });
    });

    const categorias = Object.values(categoriasMap);

    const data = {
      ventas: resumen,
      total,
      top,
      categorias
    };

    if (format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=reporte-dia.pdf`);
      doc.pipe(res);

      doc.fontSize(18).text(`Reporte del día ${dateParam}`, { align: 'center' });
      doc.moveDown();

      const appendSection = (title, rows) => {
        doc.fontSize(16).text(`🔸 ${title}`, { underline: true });
        doc.moveDown(0.5);
        rows.forEach(row => {
          Object.entries(row).forEach(([key, val]) => {
            doc.fontSize(12).text(`${key}: ${val}`);
          });
          doc.moveDown();
        });
        doc.addPage();
      };

      appendSection('Ventas', resumen);
      appendSection('Totales', total);
      appendSection('Top productos', top);
      appendSection('Categorías', categorias);

      doc.end();
    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();

      const addSheet = (name, rows) => {
        const sheet = workbook.addWorksheet(name);
        if (rows.length > 0) {
          sheet.columns = Object.keys(rows[0]).map(k => ({
            header: k,
            key: k,
            width: 20
          }));
          sheet.addRows(rows);
        }
      };

      addSheet('Ventas', resumen);
      addSheet('Totales', total);
      addSheet('Top Productos', top);
      addSheet('Categorías', categorias);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=reporte-dia.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(200).json({
        status: 'Success',
        message: 'Reporte completo generado.',
        data
      });
    }

  } catch (error) {
    console.error('Error generando el reporte del día:', error);
    res.status(500).json({
      status: 'Error',
      message: 'No se pudo generar el reporte del día.',
      error: error.message
    });
  }
};









const registeradmin = async (req, res) => {
  try {
    const db = await getDb();

    const { correo, contraseña } = req.body;

    if (!correo || !contraseña) {
      return res.status(400).json({
        status: "Error",
        message: "Correo y contraseña son obligatorios."
      });
    }

    const existingAdmin = await db.collection('administradores').findOne({ correo });
    if (existingAdmin) {
      return res.status(409).json({
        status: "Error",
        message: "Ya existe un administrador con ese correo."
      });
    }

    const hashedPassword = CryptoJS.SHA256(contraseña, process.env.CODE_SECRET_DATA).toString();

    const newAdmin = {
      correo,
      password: hashedPassword,
      role: 'admin',
      creado: moment().tz("America/Bogota").format('YYYY-MM-DD HH:mm:ss')
    };

    await db.collection('administradores').insertOne(newAdmin);

    return res.status(201).json({
      status: "Success",
      message: "Administrador creado correctamente.",
      data: newAdmin
    });

  } catch (error) {
    console.error('Error al registrar administrador:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno del servidor",
      error: error.message
    });
  }
};
const loginadmin = async (req, res) => {
  const { correo, contraseña } = req.body;

  try {
    const db = await getDb();

    // Buscar por correo
    const admin = await db.collection('administradores').findOne({ correo });

    if (!admin) {
      return res.status(401).json({
        status: "Error",
        message: "Credenciales incorrectas"
      });
    }

    // Comparar contraseña hasheada
    const hashedPassword = CryptoJS.SHA256(contraseña, process.env.CODE_SECRET_DATA).toString();

    if (hashedPassword !== admin.password) {
      return res.status(401).json({
        status: "Error",
        message: "Credenciales incorrectas"
      });
    }

    // Generar código aleatorio después del login exitoso
    const codeData = await generateRandomCode(admin._id.toString(), 'admin');
    
    // Enviar código por email
    const emailResult = await sendOTPByEmail(admin.correo, codeData.code, admin.nombre || 'Administrador', 'admin');

    return res.status(200).json({
      status: "Success",
      message: "Credenciales correctas. Se ha enviado un código de verificación a tu email.",
      requiresVerification: true,
      userId: admin._id.toString(),
      userType: 'admin',
      admin: {
        id: admin._id,
        correo: admin.correo,
        role: 'admin'
      },
      emailSent: emailResult.success,
      emailMessage: emailResult.success ? "Código enviado exitosamente" : "Error enviando código por email"
    });

  } catch (error) {
    console.error('Error en loginadmin:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

const getDashboardData = async (req, res) => {
  try {
    const db = await getDb();
    const ventasCol = db.collection('ventas');
    const productosCol = db.collection('productos');
    const inventarioCol = db.collection('inventario');

    // Calcular fechas con zona horaria colombiana
    const colombianNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
    const startOfToday = new Date(colombianNow.getFullYear(), colombianNow.getMonth(), colombianNow.getDate());

    // Obtener inicio de semana (domingo)
    const dayOfWeek = colombianNow.getDay(); // 0=domingo, 6=sábado
    const startOfWeek = new Date(colombianNow);
    startOfWeek.setDate(colombianNow.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    // Obtener inicio de mes
    const startOfMonth = new Date(colombianNow.getFullYear(), colombianNow.getMonth(), 1);

    // Traer ventas
    const ventas = await ventasCol.find({}).toArray();

    // Convertidor de fecha UTC a Date en horario colombiano
    const toColombianDate = (utcDateStr) => {
      return new Date(new Date(utcDateStr).toLocaleString("en-US", { timeZone: "America/Bogota" }));
    };

    const filtrarPorRango = (fechaInicio) => {
      return ventas.filter(v => toColombianDate(v.fecha) >= fechaInicio);
    };

    const sumarTotal = (ventas) => ventas.reduce((acc, v) => acc + v.totalVenta, 0);

    const ventasDiarias = filtrarPorRango(startOfToday);
    const ventasSemanales = filtrarPorRango(startOfWeek);
    const ventasMensuales = filtrarPorRango(startOfMonth);

    const dailySales = ventasDiarias.map(v => {
      const dateCol = toColombianDate(v.fecha);
      return {
        date: dateCol.toLocaleString("es-CO", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }),
        total: v.totalVenta
      };
    });

    // Agrupar productos vendidos
    const conteoProductos = {};
    ventas.forEach(v => {
      v.productos.forEach(p => {
        if (!conteoProductos[p.code]) {
          conteoProductos[p.code] = { ...p, cantidad: 0 };
        }
        conteoProductos[p.code].cantidad += p.cantidad;
      });
    });

    // Obtener detalles del producto
    const topProducts = await Promise.all(
      Object.entries(conteoProductos)
        .sort((a, b) => b[1].cantidad - a[1].cantidad)
        .map(async ([code, info]) => {
          const prod = await productosCol.findOne({ code });
          return {
            id: code,
            name: info.name,
            category: prod?.category || null,
            sales: info.cantidad,
            revenue: (prod?.price || 0) * info.cantidad
          };
        })
    );

    // Productos con bajo stock
    const lowStockItemsCursor = await inventarioCol.find({
      $expr: { $lte: ["$stock", "$minStock"] }
    }).sort({ stock: 1 }).toArray();

    const lowStockItems = lowStockItemsCursor.map(item => {
      const lastUpdateCol = item.lastUpdate
        ? toColombianDate(item.lastUpdate).toLocaleString("es-CO", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          })
        : null;
      return {
        id: item.code,
        name: item.name,
        stock: item.stock,
        minStock: item.minStock,
        category: item.category,
        lastUpdate: lastUpdateCol
      };
    });

    res.status(200).json({
      status: "Success",
      data: {
        salesSummary: {
          daily: sumarTotal(ventasDiarias),
          weekly: sumarTotal(ventasSemanales),
          monthly: sumarTotal(ventasMensuales),
          dailySales
        },
        topProducts,
        lowStockItems
      }
    });

  } catch (error) {
    console.error("Error en getDashboardData:", error);
    res.status(500).json({
      status: "Error",
      message: "No se pudo cargar el dashboard",
      error: error.message
    });
  }
};



const getUsers = async (req, res) => {
  try {
    const db = await getDb();
    const users = await db.collection('usuarios').find({}).toArray();

    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || 'active'
    }));

    return res.status(200).json({
      status: "Success",
      data: formattedUsers
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

const createUser = async (req, res) => {
  try {
    const db = await getDb();
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        status: "Error",
        message: "Todos los campos son obligatorios."
      });
    }

    const existingUser = await db.collection('usuarios').findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        status: "Error",
        message: "Ya existe un usuario con ese correo."
      });
    }

    const hashedPassword = CryptoJS.SHA256(password, process.env.CODE_SECRET_DATA).toString();

    const newUser = {
      name,
      email,
      password: hashedPassword,
      role,
      status: "active",
      createdAt: moment().tz("America/Bogota").format('YYYY-MM-DD HH:mm:ss')
    };

    await db.collection('usuarios').insertOne(newUser);

    return res.status(201).json({
      status: "Success",
      message: "Usuario creado correctamente.",
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    });

  } catch (error) {
    console.error('Error al registrar usuario:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const db = await getDb();

    const { id } = req.params;
    const { email, password, status } = req.body;

    if (!id) {
      return res.status(400).json({
        status: "Error",
        message: "ID de usuario es requerido"
      });
    }

    const user = await db.collection('usuarios').findOne({ _id: new ObjectId(id) });

    if (!user) {
      return res.status(404).json({
        status: "Error",
        message: "Usuario no encontrado"
      });
    }

    const updateFields = {};

    if (email) {
      updateFields.email = email;
    }

    if (password) {
      updateFields.password = CryptoJS.SHA256(password, process.env.CODE_SECRET_DATA).toString();
    }

    if (status) {
      if (status !== 'active' && status !== 'inactive') {
        return res.status(400).json({
          status: "Error",
          message: "El estado debe ser 'active' o 'inactive'."
        });
      }
      updateFields.status = status;
    }

    updateFields.updatedAt = moment().tz("America/Bogota").format('YYYY-MM-DD HH:mm:ss');

    await db.collection('usuarios').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    const updatedUser = await db.collection('usuarios').findOne({ _id: new ObjectId(id) });

    return res.status(200).json({
      status: "Success",
      message: "Usuario actualizado correctamente",
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno del servidor",
      error: error.message
    });
  }
};
const loginUser = async (req, res) => {
  try {
    const db = await getDb();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "Error",
        message: "Email y contraseña son obligatorios."
      });
    }

    const hashedPassword = CryptoJS.SHA256(password, process.env.CODE_SECRET_DATA).toString();

    let user = await db.collection('usuarios').findOne({ email });

    if (user) {
      if (user.password !== hashedPassword) {
        return res.status(401).json({
          status: "Error",
          message: "Credenciales inválidas"
        });
      }

      if (user.status !== 'active') {
        return res.status(403).json({
          status: "Error",
          message: "Usuario inactivo. Contacta con el administrador."
        });
      }

    } else {
      const admin = await db.collection('administradores').findOne({ correo: email });
      if (!admin || admin.password !== hashedPassword) {
        return res.status(401).json({
          status: "Error",
          message: "Credenciales inválidas"
        });
      }

      user = {
        _id: admin._id,
        name: 'Administrador',
        email: admin.correo,
        role: 'admin'
      };
    }

    // Generar código aleatorio después del login exitoso
    const codeData = await generateRandomCode(user._id.toString(), user.role === 'admin' ? 'admin' : 'trabajador');
    
    // Enviar código por email
    const emailResult = await sendOTPByEmail(user.email, codeData.code, user.name, user.role === 'admin' ? 'admin' : 'trabajador');

    return res.status(200).json({
      status: "Success",
      message: "Credenciales correctas. Se ha enviado un código de verificación a tu email.",
      requiresVerification: true,
      userId: user._id.toString(),
      userType: user.role === 'admin' ? 'admin' : 'trabajador',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      emailSent: emailResult.success,
      emailMessage: emailResult.success ? "Código enviado exitosamente" : "Error enviando código por email"
    });

  } catch (error) {
    console.error('Error en loginUser:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

// Función helper para validar ObjectId
const isValidObjectId = (id) => {
  if (!id) return false;
  if (typeof id !== 'string') return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// ---------------------------------GENERAR_FACTURA_PDF--------------------------------------------------------------
const generateInvoicePDF = async (req, res) => {
  try {
    const { saleId, facturaId } = req.params;
    const db = await getDb();
    
    let factura = null;
    let venta = null;

    // Buscar por ID de factura o ID de venta
    if (facturaId) {
      // Validar formato de ObjectId
      if (!isValidObjectId(facturaId)) {
        return res.status(400).json({
          status: "Error",
          message: "ID de factura inválido"
        });
      }

      factura = await db.collection('facturas').findOne({ _id: new ObjectId(facturaId) });
      if (!factura) {
        return res.status(404).json({
          status: "Error",
          message: "Factura no encontrada"
        });
      }
      
      // Obtener la venta relacionada si existe
      if (factura.ventaId) {
        venta = await db.collection('ventas').findOne({ _id: factura.ventaId });
      }
    } else if (saleId) {
      // Validar formato de ObjectId
      if (!isValidObjectId(saleId)) {
        return res.status(400).json({
          status: "Error",
          message: "ID de venta inválido"
        });
      }

      // Buscar la venta
      venta = await db.collection('ventas').findOne({ _id: new ObjectId(saleId) });
      if (!venta) {
        return res.status(404).json({
          status: "Error",
          message: "Venta no encontrada"
        });
      }

      // Buscar la factura relacionada
      if (venta.facturaId) {
        factura = await db.collection('facturas').findOne({ _id: venta.facturaId });
      }
    } else {
      return res.status(400).json({
        status: "Error",
        message: "Debe proporcionar saleId o facturaId"
      });
    }

    // Si no hay factura, crear una temporal con datos de la venta
    if (!factura && venta) {
      factura = {
        numeroFactura: `VTA-${venta.code}`,
        cliente: {
          nombre: venta.cliente.name,
          tipoIdentificacion: venta.cliente.tipoIdentificacion || 'CC',
          numeroIdentificacion: venta.cliente.document,
          email: venta.cliente.email,
          telefono: venta.cliente.phone
        },
        productos: venta.productos,
        total: venta.totalVenta,
        subtotal: venta.totalVentaSinDescuento,
        descuentoAplicado: venta.descuentoAplicado || 0,
        descuentoTotal: venta.montoDescuento || 0,
        metodoPago: venta.metodoPago,
        fechaEmision: venta.fecha,
        estado: venta.estadoPago === 'pagado' ? 'pagada' : 'pendiente',
        saldoPendiente: venta.estadoPago === 'pagado' ? 0 : venta.totalVenta,
        tipoVenta: venta.tipoVenta || 'contado'
      };
    }

    if (!factura) {
      return res.status(404).json({
        status: "Error",
        message: "No se encontró información de factura"
      });
    }

    // Crear el PDF
    const doc = new PDFDocument({ 
      size: 'A4',
      margin: 50,
      info: {
        Title: `Factura ${factura.numeroFactura}`,
        Author: 'Sistema Papelería',
        Subject: 'Factura de Venta'
      }
    });

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=factura-${factura.numeroFactura}.pdf`);
    
    // Pipe del PDF a la respuesta
    doc.pipe(res);

    // Diseño de la factura
    doc.fontSize(20).text('FACTURA DE VENTA', 50, 50, { align: 'center' });
    
    // Información de la empresa
    doc.fontSize(12)
       .text('PAPELERÍA KEVIN', 50, 100)
       .text('NIT: 123456789-0', 50, 120)
       .text('Dirección: Medellín, Colombia', 50, 140)
       .text('Teléfono: +57 300 123 4567', 50, 160);

    // Información de la factura
    doc.text(`No. Factura: ${factura.numeroFactura}`, 400, 100)
       .text(`Fecha: ${moment(factura.fechaEmision).format('DD/MM/YYYY')}`, 400, 120)
       .text(`Estado: ${factura.estado.toUpperCase()}`, 400, 140);

    // Si es financiado, mostrar información adicional
    if (factura.tipoVenta === 'financiado' || (factura.planAbonos && factura.planAbonos.length > 0)) {
      doc.text(`Tipo: FINANCIADO`, 400, 160);
      if (factura.fechaVencimiento) {
        doc.text(`Vencimiento: ${moment(factura.fechaVencimiento).format('DD/MM/YYYY')}`, 400, 180);
      }
    }

    // Información del cliente
    doc.fontSize(14).text('DATOS DEL CLIENTE', 50, 220);
    doc.fontSize(12)
       .text(`Nombre: ${factura.cliente.nombre}`, 50, 240)
       .text(`${factura.cliente.tipoIdentificacion || 'Documento'}: ${factura.cliente.numeroIdentificacion}`, 50, 260)
       .text(`Email: ${factura.cliente.email}`, 50, 280)
       .text(`Teléfono: ${factura.cliente.telefono}`, 50, 300);

    // Información del trabajador (si existe en la venta)
    if (venta && venta.trabajador) {
      doc.fontSize(14).text('VENDEDOR', 50, 340);
      doc.fontSize(12)
         .text(`Nombre: ${venta.trabajador.nombre}`, 50, 360)
         .text(`Email: ${venta.trabajador.correo}`, 50, 380);
    }

    // Tabla de productos
    let yPosition = venta && venta.trabajador ? 420 : 340;
    doc.fontSize(14).text('DETALLE DE PRODUCTOS', 50, yPosition);
    yPosition += 30;

    // Headers de la tabla
    doc.fontSize(10)
       .text('Código', 50, yPosition)
       .text('Producto', 120, yPosition)
       .text('Cantidad', 300, yPosition)
       .text('Precio Unit.', 380, yPosition)
       .text('Total', 480, yPosition);
    
    yPosition += 20;
    
    // Línea separadora
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 10;

    // Productos
    factura.productos.forEach(producto => {
      doc.fontSize(9)
         .text(producto.code, 50, yPosition)
         .text(producto.name || producto.nombre, 120, yPosition)
         .text(producto.cantidad.toString(), 300, yPosition)
         .text(`$${producto.precioUnitario.toLocaleString()}`, 380, yPosition)
         .text(`$${(producto.total || producto.subtotal).toLocaleString()}`, 480, yPosition);
      yPosition += 20;
    });

    // Totales
    yPosition += 20;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 20;

    doc.fontSize(12)
       .text('SUBTOTAL:', 400, yPosition)
       .text(`$${(factura.subtotal || factura.total).toLocaleString()}`, 480, yPosition);
    
    if (factura.descuentoAplicado > 0) {
      yPosition += 20;
      doc.text(`DESCUENTO (${factura.descuentoAplicado}%):`, 400, yPosition)
         .text(`-$${factura.descuentoTotal.toLocaleString()}`, 480, yPosition);
    }

    if (factura.iva && factura.iva > 0) {
      yPosition += 20;
      doc.text(`IVA (${factura.iva}%):`, 400, yPosition)
         .text(`$${factura.ivaTotal.toLocaleString()}`, 480, yPosition);
    }

    yPosition += 20;
    doc.fontSize(14).text('TOTAL:', 400, yPosition)
       .text(`$${factura.total.toLocaleString()}`, 480, yPosition);

    // Información de pagos si es financiado
    if (factura.tipoVenta === 'financiado' || (factura.planAbonos && factura.planAbonos.length > 0)) {
      yPosition += 30;
      doc.fontSize(12).text(`Saldo Pendiente: $${factura.saldoPendiente.toLocaleString()}`, 400, yPosition);
      
      // Mostrar plan de abonos si existe
      if (factura.planAbonos && factura.planAbonos.length > 0) {
        yPosition += 30;
        doc.fontSize(14).text('PLAN DE ABONOS', 50, yPosition);
        yPosition += 20;
        
        factura.planAbonos.forEach((abono, index) => {
          const estadoText = abono.estado === 'pagado' ? '✓' : '○';
          const fechaText = moment(abono.fechaProgramada).format('DD/MM/YYYY');
          doc.fontSize(10)
             .text(`${estadoText} Abono ${abono.numero}: $${abono.monto.toLocaleString()} - ${fechaText}`, 50, yPosition);
          
          if (abono.estado === 'pagado' && abono.fechaPago) {
            doc.text(`   Pagado: ${moment(abono.fechaPago).format('DD/MM/YYYY')} - $${abono.montoPagado.toLocaleString()}`, 50, yPosition + 12);
            yPosition += 24;
          } else {
            yPosition += 16;
          }
        });
      }
    }

    // Método de pago
    yPosition += 20;
    doc.fontSize(12).text(`Método de Pago: ${factura.metodoPago}`, 50, yPosition);

    // Observaciones si existen
    if (factura.observaciones) {
      yPosition += 20;
      doc.text(`Observaciones: ${factura.observaciones}`, 50, yPosition);
    }

    // Pie de página
    yPosition += 40;
    doc.fontSize(10)
       .text('Gracias por su compra', 50, yPosition, { align: 'center' })
       .text('Sistema de Papelería - Medellín', 50, yPosition + 20, { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('Error generando PDF de factura:', error);
    res.status(500).json({
      status: "Error",
      message: "Error al generar el PDF de la factura",
      error: error.message
    });
  }
};
// ---------------------------------ENVIAR_FACTURA_POR_EMAIL--------------------------------------------------------------

const sendInvoiceToN8N = async (req, res) => {
  try {
    const { saleId, email, subject, message } = req.body;
    const db = await getDb();
    
    // Debug: Log del request body
    console.log('Request body recibido en sendInvoiceToN8N:', req.body);
    console.log('Headers:', req.headers);
    
    // Validaciones
    if (!saleId || !email) {
      return res.status(400).json({
        status: "Error",
        message: "saleId y email son obligatorios",
        received: {
          saleId: saleId || 'undefined',
          email: email || 'undefined',
          bodyKeys: Object.keys(req.body || {}),
          bodyType: typeof req.body
        }
      });
    }

    // Validar formato de ObjectId
    if (!isValidObjectId(saleId)) {
      return res.status(400).json({
        status: "Error",
        message: "ID de venta inválido"
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "Error",
        message: "Formato de email inválido"
      });
    }

    // Buscar la venta
    const venta = await db.collection('ventas').findOne({ _id: new ObjectId(saleId) });
    if (!venta) {
      return res.status(404).json({
        status: "Error",
        message: "Venta no encontrada"
      });
    }

    // Buscar la factura relacionada
    let factura = null;
    if (venta.facturaId) {
      factura = await db.collection('facturas').findOne({ _id: venta.facturaId });
    }

    // Si no hay factura, crear una temporal con datos de la venta
    if (!factura) {
      factura = {
        numeroFactura: `VTA-${venta.code}`,
        cliente: {
          nombre: venta.cliente.name,
          tipoIdentificacion: venta.cliente.tipoIdentificacion || 'CC',
          numeroIdentificacion: venta.cliente.document,
          email: venta.cliente.email,
          telefono: venta.cliente.phone
        },
        productos: venta.productos,
        total: venta.totalVenta,
        subtotal: venta.totalVentaSinDescuento,
        descuentoAplicado: venta.descuentoAplicado || 0,
        descuentoTotal: venta.montoDescuento || 0,
        metodoPago: venta.metodoPago,
        fechaEmision: venta.fecha,
        estado: venta.estadoPago === 'pagado' ? 'pagada' : 'pendiente',
        saldoPendiente: venta.estadoPago === 'pagado' ? 0 : venta.totalVenta,
        tipoVenta: venta.tipoVenta || 'contado'
      };
    }

    // Generar PDF en Base64 para n8n
    const pdfBase64 = await generateInvoicePDFBase64(factura, venta);

    // Preparar datos para n8n
    const n8nData = {
      // Datos del cliente
      nombre: factura.cliente.nombre,
      email: email,
      documento: factura.cliente.numeroIdentificacion,
      telefono: factura.cliente.telefono,
      
      // Datos de la factura
      numeroFactura: factura.numeroFactura,
      codigoFactura: factura.numeroFactura, // Mantener compatibilidad
      fecha: moment(factura.fechaEmision).format('DD/MM/YYYY'),
      hora: venta ? venta.hora : moment(factura.fechaEmision).format('HH:mm:ss'),
      total: factura.total,
      subtotal: factura.subtotal || factura.total,
      descuento: factura.descuentoTotal || 0,
      descuentoPorcentaje: factura.descuentoAplicado || 0,
      saldoPendiente: factura.saldoPendiente || 0,
      estado: factura.estado,
      tipoVenta: factura.tipoVenta || 'contado',
      metodoPago: factura.metodoPago,
      
      // Datos del vendedor (si existe)
      vendedor: venta && venta.trabajador ? venta.trabajador.nombre : 'Sistema',
      emailVendedor: venta && venta.trabajador ? venta.trabajador.correo : '',
      
      // Productos
      productos: factura.productos.map(p => ({
        codigo: p.code,
        nombre: p.name || p.nombre,
        cantidad: p.cantidad,
        precioUnitario: p.precioUnitario,
        total: p.total || p.subtotal
      })),
      
      // Plan de abonos si existe
      planAbonos: factura.planAbonos ? factura.planAbonos.map(a => ({
        numero: a.numero,
        monto: a.monto,
        fechaProgramada: moment(a.fechaProgramada).format('DD/MM/YYYY'),
        estado: a.estado,
        fechaPago: a.fechaPago ? moment(a.fechaPago).format('DD/MM/YYYY') : null,
        montoPagado: a.montoPagado || 0
      })) : [],
      
      // PDF en Base64
      pdfBase64: pdfBase64,
      nombreArchivo: `factura-${factura.numeroFactura}.pdf`,
      
      // URL del PDF para acceso directo
      pdfUrl: `${process.env.BASE_URL || 'https://back-papeleria-two.vercel.app'}/v1/papeleria/invoice-pdf/${saleId}`,
      
      // Asunto y mensaje personalizados
      asunto: subject || `Factura ${factura.numeroFactura} - Papelería Kevin`,
      mensaje: message || `Estimado/a ${factura.cliente.nombre}, adjunto encontrará la factura de su ${factura.tipoVenta === 'financiado' ? 'compra financiada' : 'compra'}.`,
      
      // Metadatos
      saleId: saleId,
      facturaId: factura._id || null,
      timestamp: moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss')
    };

    // Enviar a n8n webhook
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://unaccosted-dayton-nonascetically.ngrok-free.dev/webhook/v1/papeleria/send-invoice-n8n';
    
    console.log('Enviando datos a n8n webhook:', n8nWebhookUrl);
    console.log('Datos a enviar:', JSON.stringify(n8nData, null, 2));
    
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(n8nData),
      timeout: 30000 // 30 segundos de timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from n8n:', errorText);
      throw new Error(`Error enviando a n8n: ${response.status} - ${errorText}`);
    }

    // Manejar respuesta que puede no ser JSON
    let n8nResponse;
    let responseText;
    
    try {
      responseText = await response.text();
      console.log('Respuesta cruda de n8n:', responseText);
      
      if (responseText.trim()) {
        // Intentar parsear como JSON
        n8nResponse = JSON.parse(responseText);
      } else {
        n8nResponse = { message: "Respuesta vacía de n8n", success: true };
      }
    } catch (parseError) {
      console.warn('n8n devolvió respuesta no-JSON, pero procesó correctamente:', parseError.message);
      // Si no es JSON válido, asumir que fue exitoso ya que response.ok es true
      n8nResponse = { 
        message: "n8n procesó la solicitud correctamente",
        success: true,
        rawResponse: responseText || "Sin contenido"
      };
    }

    res.status(200).json({
      status: "Success",
      message: "Datos enviados a n8n correctamente",
      data: {
        saleId: saleId,
        email: email,
        invoiceCode: `VTA-${venta.code}`,
        n8nResponse: n8nResponse,
        sentAt: moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss')
      }
    });

  } catch (error) {
    console.error('Error enviando datos a n8n:', error);
    
    // Determinar el tipo de error
    let errorMessage = "Error al enviar los datos a n8n";
    let errorDetails = error.message;
    
    if (error.message.includes('fetch failed')) {
      errorMessage = "No se pudo conectar con el webhook de n8n";
      errorDetails = "Verifica que la URL del webhook sea correcta y que n8n esté funcionando";
    } else if (error.message.includes('timeout')) {
      errorMessage = "Timeout al enviar datos a n8n";
      errorDetails = "El webhook de n8n tardó demasiado en responder";
    } else if (error.message.includes('ECONNREFUSED')) {
      errorMessage = "Conexión rechazada por n8n";
      errorDetails = "El webhook de n8n no está disponible o la URL es incorrecta";
    }
    
    res.status(500).json({
      status: "Error",
      message: errorMessage,
      error: errorDetails,
      debug: {
        webhookUrl: process.env.N8N_WEBHOOK_URL || 'No configurado',
        saleId: req.body.saleId,
        originalError: error.message
      }
    });
  }
};

// Función auxiliar para generar PDF en Base64 - Actualizada para usar factura
const generateInvoicePDFBase64 = async (factura, venta = null) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      size: 'A4',
      margin: 50,
      info: {
        Title: `Factura ${factura.numeroFactura}`,
        Author: 'Sistema Papelería',
        Subject: 'Factura de Venta'
      }
    });

    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      const base64 = pdfBuffer.toString('base64');
      resolve(base64);
    });
    doc.on('error', reject);

    // Diseño de la factura
    doc.fontSize(20).text('FACTURA DE VENTA', 50, 50, { align: 'center' });
    
    // Información de la empresa
    doc.fontSize(12)
       .text('PAPELERÍA KEVIN', 50, 100)
       .text('NIT: 123456789-0', 50, 120)
       .text('Dirección: Medellín, Colombia', 50, 140)
       .text('Teléfono: +57 300 123 4567', 50, 160);

    // Información de la factura
    doc.text(`No. Factura: ${factura.numeroFactura}`, 400, 100)
       .text(`Fecha: ${moment(factura.fechaEmision).format('DD/MM/YYYY')}`, 400, 120)
       .text(`Estado: ${factura.estado.toUpperCase()}`, 400, 140);

    // Si es financiado, mostrar información adicional
    if (factura.tipoVenta === 'financiado' || (factura.planAbonos && factura.planAbonos.length > 0)) {
      doc.text(`Tipo: FINANCIADO`, 400, 160);
      if (factura.fechaVencimiento) {
        doc.text(`Vencimiento: ${moment(factura.fechaVencimiento).format('DD/MM/YYYY')}`, 400, 180);
      }
    }

    // Información del cliente
    doc.fontSize(14).text('DATOS DEL CLIENTE', 50, 220);
    doc.fontSize(12)
       .text(`Nombre: ${factura.cliente.nombre}`, 50, 240)
       .text(`${factura.cliente.tipoIdentificacion || 'Documento'}: ${factura.cliente.numeroIdentificacion}`, 50, 260)
       .text(`Email: ${factura.cliente.email}`, 50, 280)
       .text(`Teléfono: ${factura.cliente.telefono}`, 50, 300);

    // Información del trabajador (si existe en la venta)
    if (venta && venta.trabajador) {
      doc.fontSize(14).text('VENDEDOR', 50, 340);
      doc.fontSize(12)
         .text(`Nombre: ${venta.trabajador.nombre}`, 50, 360)
         .text(`Email: ${venta.trabajador.correo}`, 50, 380);
    }

    // Tabla de productos
    let yPosition = venta && venta.trabajador ? 420 : 340;
    doc.fontSize(14).text('DETALLE DE PRODUCTOS', 50, yPosition);
    yPosition += 30;

    // Headers de la tabla
    doc.fontSize(10)
       .text('Código', 50, yPosition)
       .text('Producto', 120, yPosition)
       .text('Cantidad', 300, yPosition)
       .text('Precio Unit.', 380, yPosition)
       .text('Total', 480, yPosition);
    
    yPosition += 20;
    
    // Línea separadora
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 10;

    // Productos
    factura.productos.forEach(producto => {
      doc.fontSize(9)
         .text(producto.code, 50, yPosition)
         .text(producto.name || producto.nombre, 120, yPosition)
         .text(producto.cantidad.toString(), 300, yPosition)
         .text(`$${producto.precioUnitario.toLocaleString()}`, 380, yPosition)
         .text(`$${(producto.total || producto.subtotal).toLocaleString()}`, 480, yPosition);
      yPosition += 20;
    });

    // Totales
    yPosition += 20;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 20;

    doc.fontSize(12)
       .text('SUBTOTAL:', 400, yPosition)
       .text(`$${(factura.subtotal || factura.total).toLocaleString()}`, 480, yPosition);
    
    if (factura.descuentoAplicado > 0) {
      yPosition += 20;
      doc.text(`DESCUENTO (${factura.descuentoAplicado}%):`, 400, yPosition)
         .text(`-$${factura.descuentoTotal.toLocaleString()}`, 480, yPosition);
    }

    if (factura.iva && factura.iva > 0) {
      yPosition += 20;
      doc.text(`IVA (${factura.iva}%):`, 400, yPosition)
         .text(`$${factura.ivaTotal.toLocaleString()}`, 480, yPosition);
    }

    yPosition += 20;
    doc.fontSize(14).text('TOTAL:', 400, yPosition)
       .text(`$${factura.total.toLocaleString()}`, 480, yPosition);

    // Información de pagos si es financiado
    if (factura.tipoVenta === 'financiado' || (factura.planAbonos && factura.planAbonos.length > 0)) {
      yPosition += 30;
      doc.fontSize(12).text(`Saldo Pendiente: $${factura.saldoPendiente.toLocaleString()}`, 400, yPosition);
      
      // Mostrar plan de abonos si existe
      if (factura.planAbonos && factura.planAbonos.length > 0 && factura.planAbonos.length <= 5) {
        yPosition += 30;
        doc.fontSize(14).text('PLAN DE ABONOS', 50, yPosition);
        yPosition += 20;
        
        factura.planAbonos.forEach((abono, index) => {
          const estadoText = abono.estado === 'pagado' ? '✓' : '○';
          const fechaText = moment(abono.fechaProgramada).format('DD/MM/YYYY');
          doc.fontSize(10)
             .text(`${estadoText} Abono ${abono.numero}: $${abono.monto.toLocaleString()} - ${fechaText}`, 50, yPosition);
          
          if (abono.estado === 'pagado' && abono.fechaPago) {
            doc.text(`   Pagado: ${moment(abono.fechaPago).format('DD/MM/YYYY')} - $${abono.montoPagado.toLocaleString()}`, 50, yPosition + 12);
            yPosition += 24;
          } else {
            yPosition += 16;
          }
        });
      }
    }

    // Método de pago
    yPosition += 20;
    doc.fontSize(12).text(`Método de Pago: ${factura.metodoPago}`, 50, yPosition);

    // Observaciones si existen
    if (factura.observaciones) {
      yPosition += 20;
      doc.text(`Observaciones: ${factura.observaciones}`, 50, yPosition);
    }

    // Pie de página
    yPosition += 40;
    doc.fontSize(10)
       .text('Gracias por su compra', 50, yPosition, { align: 'center' })
       .text('Sistema de Papelería - Medellín', 50, yPosition + 20, { align: 'center' });

    doc.end();
  });
};

// Endpoint de prueba para verificar conectividad con n8n
const testN8NConnection = async (req, res) => {
  try {
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://unaccosted-dayton-nonascetically.ngrok-free.dev/v1/papeleria/send-invoice-email';
    
    console.log('Probando conexión con n8n:', n8nWebhookUrl);
    
    const testData = {
      test: true,
      message: "Prueba de conectividad desde backend",
      timestamp: moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss')
    };
    
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
      timeout: 10000 // 10 segundos de timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({
        status: "Error",
        message: "Error de conectividad con n8n",
        details: {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          webhookUrl: n8nWebhookUrl
        }
      });
    }

    // Manejar respuesta que puede no ser JSON
    let n8nResponse;
    let responseText;
    
    try {
      responseText = await response.text();
      console.log('Respuesta de test n8n:', responseText);
      
      if (responseText.trim()) {
        n8nResponse = JSON.parse(responseText);
      } else {
        n8nResponse = { message: "Test exitoso - respuesta vacía", success: true };
      }
    } catch (parseError) {
      console.warn('Test n8n - respuesta no-JSON:', parseError.message);
      n8nResponse = { 
        message: "Test exitoso - n8n está funcionando",
        success: true,
        rawResponse: responseText || "Sin contenido"
      };
    }
    
    res.status(200).json({
      status: "Success",
      message: "Conexión con n8n exitosa",
      data: {
        webhookUrl: n8nWebhookUrl,
        n8nResponse: n8nResponse,
        testAt: moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss')
      }
    });

  } catch (error) {
    console.error('Error probando conexión con n8n:', error);
    
    res.status(500).json({
      status: "Error",
      message: "No se pudo conectar con n8n",
      error: error.message,
      debug: {
        webhookUrl: process.env.N8N_WEBHOOK_URL || 'No configurado',
        originalError: error.message
      }
    });
  }
};

const sendInvoiceByEmail = async (req, res) => {
  try {
    const { saleId, email, subject, message } = req.body;
    const db = await getDb();
    
    // Validaciones
    if (!saleId || !email) {
      return res.status(400).json({
        status: "Error",
        message: "saleId y email son obligatorios"
      });
    }

    // Validar formato de ObjectId
    if (!isValidObjectId(saleId)) {
      return res.status(400).json({
        status: "Error",
        message: "ID de venta inválido"
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "Error",
        message: "Formato de email inválido"
      });
    }

    // Buscar la venta
    const venta = await db.collection('ventas').findOne({ _id: new ObjectId(saleId) });
    if (!venta) {
      return res.status(404).json({
        status: "Error",
        message: "Venta no encontrada"
      });
    }

    // Buscar la factura relacionada
    let factura = null;
    if (venta.facturaId) {
      factura = await db.collection('facturas').findOne({ _id: venta.facturaId });
    }

    // Si no hay factura, crear una temporal con datos de la venta
    if (!factura) {
      factura = {
        numeroFactura: `VTA-${venta.code}`,
        cliente: {
          nombre: venta.cliente.name,
          tipoIdentificacion: venta.cliente.tipoIdentificacion || 'CC',
          numeroIdentificacion: venta.cliente.document,
          email: venta.cliente.email,
          telefono: venta.cliente.phone
        },
        productos: venta.productos,
        total: venta.totalVenta,
        subtotal: venta.totalVentaSinDescuento,
        descuentoAplicado: venta.descuentoAplicado || 0,
        descuentoTotal: venta.montoDescuento || 0,
        metodoPago: venta.metodoPago,
        fechaEmision: venta.fecha,
        estado: venta.estadoPago === 'pagado' ? 'pagada' : 'pendiente',
        saldoPendiente: venta.estadoPago === 'pagado' ? 0 : venta.totalVenta,
        tipoVenta: venta.tipoVenta || 'contado'
      };
    }

    // Generar PDF en memoria
    const pdfBuffer = await generateInvoicePDFBuffer(factura, venta);

    // Configurar transporter de nodemailer
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER || 'tu-email@gmail.com',
        pass: process.env.SMTP_PASS || 'tu-password-app'
      }
    });

    // Configurar el email
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@papeleria.com',
      to: email,
      subject: subject || `Factura ${factura.numeroFactura} - Papelería Kevin`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Factura de Venta</h2>
          <p>Estimado/a <strong>${factura.cliente.nombre}</strong>,</p>
          <p>Adjunto encontrará la factura correspondiente a su ${factura.tipoVenta === 'financiado' ? 'compra financiada' : 'compra'} realizada el ${moment(factura.fechaEmision).format('DD/MM/YYYY')}${venta && venta.hora ? ` a las ${venta.hora}` : ''}.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Detalles de la Factura:</h3>
            <p><strong>Número de Factura:</strong> ${factura.numeroFactura}</p>
            <p><strong>Fecha:</strong> ${moment(factura.fechaEmision).format('DD/MM/YYYY')}</p>
            ${venta && venta.hora ? `<p><strong>Hora:</strong> ${venta.hora}</p>` : ''}
            <p><strong>Total:</strong> $${factura.total.toLocaleString()}</p>
            <p><strong>Estado:</strong> ${factura.estado.toUpperCase()}</p>
            <p><strong>Método de Pago:</strong> ${factura.metodoPago}</p>
            ${factura.tipoVenta === 'financiado' ? `<p><strong>Saldo Pendiente:</strong> $${factura.saldoPendiente.toLocaleString()}</p>` : ''}
          </div>

          ${factura.tipoVenta === 'financiado' && factura.planAbonos && factura.planAbonos.length > 0 ? `
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <h4 style="margin-top: 0; color: #856404;">Plan de Abonos:</h4>
              ${factura.planAbonos.slice(0, 3).map(abono => `
                <p style="margin: 5px 0;">
                  ${abono.estado === 'pagado' ? '✅' : '⏳'} 
                  Abono ${abono.numero}: $${abono.monto.toLocaleString()} - 
                  ${moment(abono.fechaProgramada).format('DD/MM/YYYY')}
                  ${abono.estado === 'pagado' ? ' (PAGADO)' : ''}
                </p>
              `).join('')}
              ${factura.planAbonos.length > 3 ? `<p style="color: #856404; font-style: italic;">Y ${factura.planAbonos.length - 3} abono(s) más...</p>` : ''}
            </div>
          ` : ''}

          ${message ? `<p><strong>Mensaje adicional:</strong><br>${message}</p>` : ''}

          <p>Gracias por su ${factura.tipoVenta === 'financiado' ? 'confianza' : 'compra'} en Papelería Kevin.</p>
          <p>Si tiene alguna pregunta, no dude en contactarnos.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            Papelería Kevin<br>
            Medellín, Colombia<br>
            Teléfono: +57 300 123 4567
          </p>
        </div>
      `,
      attachments: [{
        filename: `factura-${factura.numeroFactura}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    };

    // Enviar el email
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      status: "Success",
      message: "Factura enviada por email correctamente",
      data: {
        saleId: saleId,
        facturaId: factura._id || null,
        email: email,
        numeroFactura: factura.numeroFactura,
        invoiceCode: factura.numeroFactura, // Mantener compatibilidad
        tipoVenta: factura.tipoVenta,
        sentAt: moment().tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss')
      }
    });

  } catch (error) {
    console.error('Error enviando factura por email:', error);
    res.status(500).json({
      status: "Error",
      message: "Error al enviar la factura por email",
      error: error.message
    });
  }
};

// Función auxiliar para generar PDF en buffer - Actualizada para usar factura
const generateInvoicePDFBuffer = async (factura, venta = null) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ 
      size: 'A4',
      margin: 50,
      info: {
        Title: `Factura ${factura.numeroFactura}`,
        Author: 'Sistema Papelería',
        Subject: 'Factura de Venta'
      }
    });

    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Diseño de la factura
    doc.fontSize(20).text('FACTURA DE VENTA', 50, 50, { align: 'center' });
    
    // Información de la empresa
    doc.fontSize(12)
       .text('PAPELERÍA KEVIN', 50, 100)
       .text('NIT: 123456789-0', 50, 120)
       .text('Dirección: Medellín, Colombia', 50, 140)
       .text('Teléfono: +57 300 123 4567', 50, 160);

    // Información de la factura
    doc.text(`No. Factura: ${factura.numeroFactura}`, 400, 100)
       .text(`Fecha: ${moment(factura.fechaEmision).format('DD/MM/YYYY')}`, 400, 120)
       .text(`Estado: ${factura.estado.toUpperCase()}`, 400, 140);

    // Si es financiado, mostrar información adicional
    if (factura.tipoVenta === 'financiado' || (factura.planAbonos && factura.planAbonos.length > 0)) {
      doc.text(`Tipo: FINANCIADO`, 400, 160);
      if (factura.fechaVencimiento) {
        doc.text(`Vencimiento: ${moment(factura.fechaVencimiento).format('DD/MM/YYYY')}`, 400, 180);
      }
    }

    // Información del cliente
    doc.fontSize(14).text('DATOS DEL CLIENTE', 50, 220);
    doc.fontSize(12)
       .text(`Nombre: ${factura.cliente.nombre}`, 50, 240)
       .text(`${factura.cliente.tipoIdentificacion || 'Documento'}: ${factura.cliente.numeroIdentificacion}`, 50, 260)
       .text(`Email: ${factura.cliente.email}`, 50, 280)
       .text(`Teléfono: ${factura.cliente.telefono}`, 50, 300);

    // Información del trabajador (si existe en la venta)
    if (venta && venta.trabajador) {
      doc.fontSize(14).text('VENDEDOR', 50, 340);
      doc.fontSize(12)
         .text(`Nombre: ${venta.trabajador.nombre}`, 50, 360)
         .text(`Email: ${venta.trabajador.correo}`, 50, 380);
    }

    // Tabla de productos
    let yPosition = venta && venta.trabajador ? 420 : 340;
    doc.fontSize(14).text('DETALLE DE PRODUCTOS', 50, yPosition);
    yPosition += 30;

    // Headers de la tabla
    doc.fontSize(10)
       .text('Código', 50, yPosition)
       .text('Producto', 120, yPosition)
       .text('Cantidad', 300, yPosition)
       .text('Precio Unit.', 380, yPosition)
       .text('Total', 480, yPosition);
    
    yPosition += 20;
    
    // Línea separadora
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 10;

    // Productos
    factura.productos.forEach(producto => {
      doc.fontSize(9)
         .text(producto.code, 50, yPosition)
         .text(producto.name || producto.nombre, 120, yPosition)
         .text(producto.cantidad.toString(), 300, yPosition)
         .text(`$${producto.precioUnitario.toLocaleString()}`, 380, yPosition)
         .text(`$${(producto.total || producto.subtotal).toLocaleString()}`, 480, yPosition);
      yPosition += 20;
    });

    // Totales
    yPosition += 20;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 20;

    doc.fontSize(12)
       .text('SUBTOTAL:', 400, yPosition)
       .text(`$${(factura.subtotal || factura.total).toLocaleString()}`, 480, yPosition);
    
    if (factura.descuentoAplicado > 0) {
      yPosition += 20;
      doc.text(`DESCUENTO (${factura.descuentoAplicado}%):`, 400, yPosition)
         .text(`-$${factura.descuentoTotal.toLocaleString()}`, 480, yPosition);
    }

    if (factura.iva && factura.iva > 0) {
      yPosition += 20;
      doc.text(`IVA (${factura.iva}%):`, 400, yPosition)
         .text(`$${factura.ivaTotal.toLocaleString()}`, 480, yPosition);
    }

    yPosition += 20;
    doc.fontSize(14).text('TOTAL:', 400, yPosition)
       .text(`$${factura.total.toLocaleString()}`, 480, yPosition);

    // Información de pagos si es financiado
    if (factura.tipoVenta === 'financiado' || (factura.planAbonos && factura.planAbonos.length > 0)) {
      yPosition += 30;
      doc.fontSize(12).text(`Saldo Pendiente: $${factura.saldoPendiente.toLocaleString()}`, 400, yPosition);
    }

    // Método de pago
    yPosition += 20;
    doc.fontSize(12).text(`Método de Pago: ${factura.metodoPago}`, 50, yPosition);

    // Observaciones si existen
    if (factura.observaciones) {
      yPosition += 20;
      doc.text(`Observaciones: ${factura.observaciones}`, 50, yPosition);
    }

    // Pie de página
    yPosition += 40;
    doc.fontSize(10)
       .text('Gracias por su compra', 50, yPosition, { align: 'center' })
       .text('Sistema de Papelería - Medellín', 50, yPosition + 20, { align: 'center' });

    doc.end();
  });
};

const exportReportPDF = async (req, res) => {
  try {
    const { resumen, total, top, categorias, images } = req.body;

    const dateNow = moment().tz('America/Bogota').format('YYYY-MM-DD_HH-mm');
    const filename = `reporte-${dateNow}.pdf`;

    const doc = new PDFDocument({ autoFirstPage: false });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    doc.pipe(res);

    // Nueva página principal
    doc.addPage();
    doc.fontSize(20).text(`📊 Reporte generado - ${dateNow}`, { align: 'center' });
    doc.moveDown(2);

    // Agregar imágenes si existen
    const sectionTitles = {
      daily: '📆 Ventas Diarias',
      weekly: '🗓️ Ventas Semanales',
      monthly: '📅 Ventas Mensuales',
      yearly: '📈 Ventas Anuales',
      category: '📊 Ventas por Categoría'
    };

    for (const [key, label] of Object.entries(sectionTitles)) {
      const imgData = images?.[key];
      if (imgData) {
        doc.addPage();
        doc.fontSize(16).text(label, { align: 'center' });
        doc.moveDown(1);
        const imgBuffer = Buffer.from(imgData.split(',')[1], 'base64');
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = 40;
        const maxWidth = pageWidth - margin * 2;
        const maxHeight = pageHeight - 200;

        doc.image(imgBuffer, {
          fit: [maxWidth, maxHeight],
          align: 'center',
          valign: 'center'
        });
      }
    }

    const appendSection = (title, rows) => {
      doc.addPage();
      doc.fontSize(16).text(`🔸 ${title}`, { underline: true });
      doc.moveDown(0.5);
      rows.forEach(row => {
        Object.entries(row).forEach(([key, val]) => {
          doc.fontSize(12).text(`${key}: ${val}`);
        });
        doc.moveDown();
      });
    };

    if (resumen?.length) appendSection('Ventas', resumen);
    if (total?.length) appendSection('Totales', total);
    if (top?.length) appendSection('Top productos', top);
    if (categorias?.length) appendSection('Categorías', categorias);

    doc.end();
  } catch (error) {
    console.error('Error exportando reporte con imágenes:', error);
    res.status(500).json({
      status: 'Error',
      message: 'No se pudo exportar el reporte en PDF.',
      error: error.message
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: 'Error',
        message: 'ID de usuario no proporcionado.'
      });
    }

    // Buscar el usuario primero
    const user = await db.collection('usuarios').findOne({ _id: new ObjectId(id) });

    if (!user) {
      return res.status(404).json({
        status: 'Error',
        message: 'Usuario no encontrado.'
      });
    }

    // Insertarlo en historial
    await db.collection('usuariosHistorial').insertOne({
      ...user,
      deletedAt: new Date()
    });

    // Eliminar de la colección principal
    await db.collection('usuarios').deleteOne({ _id: new ObjectId(id) });

    return res.status(200).json({
      status: 'Success',
      message: 'Usuario movido a historial y eliminado correctamente.'
    });

  } catch (error) {
    console.error('Error moviendo usuario a historial:', error);
    return res.status(500).json({
      status: 'Error',
      message: 'Error interno del servidor.',
      error: error.message
    });
  }
};
const searchCustomersapi = async (req, res) => {
  try {
    const db = await getDb();
    const { documento } = req.body;

    if (!documento || typeof documento !== 'string') {
      return res.status(400).json({ message: "El campo 'documento' es obligatorio y debe ser una cadena." });
    }

    const clientes = await db.collection('clientes').find({
      documento: { $regex: documento, $options: 'i' }
    }).toArray();

    const resultado = clientes.map(c => ({
      id: c._id.toString(),
      nombre: c.nombre,
      documento: c.documento,
      email: c.email,
      telefono: c.telefono
    }));

    res.status(200).json(resultado);
  } catch (error) {
    console.error('Error al buscar clientes:', error);
    res.status(500).json({ message: 'Error interno al buscar clientes.' });
  }
};






/*---------------------------------CRUD_CLIENTES_MEJORADO--------------------------------------------------------------*/

const createClient = async (req, res) => {
  try {
    const db = await getDb();
    const {
      tipoIdentificacion,
      numeroIdentificacion,
      nombre,
      email,
      telefono,
      departamento,
      ciudad,
      ubicacionLocal,
      tipoCliente = 'individual',
      descuentoPersonalizado = 0
    } = req.body;

    // Validaciones obligatorias
    if (!tipoIdentificacion || !numeroIdentificacion || !nombre || !email || !telefono) {
      return res.status(400).json({
        status: "Error",
        message: "Los campos tipoIdentificacion, numeroIdentificacion, nombre, email y telefono son obligatorios."
      });
    }

    // Validar tipo de identificación
    const tiposValidos = ['CC', 'NIT', 'CE', 'TI', 'RC', 'PAS'];
    if (!tiposValidos.includes(tipoIdentificacion)) {
      return res.status(400).json({
        status: "Error",
        message: "Tipo de identificación inválido. Debe ser: CC, NIT, CE, TI, RC, PAS"
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: "Error",
        message: "Formato de email inválido."
      });
    }

    // Verificar si ya existe un cliente con el mismo número de identificación
    const existingClient = await db.collection('clientes').findOne({
      tipoIdentificacion,
      numeroIdentificacion
    });

    if (existingClient) {
      return res.status(409).json({
        status: "Error",
        message: "Ya existe un cliente con este tipo y número de identificación."
      });
    }

    // Verificar si ya existe un cliente con el mismo email
    const existingEmail = await db.collection('clientes').findOne({ email });
    if (existingEmail) {
      return res.status(409).json({
        status: "Error",
        message: "Ya existe un cliente con este email."
      });
    }

    const newClient = {
      tipoIdentificacion,
      numeroIdentificacion,
      nombre,
      email,
      telefono,
      departamento: departamento || '',
      ciudad: ciudad || '',
      ubicacionLocal: ubicacionLocal || '',
      tipoCliente,
      descuentoPersonalizado: Number(descuentoPersonalizado) || 0,
      estado: 'activo',
      fechaRegistro: moment().tz("America/Bogota").format('YYYY-MM-DD HH:mm:ss'),
      createdAt: new Date(),
      lastUpdate: new Date()
    };

    await db.collection('clientes').insertOne(newClient);

    return res.status(201).json({
      status: "Success",
      message: "Cliente creado correctamente.",
      data: {
        id: newClient._id,
        ...newClient
      }
    });

  } catch (error) {
    console.error('Error al crear cliente:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

const getClients = async (req, res) => {
  try {
    const db = await getDb();
    const { page = 1, limit = 10, search = '', estado = 'activo' } = req.query;

    const query = {};
    
    // Filtro por estado
    if (estado && estado !== 'all') {
      query.estado = estado;
    }

    // Filtro de búsqueda
    if (search) {
      query.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { numeroIdentificacion: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { ciudad: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const clientes = await db.collection('clientes')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await db.collection('clientes').countDocuments(query);

    const formattedClients = clientes.map(client => ({
      id: client._id,
      tipoIdentificacion: client.tipoIdentificacion,
      numeroIdentificacion: client.numeroIdentificacion,
      nombre: client.nombre,
      email: client.email,
      telefono: client.telefono,
      departamento: client.departamento,
      ciudad: client.ciudad,
      ubicacionLocal: client.ubicacionLocal,
      tipoCliente: client.tipoCliente,
      descuentoPersonalizado: client.descuentoPersonalizado,
      estado: client.estado,
      fechaRegistro: client.fechaRegistro
    }));

    return res.status(200).json({
      status: "Success",
      message: "Clientes obtenidos correctamente.",
      data: {
        clientes: formattedClients,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al obtener los clientes.",
      error: error.message
    });
  }
};

const getClientById = async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: "Error",
        message: "ID del cliente es requerido."
      });
    }

    const client = await db.collection('clientes').findOne({ _id: new ObjectId(id) });

    if (!client) {
      return res.status(404).json({
        status: "Error",
        message: "Cliente no encontrado."
      });
    }

    return res.status(200).json({
      status: "Success",
      message: "Cliente obtenido correctamente.",
      data: {
        id: client._id,
        tipoIdentificacion: client.tipoIdentificacion,
        numeroIdentificacion: client.numeroIdentificacion,
        nombre: client.nombre,
        email: client.email,
        telefono: client.telefono,
        departamento: client.departamento,
        ciudad: client.ciudad,
        ubicacionLocal: client.ubicacionLocal,
        tipoCliente: client.tipoCliente,
        descuentoPersonalizado: client.descuentoPersonalizado,
        estado: client.estado,
        fechaRegistro: client.fechaRegistro,
        createdAt: client.createdAt,
        lastUpdate: client.lastUpdate
      }
    });

  } catch (error) {
    console.error('Error al obtener cliente:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al obtener el cliente.",
      error: error.message
    });
  }
};

const updateClient = async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const {
      tipoIdentificacion,
      numeroIdentificacion,
      nombre,
      email,
      telefono,
      departamento,
      ciudad,
      ubicacionLocal,
      tipoCliente,
      descuentoPersonalizado,
      estado
    } = req.body;

    if (!id) {
      return res.status(400).json({
        status: "Error",
        message: "ID del cliente es requerido."
      });
    }

    const existingClient = await db.collection('clientes').findOne({ _id: new ObjectId(id) });
    if (!existingClient) {
      return res.status(404).json({
        status: "Error",
        message: "Cliente no encontrado."
      });
    }

    // Validar tipo de identificación si se proporciona
    if (tipoIdentificacion) {
      const tiposValidos = ['CC', 'NIT', 'CE', 'TI', 'RC', 'PAS'];
      if (!tiposValidos.includes(tipoIdentificacion)) {
        return res.status(400).json({
          status: "Error",
          message: "Tipo de identificación inválido."
        });
      }
    }

    // Validar email si se proporciona
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: "Error",
          message: "Formato de email inválido."
        });
      }

      // Verificar si el email ya existe en otro cliente
      const emailExists = await db.collection('clientes').findOne({
        email,
        _id: { $ne: new ObjectId(id) }
      });
      if (emailExists) {
        return res.status(409).json({
          status: "Error",
          message: "Ya existe un cliente con este email."
        });
      }
    }

    // Verificar si el número de identificación ya existe en otro cliente
    if (tipoIdentificacion && numeroIdentificacion) {
      const docExists = await db.collection('clientes').findOne({
        tipoIdentificacion,
        numeroIdentificacion,
        _id: { $ne: new ObjectId(id) }
      });
      if (docExists) {
        return res.status(409).json({
          status: "Error",
          message: "Ya existe un cliente con este tipo y número de identificación."
        });
      }
    }

    const updateFields = {
      ...(tipoIdentificacion && { tipoIdentificacion }),
      ...(numeroIdentificacion && { numeroIdentificacion }),
      ...(nombre && { nombre }),
      ...(email && { email }),
      ...(telefono && { telefono }),
      ...(departamento !== undefined && { departamento }),
      ...(ciudad !== undefined && { ciudad }),
      ...(ubicacionLocal !== undefined && { ubicacionLocal }),
      ...(tipoCliente && { tipoCliente }),
      ...(descuentoPersonalizado !== undefined && { descuentoPersonalizado: Number(descuentoPersonalizado) }),
      ...(estado && { estado }),
      lastUpdate: new Date()
    };

    await db.collection('clientes').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    const updatedClient = await db.collection('clientes').findOne({ _id: new ObjectId(id) });

    return res.status(200).json({
      status: "Success",
      message: "Cliente actualizado correctamente.",
      data: {
        id: updatedClient._id,
        tipoIdentificacion: updatedClient.tipoIdentificacion,
        numeroIdentificacion: updatedClient.numeroIdentificacion,
        nombre: updatedClient.nombre,
        email: updatedClient.email,
        telefono: updatedClient.telefono,
        departamento: updatedClient.departamento,
        ciudad: updatedClient.ciudad,
        ubicacionLocal: updatedClient.ubicacionLocal,
        tipoCliente: updatedClient.tipoCliente,
        descuentoPersonalizado: updatedClient.descuentoPersonalizado,
        estado: updatedClient.estado,
        fechaRegistro: updatedClient.fechaRegistro,
        lastUpdate: updatedClient.lastUpdate
      }
    });

  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al actualizar el cliente.",
      error: error.message
    });
  }
};

const deleteClient = async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: "Error",
        message: "ID del cliente es requerido."
      });
    }

    const client = await db.collection('clientes').findOne({ _id: new ObjectId(id) });
    if (!client) {
      return res.status(404).json({
        status: "Error",
        message: "Cliente no encontrado."
      });
    }

    // Verificar si el cliente tiene facturas pendientes
    const facturasPendientes = await db.collection('facturas').countDocuments({
      clienteId: new ObjectId(id),
      estado: { $in: ['pendiente', 'parcialmente_pagada', 'vencida'] }
    });

    if (facturasPendientes > 0) {
      return res.status(400).json({
        status: "Error",
        message: "No se puede eliminar el cliente porque tiene facturas pendientes de pago."
      });
    }

    // Mover a historial antes de eliminar
    await db.collection('clientesHistorial').insertOne({
      ...client,
      deletedAt: new Date()
    });

    // Eliminar de la colección principal
    await db.collection('clientes').deleteOne({ _id: new ObjectId(id) });

    return res.status(200).json({
      status: "Success",
      message: "Cliente eliminado correctamente y movido a historial."
    });

  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al eliminar el cliente.",
      error: error.message
    });
  }
};

const searchClients = async (req, res) => {
  try {
    const db = await getDb();
    const { q, tipo = 'all' } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        status: "Error",
        message: "El término de búsqueda debe tener al menos 2 caracteres."
      });
    }

    const query = {
      $or: [
        { nombre: { $regex: q, $options: 'i' } },
        { numeroIdentificacion: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { telefono: { $regex: q, $options: 'i' } }
      ]
    };

    if (tipo !== 'all') {
      query.tipoCliente = tipo;
    }

    const clientes = await db.collection('clientes')
      .find(query)
      .limit(20)
      .toArray();

    const resultado = clientes.map(client => ({
      id: client._id,
      tipoIdentificacion: client.tipoIdentificacion,
      numeroIdentificacion: client.numeroIdentificacion,
      nombre: client.nombre,
      email: client.email,
      telefono: client.telefono,
      ciudad: client.ciudad,
      tipoCliente: client.tipoCliente,
      descuentoPersonalizado: client.descuentoPersonalizado,
      estado: client.estado
    }));

    return res.status(200).json({
      status: "Success",
      message: "Búsqueda completada.",
      data: resultado
    });

  } catch (error) {
    console.error('Error al buscar clientes:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al buscar clientes.",
      error: error.message
    });
  }
};

/*---------------------------------SISTEMA_DE_FACTURACION--------------------------------------------------------------*/

const generateInvoiceNumber = async (db) => {
  try {
    // Obtener el último número de factura
    const lastInvoice = await db.collection('facturas')
      .findOne({}, { sort: { numeroFactura: -1 } });
    
    let nextNumber = 1;
    if (lastInvoice && lastInvoice.numeroFactura) {
      nextNumber = parseInt(lastInvoice.numeroFactura) + 1;
    }
    
    return nextNumber.toString().padStart(6, '0');
  } catch (error) {
    console.error('Error generando número de factura:', error);
    return '000001';
  }
};

const createInvoice = async (req, res) => {
  try {
    const db = await getDb();
    const {
      clienteId,
      productos,
      subtotal,
      descuentoAplicado = 0,
      iva = 0,
      observaciones = '',
      metodoPago = 'Efectivo',
      diasVencimiento = 30
    } = req.body;

    // Validaciones obligatorias
    if (!clienteId || !productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({
        status: "Error",
        message: "clienteId y productos son obligatorios."
      });
    }

    // Verificar que el cliente existe
    const cliente = await db.collection('clientes').findOne({ _id: new ObjectId(clienteId) });
    if (!cliente) {
      return res.status(404).json({
        status: "Error",
        message: "Cliente no encontrado."
      });
    }

    // Verificar productos y stock
    let totalCalculado = 0;
    const detalleFactura = [];

    for (const item of productos) {
      const { code, cantidad, precioUnitario } = item;

      if (!code || !cantidad || !precioUnitario) {
        return res.status(400).json({
          status: "Error",
          message: "Cada producto debe tener code, cantidad y precioUnitario."
        });
      }

      // Verificar stock disponible
      const productoInventario = await db.collection('inventario').findOne({ code });
      if (!productoInventario) {
        return res.status(404).json({
          status: "Error",
          message: `Producto con código ${code} no encontrado en inventario.`
        });
      }

      if (productoInventario.stock < cantidad) {
        return res.status(409).json({
          status: "Error",
          message: `Stock insuficiente para el producto ${code}. Disponible: ${productoInventario.stock}`
        });
      }

      const subtotalItem = precioUnitario * cantidad;
      totalCalculado += subtotalItem;

      detalleFactura.push({
        code,
        nombre: productoInventario.name,
        categoria: productoInventario.category,
        cantidad,
        precioUnitario,
        subtotal: subtotalItem
      });
    }

    // Aplicar descuento personalizado del cliente si existe
    let descuentoFinal = descuentoAplicado;
    if (cliente.descuentoPersonalizado > 0) {
      descuentoFinal = Math.max(descuentoAplicado, cliente.descuentoPersonalizado);
    }

    // Calcular totales
    const subtotalFinal = totalCalculado;
    const descuentoTotal = (subtotalFinal * descuentoFinal) / 100;
    const subtotalConDescuento = subtotalFinal - descuentoTotal;
    const ivaTotal = (subtotalConDescuento * iva) / 100;
    const totalFinal = subtotalConDescuento + ivaTotal;

    // Generar número de factura
    const numeroFactura = await generateInvoiceNumber(db);

    // Calcular fechas
    const fechaEmision = new Date();
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaEmision.getDate() + diasVencimiento);

    const factura = {
      numeroFactura,
      clienteId: new ObjectId(clienteId),
      cliente: {
        id: cliente._id,
        nombre: cliente.nombre,
        tipoIdentificacion: cliente.tipoIdentificacion,
        numeroIdentificacion: cliente.numeroIdentificacion,
        email: cliente.email,
        telefono: cliente.telefono,
        ciudad: cliente.ciudad,
        ubicacionLocal: cliente.ubicacionLocal
      },
      productos: detalleFactura,
      subtotal: subtotalFinal,
      descuentoAplicado: descuentoFinal,
      descuentoTotal,
      iva,
      ivaTotal,
      total: totalFinal,
      estado: 'pendiente',
      metodoPago,
      observaciones,
      fechaEmision,
      fechaVencimiento,
      saldoPendiente: totalFinal,
      abonos: [],
      createdAt: new Date(),
      lastUpdate: new Date()
    };

    // Crear la factura
    await db.collection('facturas').insertOne(factura);

    // Actualizar stock de productos
    for (const item of productos) {
      await db.collection('inventario').updateOne(
        { code: item.code },
        { 
          $inc: { stock: -item.cantidad },
          $set: { lastUpdate: new Date() }
        }
      );
    }

    return res.status(201).json({
      status: "Success",
      message: "Factura creada correctamente.",
      data: {
        id: factura._id,
        numeroFactura: factura.numeroFactura,
        cliente: factura.cliente,
        total: factura.total,
        estado: factura.estado,
        fechaEmision: factura.fechaEmision,
        fechaVencimiento: factura.fechaVencimiento
      }
    });

  } catch (error) {
    console.error('Error al crear factura:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al crear la factura.",
      error: error.message
    });
  }
};

const getInvoices = async (req, res) => {
  try {
    const db = await getDb();
    const { 
      page = 1, 
      limit = 10, 
      estado = 'all', 
      clienteId = null,
      desde = null,
      hasta = null
    } = req.query;

    const query = {};

    // Filtro por estado
    if (estado && estado !== 'all') {
      query.estado = estado;
    }

    // Filtro por cliente
    if (clienteId) {
      query.clienteId = new ObjectId(clienteId);
    }

    // Filtro por fechas
    if (desde || hasta) {
      query.fechaEmision = {};
      if (desde) query.fechaEmision.$gte = new Date(desde);
      if (hasta) query.fechaEmision.$lte = new Date(hasta);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const facturas = await db.collection('facturas')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await db.collection('facturas').countDocuments(query);

    const formattedInvoices = facturas.map(factura => ({
      id: factura._id,
      numeroFactura: factura.numeroFactura,
      cliente: factura.cliente,
      total: factura.total,
      saldoPendiente: factura.saldoPendiente,
      estado: factura.estado,
      metodoPago: factura.metodoPago,
      fechaEmision: factura.fechaEmision,
      fechaVencimiento: factura.fechaVencimiento,
      observaciones: factura.observaciones
    }));

    return res.status(200).json({
      status: "Success",
      message: "Facturas obtenidas correctamente.",
      data: {
        facturas: formattedInvoices,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener facturas:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al obtener las facturas.",
      error: error.message
    });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: "Error",
        message: "ID de la factura es requerido."
      });
    }

    // Validar formato de ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        status: "Error",
        message: "ID de factura inválido"
      });
    }

    const factura = await db.collection('facturas').findOne({ _id: new ObjectId(id) });

    if (!factura) {
      return res.status(404).json({
        status: "Error",
        message: "Factura no encontrada."
      });
    }

    return res.status(200).json({
      status: "Success",
      message: "Factura obtenida correctamente.",
      data: factura
    });

  } catch (error) {
    console.error('Error al obtener factura:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al obtener la factura.",
      error: error.message
    });
  }
};

const updateInvoiceStatus = async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { estado, observaciones } = req.body;

    if (!id) {
      return res.status(400).json({
        status: "Error",
        message: "ID de la factura es requerido."
      });
    }

    const estadosValidos = ['pendiente', 'pagada', 'parcialmente_pagada', 'vencida', 'cancelada'];
    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({
        status: "Error",
        message: "Estado inválido. Debe ser: pendiente, pagada, parcialmente_pagada, vencida, cancelada"
      });
    }

    const factura = await db.collection('facturas').findOne({ _id: new ObjectId(id) });
    if (!factura) {
      return res.status(404).json({
        status: "Error",
        message: "Factura no encontrada."
      });
    }

    const updateFields = {
      estado,
      lastUpdate: new Date()
    };

    if (observaciones) {
      updateFields.observaciones = observaciones;
    }

    await db.collection('facturas').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    const updatedInvoice = await db.collection('facturas').findOne({ _id: new ObjectId(id) });

    return res.status(200).json({
      status: "Success",
      message: "Estado de factura actualizado correctamente.",
      data: {
        id: updatedInvoice._id,
        numeroFactura: updatedInvoice.numeroFactura,
        estado: updatedInvoice.estado,
        observaciones: updatedInvoice.observaciones
      }
    });

  } catch (error) {
    console.error('Error al actualizar estado de factura:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al actualizar la factura.",
      error: error.message
    });
  }
};

const getInvoicesByClient = async (req, res) => {
  try {
    const db = await getDb();
    const { clienteId } = req.params;
    const { estado = 'all' } = req.query;

    if (!clienteId) {
      return res.status(400).json({
        status: "Error",
        message: "ID del cliente es requerido."
      });
    }

    const query = { clienteId: new ObjectId(clienteId) };

    if (estado !== 'all') {
      query.estado = estado;
    }

    const facturas = await db.collection('facturas')
      .find(query)
      .sort({ fechaEmision: -1 })
      .toArray();

    const formattedInvoices = facturas.map(factura => ({
      id: factura._id,
      numeroFactura: factura.numeroFactura,
      total: factura.total,
      saldoPendiente: factura.saldoPendiente,
      estado: factura.estado,
      fechaEmision: factura.fechaEmision,
      fechaVencimiento: factura.fechaVencimiento,
      diasVencido: factura.estado === 'vencida' ? 
        Math.ceil((new Date() - factura.fechaVencimiento) / (1000 * 60 * 60 * 24)) : 0
    }));

    return res.status(200).json({
      status: "Success",
      message: "Facturas del cliente obtenidas correctamente.",
      data: formattedInvoices
    });

  } catch (error) {
    console.error('Error al obtener facturas del cliente:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al obtener las facturas del cliente.",
      error: error.message
    });
  }
};

/*---------------------------------SISTEMA_DE_ABONOS--------------------------------------------------------------*/

const createPayment = async (req, res) => {
  try {
    const db = await getDb();
    const {
      facturaId,
      montoAbono,
      metodoPago,
      observaciones = '',
      usuarioRegistra
    } = req.body;

    // Validaciones obligatorias
    if (!facturaId || !montoAbono || !metodoPago) {
      return res.status(400).json({
        status: "Error",
        message: "facturaId, montoAbono y metodoPago son obligatorios."
      });
    }

    // Validar formato de ObjectId
    if (!isValidObjectId(facturaId)) {
      return res.status(400).json({
        status: "Error",
        message: "ID de factura inválido"
      });
    }

    if (montoAbono <= 0) {
      return res.status(400).json({
        status: "Error",
        message: "El monto del abono debe ser mayor a 0."
      });
    }

    // Verificar que la factura existe
    const factura = await db.collection('facturas').findOne({ _id: new ObjectId(facturaId) });
    if (!factura) {
      return res.status(404).json({
        status: "Error",
        message: "Factura no encontrada."
      });
    }

    // Verificar que la factura no esté pagada o cancelada
    if (factura.estado === 'pagada') {
      return res.status(400).json({
        status: "Error",
        message: "Esta factura ya está completamente pagada."
      });
    }

    if (factura.estado === 'cancelada') {
      return res.status(400).json({
        status: "Error",
        message: "No se pueden registrar abonos en facturas canceladas."
      });
    }

    // Verificar que el abono no exceda el saldo pendiente
    if (montoAbono > factura.saldoPendiente) {
      return res.status(400).json({
        status: "Error",
        message: `El abono no puede exceder el saldo pendiente de $${factura.saldoPendiente}.`
      });
    }

    // Crear el abono
    const abono = {
      facturaId: new ObjectId(facturaId),
      clienteId: factura.clienteId,
      montoAbono: Number(montoAbono),
      metodoPago,
      observaciones,
      usuarioRegistra: usuarioRegistra || 'Sistema',
      fechaAbono: new Date(),
      createdAt: new Date()
    };

    // Insertar el abono
    await db.collection('abonos').insertOne(abono);

    // Calcular nuevo saldo pendiente
    const nuevoSaldoPendiente = factura.saldoPendiente - montoAbono;
    
    // Determinar nuevo estado de la factura
    let nuevoEstado = factura.estado;
    if (nuevoSaldoPendiente === 0) {
      nuevoEstado = 'pagada';
    } else if (nuevoSaldoPendiente < factura.total) {
      nuevoEstado = 'parcialmente_pagada';
    }

    // Actualizar la factura
    await db.collection('facturas').updateOne(
      { _id: new ObjectId(facturaId) },
      {
        $set: {
          saldoPendiente: nuevoSaldoPendiente,
          estado: nuevoEstado,
          lastUpdate: new Date()
        },
        $push: { abonos: abono }
      }
    );

    return res.status(201).json({
      status: "Success",
      message: "Abono registrado correctamente.",
      data: {
        id: abono._id,
        facturaId: abono.facturaId,
        montoAbono: abono.montoAbono,
        saldoAnterior: factura.saldoPendiente,
        saldoNuevo: nuevoSaldoPendiente,
        estadoFactura: nuevoEstado,
        fechaAbono: abono.fechaAbono
      }
    });

  } catch (error) {
    console.error('Error al registrar abono:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al registrar el abono.",
      error: error.message
    });
  }
};

const getPaymentsByInvoice = async (req, res) => {
  try {
    const db = await getDb();
    const { facturaId } = req.params;

    if (!facturaId) {
      return res.status(400).json({
        status: "Error",
        message: "ID de la factura es requerido."
      });
    }

    // Validar formato de ObjectId
    if (!isValidObjectId(facturaId)) {
      return res.status(400).json({
        status: "Error",
        message: "ID de factura inválido"
      });
    }

    const abonos = await db.collection('abonos')
      .find({ facturaId: new ObjectId(facturaId) })
      .sort({ fechaAbono: -1 })
      .toArray();

    const formattedPayments = abonos.map(abono => ({
      id: abono._id,
      montoAbono: abono.montoAbono,
      metodoPago: abono.metodoPago,
      observaciones: abono.observaciones,
      usuarioRegistra: abono.usuarioRegistra,
      fechaAbono: abono.fechaAbono
    }));

    return res.status(200).json({
      status: "Success",
      message: "Abonos obtenidos correctamente.",
      data: formattedPayments
    });

  } catch (error) {
    console.error('Error al obtener abonos:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al obtener los abonos.",
      error: error.message
    });
  }
};

const getPaymentsByClient = async (req, res) => {
  try {
    const db = await getDb();
    const { clienteId } = req.params;
    const { desde = null, hasta = null } = req.query;

    if (!clienteId) {
      return res.status(400).json({
        status: "Error",
        message: "ID del cliente es requerido."
      });
    }

    const query = { clienteId: new ObjectId(clienteId) };

    // Filtro por fechas
    if (desde || hasta) {
      query.fechaAbono = {};
      if (desde) query.fechaAbono.$gte = new Date(desde);
      if (hasta) query.fechaAbono.$lte = new Date(hasta);
    }

    const abonos = await db.collection('abonos')
      .find(query)
      .sort({ fechaAbono: -1 })
      .toArray();

    const formattedPayments = abonos.map(abono => ({
      id: abono._id,
      facturaId: abono.facturaId,
      montoAbono: abono.montoAbono,
      metodoPago: abono.metodoPago,
      observaciones: abono.observaciones,
      usuarioRegistra: abono.usuarioRegistra,
      fechaAbono: abono.fechaAbono
    }));

    return res.status(200).json({
      status: "Success",
      message: "Abonos del cliente obtenidos correctamente.",
      data: formattedPayments
    });

  } catch (error) {
    console.error('Error al obtener abonos del cliente:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al obtener los abonos del cliente.",
      error: error.message
    });
  }
};

/*---------------------------------ESTADO_DE_CUENTA--------------------------------------------------------------*/

const getAccountStatus = async (req, res) => {
  try {
    const db = await getDb();
    const { clienteId } = req.params;

    if (!clienteId) {
      return res.status(400).json({
        status: "Error",
        message: "ID del cliente es requerido."
      });
    }

    // Obtener información del cliente
    const cliente = await db.collection('clientes').findOne({ _id: new ObjectId(clienteId) });
    if (!cliente) {
      return res.status(404).json({
        status: "Error",
        message: "Cliente no encontrado."
      });
    }

    // Obtener todas las facturas del cliente
    const facturas = await db.collection('facturas')
      .find({ clienteId: new ObjectId(clienteId) })
      .sort({ fechaEmision: -1 })
      .toArray();

    // Obtener todos los abonos del cliente
    const abonos = await db.collection('abonos')
      .find({ clienteId: new ObjectId(clienteId) })
      .sort({ fechaAbono: -1 })
      .toArray();

    // Calcular resumen
    const totalFacturado = facturas.reduce((sum, f) => sum + f.total, 0);
    const totalAbonado = abonos.reduce((sum, a) => sum + a.montoAbono, 0);
    const saldoPendiente = totalFacturado - totalAbonado;

    // Clasificar facturas por estado
    const facturasPendientes = facturas.filter(f => f.estado === 'pendiente');
    const facturasParciales = facturas.filter(f => f.estado === 'parcialmente_pagada');
    const facturasPagadas = facturas.filter(f => f.estado === 'pagada');
    const facturasVencidas = facturas.filter(f => f.estado === 'vencida');

    // Calcular días de vencimiento promedio
    const facturasConVencimiento = facturas.filter(f => f.estado !== 'pagada' && f.estado !== 'cancelada');
    const diasVencimientoPromedio = facturasConVencimiento.length > 0 
      ? facturasConVencimiento.reduce((sum, f) => {
          const dias = Math.ceil((new Date() - f.fechaVencimiento) / (1000 * 60 * 60 * 24));
          return sum + Math.max(0, dias);
        }, 0) / facturasConVencimiento.length
      : 0;

    const resumen = {
      cliente: {
        id: cliente._id,
        nombre: cliente.nombre,
        tipoIdentificacion: cliente.tipoIdentificacion,
        numeroIdentificacion: cliente.numeroIdentificacion,
        email: cliente.email,
        telefono: cliente.telefono,
        ciudad: cliente.ciudad
      },
      resumenFinanciero: {
        totalFacturado,
        totalAbonado,
        saldoPendiente,
        facturasPendientes: facturasPendientes.length,
        facturasParciales: facturasParciales.length,
        facturasPagadas: facturasPagadas.length,
        facturasVencidas: facturasVencidas.length,
        diasVencimientoPromedio: Math.round(diasVencimientoPromedio)
      },
      facturas: facturas.map(f => ({
        id: f._id,
        numeroFactura: f.numeroFactura,
        total: f.total,
        saldoPendiente: f.saldoPendiente,
        estado: f.estado,
        fechaEmision: f.fechaEmision,
        fechaVencimiento: f.fechaVencimiento,
        diasVencido: f.estado === 'vencida' ? 
          Math.ceil((new Date() - f.fechaVencimiento) / (1000 * 60 * 60 * 24)) : 0
      })),
      abonos: abonos.map(a => ({
        id: a._id,
        facturaId: a.facturaId,
        montoAbono: a.montoAbono,
        metodoPago: a.metodoPago,
        fechaAbono: a.fechaAbono,
        observaciones: a.observaciones
      }))
    };

    return res.status(200).json({
      status: "Success",
      message: "Estado de cuenta obtenido correctamente.",
      data: resumen
    });

  } catch (error) {
    console.error('Error al obtener estado de cuenta:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al obtener el estado de cuenta.",
      error: error.message
    });
  }
};

/*---------------------------------REPORTES_DE_CARTERA--------------------------------------------------------------*/

const getPortfolioReport = async (req, res) => {
  try {
    const db = await getDb();
    const { 
      desde = null, 
      hasta = null, 
      estado = 'all',
      diasVencimiento = 0,
      format = 'json'
    } = req.query;

    const query = {};

    // Filtro por fechas de emisión
    if (desde || hasta) {
      query.fechaEmision = {};
      if (desde) query.fechaEmision.$gte = new Date(desde);
      if (hasta) query.fechaEmision.$lte = new Date(hasta);
    }

    // Filtro por estado
    if (estado !== 'all') {
      query.estado = estado;
    }

    // Obtener facturas
    const facturas = await db.collection('facturas')
      .find(query)
      .sort({ fechaEmision: -1 })
      .toArray();

    // Filtrar por días de vencimiento si se especifica
    let facturasFiltradas = facturas;
    if (diasVencimiento > 0) {
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - diasVencimiento);
      
      facturasFiltradas = facturas.filter(f => {
        const diasVencido = Math.ceil((new Date() - f.fechaVencimiento) / (1000 * 60 * 60 * 24));
        return diasVencido >= diasVencimiento;
      });
    }

    // Agrupar por cliente
    const carteraPorCliente = {};
    
    for (const factura of facturasFiltradas) {
      const clienteId = factura.clienteId.toString();
      
      if (!carteraPorCliente[clienteId]) {
        carteraPorCliente[clienteId] = {
          cliente: factura.cliente,
          facturas: [],
          totalFacturado: 0,
          totalAbonado: 0,
          saldoPendiente: 0,
          facturasPendientes: 0,
          facturasVencidas: 0,
          diasVencimientoPromedio: 0
        };
      }

      carteraPorCliente[clienteId].facturas.push({
        id: factura._id,
        numeroFactura: factura.numeroFactura,
        total: factura.total,
        saldoPendiente: factura.saldoPendiente,
        estado: factura.estado,
        fechaEmision: factura.fechaEmision,
        fechaVencimiento: factura.fechaVencimiento,
        diasVencido: factura.estado === 'vencida' ? 
          Math.ceil((new Date() - factura.fechaVencimiento) / (1000 * 60 * 60 * 24)) : 0
      });

      carteraPorCliente[clienteId].totalFacturado += factura.total;
      carteraPorCliente[clienteId].totalAbonado += (factura.total - factura.saldoPendiente);
      carteraPorCliente[clienteId].saldoPendiente += factura.saldoPendiente;
      
      if (factura.estado === 'pendiente' || factura.estado === 'parcialmente_pagada') {
        carteraPorCliente[clienteId].facturasPendientes++;
      }
      
      if (factura.estado === 'vencida') {
        carteraPorCliente[clienteId].facturasVencidas++;
      }
    }

    // Calcular días de vencimiento promedio por cliente
    Object.values(carteraPorCliente).forEach(cliente => {
      const facturasConVencimiento = cliente.facturas.filter(f => 
        f.estado !== 'pagada' && f.estado !== 'cancelada'
      );
      
      if (facturasConVencimiento.length > 0) {
        const diasPromedio = facturasConVencimiento.reduce((sum, f) => {
          const dias = Math.ceil((new Date() - f.fechaVencimiento) / (1000 * 60 * 60 * 24));
          return sum + Math.max(0, dias);
        }, 0) / facturasConVencimiento.length;
        
        cliente.diasVencimientoPromedio = Math.round(diasPromedio);
      }
    });

    // Convertir a array y ordenar por saldo pendiente
    const carteraArray = Object.values(carteraPorCliente)
      .sort((a, b) => b.saldoPendiente - a.saldoPendiente);

    // Calcular totales generales
    const totalesGenerales = {
      totalFacturado: carteraArray.reduce((sum, c) => sum + c.totalFacturado, 0),
      totalAbonado: carteraArray.reduce((sum, c) => sum + c.totalAbonado, 0),
      saldoPendiente: carteraArray.reduce((sum, c) => sum + c.saldoPendiente, 0),
      totalClientes: carteraArray.length,
      clientesConSaldo: carteraArray.filter(c => c.saldoPendiente > 0).length,
      clientesMorosos: carteraArray.filter(c => c.facturasVencidas > 0).length
    };

    const reporte = {
      filtros: {
        desde,
        hasta,
        estado,
        diasVencimiento: Number(diasVencimiento)
      },
      totalesGenerales,
      cartera: carteraArray
    };

    if (format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte-cartera.pdf');
      doc.pipe(res);

      doc.fontSize(18).text('Reporte de Cartera', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12).text(`Período: ${desde || 'Inicio'} - ${hasta || 'Actual'}`);
      doc.text(`Total Facturado: $${totalesGenerales.totalFacturado.toLocaleString()}`);
      doc.text(`Total Abonado: $${totalesGenerales.totalAbonado.toLocaleString()}`);
      doc.text(`Saldo Pendiente: $${totalesGenerales.saldoPendiente.toLocaleString()}`);
      doc.text(`Clientes con Saldo: ${totalesGenerales.clientesConSaldo}`);
      doc.text(`Clientes Morosos: ${totalesGenerales.clientesMorosos}`);
      doc.moveDown();

      carteraArray.forEach((cliente, index) => {
        if (index > 0) doc.addPage();
        
        doc.fontSize(14).text(`${cliente.cliente.nombre}`, { underline: true });
        doc.fontSize(10).text(`Documento: ${cliente.cliente.tipoIdentificacion} ${cliente.cliente.numeroIdentificacion}`);
        doc.text(`Email: ${cliente.cliente.email}`);
        doc.text(`Teléfono: ${cliente.cliente.telefono}`);
        doc.moveDown();
        
        doc.text(`Total Facturado: $${cliente.totalFacturado.toLocaleString()}`);
        doc.text(`Total Abonado: $${cliente.totalAbonado.toLocaleString()}`);
        doc.text(`Saldo Pendiente: $${cliente.saldoPendiente.toLocaleString()}`);
        doc.text(`Facturas Pendientes: ${cliente.facturasPendientes}`);
        doc.text(`Facturas Vencidas: ${cliente.facturasVencidas}`);
        doc.text(`Días Vencimiento Promedio: ${cliente.diasVencimientoPromedio}`);
        doc.moveDown();
      });

      doc.end();
    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Cartera');

      worksheet.columns = [
        { header: 'Cliente', key: 'cliente', width: 30 },
        { header: 'Documento', key: 'documento', width: 20 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Teléfono', key: 'telefono', width: 15 },
        { header: 'Total Facturado', key: 'totalFacturado', width: 15 },
        { header: 'Total Abonado', key: 'totalAbonado', width: 15 },
        { header: 'Saldo Pendiente', key: 'saldoPendiente', width: 15 },
        { header: 'Facturas Pendientes', key: 'facturasPendientes', width: 15 },
        { header: 'Facturas Vencidas', key: 'facturasVencidas', width: 15 },
        { header: 'Días Vencimiento Promedio', key: 'diasVencimientoPromedio', width: 20 }
      ];

      carteraArray.forEach(cliente => {
        worksheet.addRow({
          cliente: cliente.cliente.nombre,
          documento: `${cliente.cliente.tipoIdentificacion} ${cliente.cliente.numeroIdentificacion}`,
          email: cliente.cliente.email,
          telefono: cliente.cliente.telefono,
          totalFacturado: cliente.totalFacturado,
          totalAbonado: cliente.totalAbonado,
          saldoPendiente: cliente.saldoPendiente,
          facturasPendientes: cliente.facturasPendientes,
          facturasVencidas: cliente.facturasVencidas,
          diasVencimientoPromedio: cliente.diasVencimientoPromedio
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte-cartera.xlsx');
      await workbook.xlsx.write(res);
      res.end();
    } else {
      return res.status(200).json({
        status: "Success",
        message: "Reporte de cartera generado correctamente.",
        data: reporte
      });
    }

  } catch (error) {
    console.error('Error al generar reporte de cartera:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al generar el reporte de cartera.",
      error: error.message
    });
  }
};

const getOverdueInvoices = async (req, res) => {
  try {
    const db = await getDb();
    const { diasVencimiento = 0 } = req.query;

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasVencimiento);

    const facturasVencidas = await db.collection('facturas')
      .find({
        estado: { $in: ['pendiente', 'parcialmente_pagada'] },
        fechaVencimiento: { $lt: fechaLimite }
      })
      .sort({ fechaVencimiento: 1 })
      .toArray();

    const facturasConDiasVencido = facturasVencidas.map(factura => {
      const diasVencido = Math.ceil((new Date() - factura.fechaVencimiento) / (1000 * 60 * 60 * 24));
      return {
        id: factura._id,
        numeroFactura: factura.numeroFactura,
        cliente: factura.cliente,
        total: factura.total,
        saldoPendiente: factura.saldoPendiente,
        fechaEmision: factura.fechaEmision,
        fechaVencimiento: factura.fechaVencimiento,
        diasVencido,
        estado: factura.estado
      };
    });

    // Agrupar por cliente
    const morososPorCliente = {};
    facturasConDiasVencido.forEach(factura => {
      const clienteId = factura.clienteId.toString();
      if (!morososPorCliente[clienteId]) {
        morososPorCliente[clienteId] = {
          cliente: factura.cliente,
          facturas: [],
          totalSaldo: 0,
          diasVencimientoMaximo: 0
        };
      }
      
      morososPorCliente[clienteId].facturas.push(factura);
      morososPorCliente[clienteId].totalSaldo += factura.saldoPendiente;
      morososPorCliente[clienteId].diasVencimientoMaximo = Math.max(
        morososPorCliente[clienteId].diasVencimientoMaximo,
        factura.diasVencido
      );
    });

    const morososArray = Object.values(morososPorCliente)
      .sort((a, b) => b.totalSaldo - a.totalSaldo);

    const totales = {
      totalFacturasVencidas: facturasConDiasVencido.length,
      totalSaldoVencido: facturasConDiasVencido.reduce((sum, f) => sum + f.saldoPendiente, 0),
      totalClientesMorosos: morososArray.length,
      promedioDiasVencido: facturasConDiasVencido.length > 0 
        ? Math.round(facturasConDiasVencido.reduce((sum, f) => sum + f.diasVencido, 0) / facturasConDiasVencido.length)
        : 0
    };

    return res.status(200).json({
      status: "Success",
      message: "Facturas vencidas obtenidas correctamente.",
      data: {
        filtros: { diasVencimiento: Number(diasVencimiento) },
        totales,
        morosos: morososArray
      }
    });

  } catch (error) {
    console.error('Error al obtener facturas vencidas:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al obtener las facturas vencidas.",
      error: error.message
    });
  }
};

const getPaymentAnalysis = async (req, res) => {
  try {
    const db = await getDb();
    const { 
      desde = null, 
      hasta = null,
      metodoPago = 'all',
      format = 'json'
    } = req.query;

    const query = {};

    // Filtro por fechas
    if (desde || hasta) {
      query.fechaAbono = {};
      if (desde) query.fechaAbono.$gte = new Date(desde);
      if (hasta) query.fechaAbono.$lte = new Date(hasta);
    }

    // Filtro por método de pago
    if (metodoPago !== 'all') {
      query.metodoPago = metodoPago;
    }

    const abonos = await db.collection('abonos')
      .find(query)
      .sort({ fechaAbono: -1 })
      .toArray();

    // Análisis por método de pago
    const analisisPorMetodo = {};
    abonos.forEach(abono => {
      if (!analisisPorMetodo[abono.metodoPago]) {
        analisisPorMetodo[abono.metodoPago] = {
          cantidad: 0,
          total: 0,
          promedio: 0
        };
      }
      analisisPorMetodo[abono.metodoPago].cantidad++;
      analisisPorMetodo[abono.metodoPago].total += abono.montoAbono;
    });

    // Calcular promedios
    Object.keys(analisisPorMetodo).forEach(metodo => {
      const data = analisisPorMetodo[metodo];
      data.promedio = data.total / data.cantidad;
    });

    // Análisis por día de la semana
    const analisisPorDia = {};
    abonos.forEach(abono => {
      const dia = new Date(abono.fechaAbono).toLocaleDateString('es-CO', { weekday: 'long' });
      if (!analisisPorDia[dia]) {
        analisisPorDia[dia] = { cantidad: 0, total: 0 };
      }
      analisisPorDia[dia].cantidad++;
      analisisPorDia[dia].total += abono.montoAbono;
    });

    // Análisis por mes
    const analisisPorMes = {};
    abonos.forEach(abono => {
      const mes = new Date(abono.fechaAbono).toLocaleDateString('es-CO', { year: 'numeric', month: 'long' });
      if (!analisisPorMes[mes]) {
        analisisPorMes[mes] = { cantidad: 0, total: 0 };
      }
      analisisPorMes[mes].cantidad++;
      analisisPorMes[mes].total += abono.montoAbono;
    });

    // Top clientes que más pagan
    const pagosPorCliente = {};
    abonos.forEach(abono => {
      const clienteId = abono.clienteId.toString();
      if (!pagosPorCliente[clienteId]) {
        pagosPorCliente[clienteId] = {
          cantidad: 0,
          total: 0,
          cliente: null
        };
      }
      pagosPorCliente[clienteId].cantidad++;
      pagosPorCliente[clienteId].total += abono.montoAbono;
    });

    // Obtener información de clientes
    for (const clienteId of Object.keys(pagosPorCliente)) {
      const cliente = await db.collection('clientes').findOne({ _id: new ObjectId(clienteId) });
      if (cliente) {
        pagosPorCliente[clienteId].cliente = {
          nombre: cliente.nombre,
          email: cliente.email,
          telefono: cliente.telefono
        };
      }
    }

    const topClientes = Object.values(pagosPorCliente)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const totales = {
      totalAbonos: abonos.length,
      totalRecaudado: abonos.reduce((sum, a) => sum + a.montoAbono, 0),
      promedioAbono: abonos.length > 0 
        ? abonos.reduce((sum, a) => sum + a.montoAbono, 0) / abonos.length 
        : 0,
      metodosPagoUtilizados: Object.keys(analisisPorMetodo).length
    };

    const analisis = {
      filtros: { desde, hasta, metodoPago },
      totales,
      analisisPorMetodo,
      analisisPorDia,
      analisisPorMes,
      topClientes
    };

    if (format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=analisis-pagos.pdf');
      doc.pipe(res);

      doc.fontSize(18).text('Análisis de Pagos', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12).text(`Período: ${desde || 'Inicio'} - ${hasta || 'Actual'}`);
      doc.text(`Total Abonos: ${totales.totalAbonos}`);
      doc.text(`Total Recaudado: $${totales.totalRecaudado.toLocaleString()}`);
      doc.text(`Promedio por Abono: $${totales.promedioAbono.toLocaleString()}`);
      doc.moveDown();

      doc.fontSize(14).text('Análisis por Método de Pago', { underline: true });
      Object.entries(analisisPorMetodo).forEach(([metodo, data]) => {
        doc.text(`${metodo}: ${data.cantidad} abonos - $${data.total.toLocaleString()} (Promedio: $${data.promedio.toLocaleString()})`);
      });
      doc.moveDown();

      doc.fontSize(14).text('Top 10 Clientes', { underline: true });
      topClientes.forEach((cliente, index) => {
        doc.text(`${index + 1}. ${cliente.cliente?.nombre || 'Cliente no encontrado'}: $${cliente.total.toLocaleString()} (${cliente.cantidad} abonos)`);
      });

      doc.end();
    } else if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      
      // Hoja de resumen
      const resumenSheet = workbook.addWorksheet('Resumen');
      resumenSheet.addRow(['Métrica', 'Valor']);
      resumenSheet.addRow(['Total Abonos', totales.totalAbonos]);
      resumenSheet.addRow(['Total Recaudado', totales.totalRecaudado]);
      resumenSheet.addRow(['Promedio por Abono', totales.promedioAbono]);
      resumenSheet.addRow(['Métodos de Pago Utilizados', totales.metodosPagoUtilizados]);

      // Hoja de análisis por método
      const metodoSheet = workbook.addWorksheet('Por Método de Pago');
      metodoSheet.columns = [
        { header: 'Método de Pago', key: 'metodo', width: 20 },
        { header: 'Cantidad', key: 'cantidad', width: 15 },
        { header: 'Total', key: 'total', width: 15 },
        { header: 'Promedio', key: 'promedio', width: 15 }
      ];
      Object.entries(analisisPorMetodo).forEach(([metodo, data]) => {
        metodoSheet.addRow({
          metodo,
          cantidad: data.cantidad,
          total: data.total,
          promedio: data.promedio
        });
      });

      // Hoja de top clientes
      const clientesSheet = workbook.addWorksheet('Top Clientes');
      clientesSheet.columns = [
        { header: 'Cliente', key: 'cliente', width: 30 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Teléfono', key: 'telefono', width: 15 },
        { header: 'Total Pagado', key: 'total', width: 15 },
        { header: 'Cantidad Abonos', key: 'cantidad', width: 15 }
      ];
      topClientes.forEach(cliente => {
        clientesSheet.addRow({
          cliente: cliente.cliente?.nombre || 'Cliente no encontrado',
          email: cliente.cliente?.email || '',
          telefono: cliente.cliente?.telefono || '',
          total: cliente.total,
          cantidad: cliente.cantidad
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=analisis-pagos.xlsx');
      await workbook.xlsx.write(res);
      res.end();
    } else {
      return res.status(200).json({
        status: "Success",
        message: "Análisis de pagos generado correctamente.",
        data: analisis
      });
    }

  } catch (error) {
    console.error('Error al generar análisis de pagos:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al generar el análisis de pagos.",
      error: error.message
    });
  }
};

// Función para confirmar abonos desde el panel admin
const confirmPayment = async (req, res) => {
  try {
    const db = await getDb();
    const {
      facturaId,
      numeroAbono, // Número del abono en el plan (1, 2, 3, etc.) o null para abono libre
      montoPagado,
      metodoPago,
      observaciones = '',
      usuarioConfirma,
      fechaPago = new Date()
    } = req.body;

    // Validaciones
    if (!facturaId || !montoPagado || !metodoPago) {
      return res.status(400).json({
        status: "Error",
        message: "facturaId, montoPagado y metodoPago son obligatorios."
      });
    }

    // Validar formato de ObjectId
    if (!isValidObjectId(facturaId)) {
      return res.status(400).json({
        status: "Error",
        message: "ID de factura inválido"
      });
    }

    if (montoPagado <= 0) {
      return res.status(400).json({
        status: "Error",
        message: "El monto pagado debe ser mayor a 0."
      });
    }

    // Buscar la factura
    const factura = await db.collection('facturas').findOne({ _id: new ObjectId(facturaId) });
    if (!factura) {
      return res.status(404).json({
        status: "Error",
        message: "Factura no encontrada."
      });
    }

    // Verificar que la factura no esté pagada o cancelada
    if (factura.estado === 'pagada') {
      return res.status(400).json({
        status: "Error",
        message: "Esta factura ya está completamente pagada."
      });
    }

    if (factura.estado === 'cancelada') {
      return res.status(400).json({
        status: "Error",
        message: "No se pueden confirmar abonos en facturas canceladas."
      });
    }

    // Verificar que el abono no exceda el saldo pendiente
    if (montoPagado > factura.saldoPendiente) {
      return res.status(400).json({
        status: "Error",
        message: `El abono no puede exceder el saldo pendiente de $${factura.saldoPendiente}.`
      });
    }

    // Buscar el abono en el plan (solo si existe plan de abonos y se especifica número)
    let abonoPlaneado = null;
    let abonoIndex = -1;
    
    if (numeroAbono && factura.planAbonos && factura.planAbonos.length > 0) {
      abonoIndex = factura.planAbonos.findIndex(abono => abono.numero === numeroAbono);
      if (abonoIndex === -1) {
        return res.status(404).json({
          status: "Error",
          message: "Abono no encontrado en el plan de pagos."
        });
      }
      
      abonoPlaneado = factura.planAbonos[abonoIndex];
      
      // Verificar si el abono ya está pagado
      if (abonoPlaneado.estado === 'pagado') {
        return res.status(400).json({
          status: "Error",
          message: "Este abono ya está marcado como pagado."
        });
      }
    }

    // Crear el registro del abono real
    const abonoReal = {
      facturaId: new ObjectId(facturaId),
      clienteId: factura.clienteId,
      numeroAbono: numeroAbono || (factura.abonos.length + 1),
      montoPlaneado: abonoPlaneado ? abonoPlaneado.monto : montoPagado,
      montoPagado: Number(montoPagado),
      diferencia: abonoPlaneado ? Number(montoPagado) - abonoPlaneado.monto : 0,
      metodoPago,
      observaciones,
      usuarioConfirma: usuarioConfirma || 'Sistema',
      fechaPago: new Date(fechaPago),
      fechaPlaneada: abonoPlaneado ? abonoPlaneado.fechaProgramada : new Date(),
      esAbonoLibre: !abonoPlaneado, // Indica si es un abono fuera del plan
      createdAt: new Date()
    };

    // Insertar el abono real
    await db.collection('abonos').insertOne(abonoReal);

    // Calcular nuevo saldo pendiente
    const nuevoSaldoPendiente = factura.saldoPendiente - Number(montoPagado);
    
    // Determinar nuevo estado de la factura
    let nuevoEstado = factura.estado;
    if (nuevoSaldoPendiente <= 0) {
      nuevoEstado = 'pagada';
    } else {
      // Verificar si hay abonos vencidos en el plan
      if (factura.planAbonos && factura.planAbonos.length > 0) {
        const abonosVencidos = factura.planAbonos.filter(abono => 
          abono.estado === 'pendiente' && new Date(abono.fechaProgramada) < new Date()
        );
        
        if (abonosVencidos.length > 0) {
          nuevoEstado = 'vencida';
        } else {
          nuevoEstado = 'parcialmente_pagada';
        }
      } else {
        // Sin plan de abonos, verificar vencimiento general
        if (new Date(factura.fechaVencimiento) < new Date()) {
          nuevoEstado = 'vencida';
        } else {
          nuevoEstado = 'parcialmente_pagada';
        }
      }
    }

    // Preparar actualización de factura
    const updateFields = {
      saldoPendiente: Math.max(0, nuevoSaldoPendiente),
      estado: nuevoEstado,
      lastUpdate: new Date()
    };

    // Si hay plan de abonos y se especificó número, actualizarlo
    if (factura.planAbonos && abonoIndex !== -1) {
      const planAbonosActualizado = [...factura.planAbonos];
      planAbonosActualizado[abonoIndex] = {
        ...abonoPlaneado,
        estado: 'pagado',
        fechaPago: new Date(fechaPago),
        montoPagado: Number(montoPagado),
        observaciones: observaciones
      };
      updateFields.planAbonos = planAbonosActualizado;
    }

    // Actualizar la factura
    await db.collection('facturas').updateOne(
      { _id: new ObjectId(facturaId) },
      {
        $set: updateFields,
        $push: { 
          abonos: {
            ...abonoReal,
            _id: abonoReal._id
          }
        }
      }
    );

    // Si la factura está completamente pagada, actualizar la venta relacionada
    if (nuevoEstado === 'pagada' && factura.ventaId) {
      await db.collection('ventas').updateOne(
        { _id: factura.ventaId },
        { $set: { estadoPago: 'pagado' } }
      );
    }

    return res.status(200).json({
      status: "Success",
      message: "Abono confirmado correctamente.",
      data: {
        abonoId: abonoReal._id,
        numeroAbono: abonoReal.numeroAbono,
        montoPagado: Number(montoPagado),
        diferencia: abonoReal.diferencia,
        saldoAnterior: factura.saldoPendiente,
        saldoNuevo: Math.max(0, nuevoSaldoPendiente),
        estadoFactura: nuevoEstado,
        fechaPago: abonoReal.fechaPago,
        esAbonoLibre: abonoReal.esAbonoLibre
      }
    });

  } catch (error) {
    console.error('Error al confirmar abono:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al confirmar el abono.",
      error: error.message
    });
  }
};

// Función para obtener dashboard de abonos pendientes
const getPaymentsDashboard = async (req, res) => {
  try {
    const db = await getDb();
    const { fecha = null } = req.query;

    const fechaConsulta = fecha ? new Date(fecha) : new Date();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Obtener todas las facturas pendientes
    const facturasPendientes = await db.collection('facturas')
      .find({ 
        estado: { $in: ['pendiente', 'parcialmente_pagada', 'vencida'] },
        saldoPendiente: { $gt: 0 }
      })
      .toArray();

    const abonosHoy = [];
    const abonosVencidos = [];
    const abonosProximos = [];
    const facturasSinPlan = [];

    // Procesar facturas
    facturasPendientes.forEach(factura => {
      // Si tiene plan de abonos, procesar cada abono
      if (factura.planAbonos && factura.planAbonos.length > 0) {
        factura.planAbonos.forEach(abono => {
          if (abono.estado === 'pendiente') {
            const fechaAbono = new Date(abono.fechaProgramada);
            const item = {
              facturaId: factura._id,
              numeroFactura: factura.numeroFactura,
              cliente: factura.cliente,
              numeroAbono: abono.numero,
              monto: abono.monto,
              fechaProgramada: abono.fechaProgramada,
              diasVencido: Math.ceil((hoy - fechaAbono) / (1000 * 60 * 60 * 24)),
              tieneVenta: !!factura.ventaId,
              tienePlan: true
            };

            // Clasificar abonos
            if (fechaAbono.toDateString() === hoy.toDateString()) {
              abonosHoy.push(item);
            } else if (fechaAbono < hoy) {
              abonosVencidos.push(item);
            } else {
              const diasHasta = Math.ceil((fechaAbono - hoy) / (1000 * 60 * 60 * 24));
              if (diasHasta <= 7) {
                abonosProximos.push({ ...item, diasHasta });
              }
            }
          }
        });
      } else {
        // Sin plan de abonos, usar fecha de vencimiento de la factura
        const fechaVencimiento = new Date(factura.fechaVencimiento);
        const item = {
          facturaId: factura._id,
          numeroFactura: factura.numeroFactura,
          cliente: factura.cliente,
          numeroAbono: null,
          monto: factura.saldoPendiente,
          fechaProgramada: factura.fechaVencimiento,
          diasVencido: Math.ceil((hoy - fechaVencimiento) / (1000 * 60 * 60 * 24)),
          tieneVenta: !!factura.ventaId,
          tienePlan: false
        };

        facturasSinPlan.push(item);

        if (fechaVencimiento < hoy) {
          abonosVencidos.push(item);
        } else if (fechaVencimiento.toDateString() === hoy.toDateString()) {
          abonosHoy.push(item);
        }
      }
    });

    // Calcular totales
    const totales = {
      abonosHoy: {
        cantidad: abonosHoy.length,
        monto: abonosHoy.reduce((sum, a) => sum + a.monto, 0)
      },
      abonosVencidos: {
        cantidad: abonosVencidos.length,
        monto: abonosVencidos.reduce((sum, a) => sum + a.monto, 0)
      },
      abonosProximos: {
        cantidad: abonosProximos.length,
        monto: abonosProximos.reduce((sum, a) => sum + a.monto, 0)
      },
      facturasConPlan: facturasPendientes.filter(f => f.planAbonos && f.planAbonos.length > 0).length,
      facturasSinPlan: facturasSinPlan.length,
      totalFacturasPendientes: facturasPendientes.length,
      montoTotalPendiente: facturasPendientes.reduce((sum, f) => sum + f.saldoPendiente, 0)
    };

    return res.status(200).json({
      status: "Success",
      message: "Dashboard de abonos obtenido correctamente.",
      data: {
        totales,
        abonosHoy,
        abonosVencidos: abonosVencidos.slice(0, 20),
        abonosProximos: abonosProximos.slice(0, 10),
        facturasSinPlan: facturasSinPlan.slice(0, 10),
        fechaConsulta: fechaConsulta
      }
    });

  } catch (error) {
    console.error('Error al obtener dashboard de abonos:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al obtener el dashboard.",
      error: error.message
    });
  }
};

// Función para editar abonos desde el panel admin
const editPaymentPlan = async (req, res) => {
  try {
    const db = await getDb();
    const { facturaId, abonos } = req.body;

    // Validaciones
    if (!facturaId || !abonos || !Array.isArray(abonos)) {
      return res.status(400).json({
        status: "Error",
        message: "facturaId y abonos son obligatorios."
      });
    }

    // Validar formato de ObjectId
    if (!isValidObjectId(facturaId)) {
      return res.status(400).json({
        status: "Error",
        message: "ID de factura inválido"
      });
    }

    // Buscar la factura
    const factura = await db.collection('facturas').findOne({ _id: new ObjectId(facturaId) });
    if (!factura) {
      return res.status(404).json({
        status: "Error",
        message: "Factura no encontrada."
      });
    }

    // Verificar que la factura no esté completamente pagada
    if (factura.estado === 'pagada') {
      return res.status(400).json({
        status: "Error",
        message: "No se pueden editar abonos de facturas completamente pagadas."
      });
    }

    // Procesar los abonos editados
    const abonosProcesados = abonos.map((abono, index) => {
      const abonoProcesado = {
        numero: abono.numero || index + 1,
        monto: Number(abono.monto) || 0,
        fechaProgramada: abono.fechaProgramada ? new Date(abono.fechaProgramada) : new Date(),
        estado: abono.estado || 'pendiente',
        observaciones: abono.observaciones || '',
        esFlexible: abono.esFlexible || false,
        // Mantener datos de pago si ya estaba pagado
        fechaPago: abono.fechaPago ? new Date(abono.fechaPago) : null,
        montoPagado: abono.montoPagado || 0
      };

      // Si el abono ya estaba pagado, mantener el estado
      if (abono.estado === 'pagado' && abono.fechaPago) {
        abonoProcesado.estado = 'pagado';
        abonoProcesado.montoPagado = abono.montoPagado || abono.monto;
      }

      return abonoProcesado;
    });

    // Calcular el total de los abonos
    const totalAbonos = abonosProcesados.reduce((sum, abono) => sum + abono.monto, 0);
    const diferencia = Math.abs(totalAbonos - factura.total);

    // Si hay diferencia significativa, ajustar el último abono
    if (diferencia > 0.01) {
      const ultimoAbono = abonosProcesados[abonosProcesados.length - 1];
      if (ultimoAbono && ultimoAbono.estado === 'pendiente') {
        ultimoAbono.monto += (factura.total - totalAbonos);
        ultimoAbono.monto = Math.round(ultimoAbono.monto * 100) / 100;
      }
    }

    // Actualizar la factura
    await db.collection('facturas').updateOne(
      { _id: new ObjectId(facturaId) },
      {
        $set: {
          planAbonos: abonosProcesados,
          lastUpdate: new Date()
        }
      }
    );

    return res.status(200).json({
      status: "Success",
      message: "Plan de abonos actualizado correctamente.",
      data: {
        facturaId: facturaId,
        abonos: abonosProcesados,
        totalAbonos: abonosProcesados.reduce((sum, abono) => sum + abono.monto, 0),
        totalFactura: factura.total,
        diferencia: factura.total - abonosProcesados.reduce((sum, abono) => sum + abono.monto, 0)
      }
    });

  } catch (error) {
    console.error('Error al editar plan de abonos:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al editar el plan de abonos.",
      error: error.message
    });
  }
};

// Función para obtener factura con plan de abonos y venta relacionada
const getInvoiceWithPaymentPlan = async (req, res) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: "Error",
        message: "ID de la factura es requerido."
      });
    }

    // Validar formato de ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        status: "Error",
        message: "ID de factura inválido"
      });
    }

    const factura = await db.collection('facturas').findOne({ _id: new ObjectId(id) });

    if (!factura) {
      return res.status(404).json({
        status: "Error",
        message: "Factura no encontrada."
      });
    }

    // Obtener la venta relacionada
    const venta = factura.ventaId ? 
      await db.collection('ventas').findOne({ _id: factura.ventaId }) : null;

    // Obtener abonos reales
    const abonosReales = await db.collection('abonos')
      .find({ facturaId: new ObjectId(id) })
      .sort({ fechaPago: -1 })
      .toArray();

    // Calcular estadísticas del plan de abonos
    const totalPagadoReales = abonosReales.reduce((sum, a) => sum + a.montoPagado, 0);
    const totalPagadoPlan = factura.planAbonos?.filter(a => a.estado === 'pagado').reduce((sum, a) => sum + (a.montoPagado || a.monto), 0) || 0;
    
    // Usar el mayor entre los abonos reales y los del plan
    const totalPagado = Math.max(totalPagadoReales, totalPagadoPlan);
    
    const estadisticasPlan = {
      totalAbonos: factura.planAbonos?.length || 0,
      abonosPagados: factura.planAbonos?.filter(a => a.estado === 'pagado').length || 0,
      abonosPendientes: factura.planAbonos?.filter(a => a.estado === 'pendiente').length || 0,
      abonosVencidos: factura.planAbonos?.filter(a => 
        a.estado === 'pendiente' && new Date(a.fechaProgramada) < new Date()
      ).length || 0,
      totalPlaneado: factura.planAbonos?.reduce((sum, a) => sum + a.monto, 0) || 0,
      totalPagado: totalPagado,
      diferenciaPagos: abonosReales.reduce((sum, a) => sum + (a.diferencia || 0), 0),
      abonosLibres: abonosReales.filter(a => a.esAbonoLibre).length,
      saldoPendiente: factura.total - totalPagado
    };

    return res.status(200).json({
      status: "Success",
      message: "Factura con plan de abonos obtenida correctamente.",
      data: {
        factura,
        venta,
        abonosReales,
        estadisticasPlan
      }
    });

  } catch (error) {
    console.error('Error al obtener factura con plan de abonos:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno al obtener la factura.",
      error: error.message
    });
  }
};

// ==================== FUNCIONES PARA SUGERENCIA DE ABONOS ====================

/**
 * Sugiere montos automáticamente para un plan de abonos
 */
const suggestPaymentAmounts = async (req, res) => {
  try {
    const { facturaId, numeroAbonos, abonosExistentes = [] } = req.body;

    if (!facturaId || !numeroAbonos) {
      return res.status(400).json({
        status: "Error",
        message: "facturaId y numeroAbonos son requeridos"
      });
    }

    // Validar formato de ObjectId
    if (!isValidObjectId(facturaId)) {
      return res.status(400).json({
        status: "Error",
        message: "ID de factura inválido"
      });
    }

    const db = await getDb();
    const factura = await db.collection('facturas').findOne({ _id: new ObjectId(facturaId) });
    
    if (!factura) {
      return res.status(404).json({
        status: "Error",
        message: "Factura no encontrada"
      });
    }

    // Calcular monto total disponible para distribuir
    const montoTotal = factura.total;
    
    // Filtrar solo abonos con monto > 0 (los que realmente están asignados)
    const abonosAsignados = abonosExistentes.filter(abono => Number(abono.monto) > 0);
    const montoAsignado = abonosAsignados.reduce((sum, abono) => sum + Number(abono.monto), 0);
    const montoDisponible = montoTotal - montoAsignado;
    const abonosRestantes = numeroAbonos - abonosAsignados.length;

    console.log('Debug sugerencias:', {
      facturaId,
      numeroAbonos,
      abonosExistentes: abonosExistentes.length,
      abonosAsignados: abonosAsignados.length,
      montoTotal,
      montoAsignado,
      montoDisponible,
      abonosRestantes
    });

    if (abonosRestantes <= 0) {
      return res.status(400).json({
        status: "Error",
        message: "No hay abonos restantes para sugerir",
        debug: {
          abonosExistentes: abonosExistentes.length,
          abonosAsignados: abonosAsignados.length,
          numeroAbonos,
          abonosRestantes
        }
      });
    }

    if (montoDisponible <= 0) {
      return res.status(400).json({
        status: "Error",
        message: "El monto total ya ha sido asignado a los abonos existentes"
      });
    }

    // Calcular monto base por abono
    const montoBase = Math.floor(montoDisponible / abonosRestantes);
    const residuo = montoDisponible - (montoBase * abonosRestantes);

    // Generar sugerencias
    const sugerencias = [];
    for (let i = 0; i < abonosRestantes; i++) {
      let monto = montoBase;
      
      // Agregar el residuo al último abono
      if (i === abonosRestantes - 1) {
        monto += residuo;
      }

      sugerencias.push({
        numero: abonosAsignados.length + i + 1,
        monto: monto,
        fechaProgramada: new Date(Date.now() + (i + 1) * 30 * 24 * 60 * 60 * 1000), // 30 días entre abonos
        estado: 'pendiente',
        observaciones: `Abono ${abonosAsignados.length + i + 1}`,
        esFlexible: true
      });
    }

    return res.status(200).json({
      status: "Success",
      message: "Sugerencias de montos generadas correctamente",
      data: {
        facturaId: facturaId,
        totalFactura: montoTotal,
        montoAsignado: montoAsignado,
        montoDisponible: montoDisponible,
        abonosExistentes: abonosExistentes.length,
        abonosAsignados: abonosAsignados.length,
        abonosRestantes: abonosRestantes,
        sugerencias: sugerencias,
        totalSugerido: sugerencias.reduce((sum, abono) => sum + abono.monto, 0),
        diferencia: montoDisponible - sugerencias.reduce((sum, abono) => sum + abono.monto, 0)
      }
    });

  } catch (error) {
    console.error('Error generando sugerencias de abonos:', error);
    return res.status(500).json({
      status: "Error",
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

// ==================== FUNCIONES PARA CÓDIGOS ALEATORIOS ====================

/**
 * Genera un código aleatorio de 6 dígitos que expira en 5 minutos
 * @param {string} userId - ID del usuario
 * @param {string} userType - Tipo de usuario ('trabajador' o 'admin')
 * @returns {Object} - Objeto con el código generado y su expiración
 */
const generateRandomCode = async (userId, userType) => {
    try {
        const db = await getDb();
        
        // Generar código aleatorio de 6 dígitos
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Calcular fecha de expiración (5 minutos desde ahora)
        const expirationTime = new Date(Date.now() + 5 * 60 * 1000);
        
        // Invalidar códigos anteriores del mismo usuario (marcar como usados)
        await db.collection('random_codes').updateMany(
            { 
                userId, 
                userType, 
                isUsed: false 
            },
            { 
                $set: { 
                    isUsed: true, 
                    usedAt: new Date(),
                    invalidatedBy: 'new_code_generated'
                } 
            }
        );
        
        // Crear documento del código
        const codeDocument = {
            code,
            userId,
            userType,
            createdAt: new Date(),
            expiresAt: expirationTime,
            isUsed: false,
            usedAt: null
        };
        
        // Guardar en la base de datos
        await db.collection('random_codes').insertOne(codeDocument);
        
        // Limpiar códigos expirados en segundo plano
        cleanupExpiredCodes();
        
        return {
            code,
            expiresAt: expirationTime,
            expiresIn: 5 * 60 * 1000 // 5 minutos en milisegundos
        };
        
    } catch (error) {
        console.error('Error generando código aleatorio:', error);
        throw error;
    }
};

/**
 * Valida un código aleatorio
 * @param {string} code - Código a validar
 * @param {string} userId - ID del usuario
 * @param {string} userType - Tipo de usuario
 * @returns {Object} - Resultado de la validación
 */
const validateRandomCode = async (code, userId, userType) => {
    try {
        const db = await getDb();
        
        // Buscar el código en la base de datos
        const codeDocument = await db.collection('random_codes').findOne({
            code,
            userId,
            userType,
            isUsed: false
        });
        
        if (!codeDocument) {
            return {
                valid: false,
                message: "Código inválido o ya utilizado"
            };
        }
        
        // Verificar si el código ha expirado
        const now = new Date();
        if (now > codeDocument.expiresAt) {
            // Marcar como usado para limpieza
            await db.collection('random_codes').updateOne(
                { _id: codeDocument._id },
                { $set: { isUsed: true, usedAt: now } }
            );
            
            return {
                valid: false,
                message: "Código expirado"
            };
        }
        
        // Marcar el código como usado
        await db.collection('random_codes').updateOne(
            { _id: codeDocument._id },
            { $set: { isUsed: true, usedAt: now } }
        );
        
        return {
            valid: true,
            message: "Código válido"
        };
        
    } catch (error) {
        console.error('Error validando código aleatorio:', error);
        throw error;
    }
};

/**
 * Limpia códigos expirados de la base de datos
 * Esta función se ejecuta automáticamente pero también puede ser llamada manualmente
 */
const cleanupExpiredCodes = async () => {
    try {
        const db = await getDb();
        const now = new Date();
        
        // Eliminar códigos expirados o usados
        const result = await db.collection('random_codes').deleteMany({
            $or: [
                { expiresAt: { $lt: now } },
                { isUsed: true }
            ]
        });
        
        console.log(`Códigos limpiados: ${result.deletedCount}`);
        
    } catch (error) {
        console.error('Error limpiando códigos expirados:', error);
    }
};

/**
 * Endpoint para generar código aleatorio después del login
 */
const generateCodeAfterLogin = async (req, res) => {
    const { userId, userType } = req.body;
    
    try {
        if (!userId || !userType) {
            return res.status(400).json({
                status: "Error",
                message: "userId y userType son requeridos"
            });
        }
        
        if (!['trabajador', 'admin'].includes(userType)) {
            return res.status(400).json({
                status: "Error",
                message: "userType debe ser 'trabajador' o 'admin'"
            });
        }
        
        const codeData = await generateRandomCode(userId, userType);
        
        res.status(200).json({
            status: "Success",
            message: "Código generado exitosamente",
            data: {
                code: codeData.code,
                expiresAt: codeData.expiresAt,
                expiresIn: codeData.expiresIn
            }
        });
        
    } catch (error) {
        console.error('Error en generateCodeAfterLogin:', error);
        res.status(500).json({
            status: "Error",
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

/**
 * Endpoint para validar código aleatorio
 */
const validateCodeEndpoint = async (req, res) => {
    const { code, userId, userType } = req.body;
    
    try {
        if (!code || !userId || !userType) {
            return res.status(400).json({
                status: "Error",
                message: "code, userId y userType son requeridos"
            });
        }
        
        const validation = await validateRandomCode(code, userId, userType);
        
        if (validation.valid) {
            res.status(200).json({
                status: "Success",
                message: validation.message
            });
        } else {
            res.status(400).json({
                status: "Error",
                message: validation.message
            });
        }
        
    } catch (error) {
        console.error('Error en validateCodeEndpoint:', error);
        res.status(500).json({
            status: "Error",
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

/**
 * Envía código OTP por email usando webhook de N8N
 * @param {string} email - Email del destinatario
 * @param {string} code - Código OTP
 * @param {string} userName - Nombre del usuario
 * @param {string} userType - Tipo de usuario
 * @returns {Object} - Resultado del envío
 */
const sendOTPByEmail = async (email, code, userName, userType) => {
    try {
        const webhookUrl = process.env.N8N_WEBHOOK_URL_LOGIN;
        
        if (!webhookUrl) {
            console.error('N8N_WEBHOOK_URL_LOGIN no está configurado en las variables de entorno');
            return {
                success: false,
                message: "Configuración de webhook N8N no encontrada",
                error: "N8N_WEBHOOK_URL no está definido en .env"
            };
        }
        
        const payload = {
            email: email,
            code: code,
            userName: userName,
            userType: userType,
            expiresIn: 5, // 5 minutos
            timestamp: new Date().toISOString()
        };

        console.log('Enviando OTP a webhook N8N:', webhookUrl);
        console.log('Payload enviado:', JSON.stringify(payload, null, 2));

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            timeout: 10000 // 10 segundos de timeout
        });

        console.log('Respuesta del webhook N8N:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
            throw new Error(`Error del webhook N8N: ${response.status} ${response.statusText}`);
        }

        // Verificar si hay contenido en la respuesta
        const responseText = await response.text();
        
        if (!responseText || responseText.trim() === '') {
            console.warn('Webhook N8N devolvió respuesta vacía, asumiendo éxito');
            return {
                success: true,
                message: "Código OTP enviado por email exitosamente",
                n8nResponse: { message: "Respuesta vacía del webhook" }
            };
        }

        // Intentar parsear como JSON
        let result;
        try {
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.warn('Webhook N8N devolvió respuesta no JSON válida:', responseText);
            return {
                success: true,
                message: "Código OTP enviado por email exitosamente",
                n8nResponse: { 
                    message: "Respuesta no JSON del webhook",
                    rawResponse: responseText.substring(0, 200) // Primeros 200 caracteres
                }
            };
        }
        
        return {
            success: true,
            message: "Código OTP enviado por email exitosamente",
            n8nResponse: result
        };

    } catch (error) {
        console.error('Error enviando OTP por email:', error);
        return {
            success: false,
            message: "Error enviando código por email",
            error: error.message
        };
    }
};

/**
 * Genera código OTP y lo envía por email
 * @param {string} userId - ID del usuario
 * @param {string} userType - Tipo de usuario
 * @param {string} email - Email del usuario
 * @param {string} userName - Nombre del usuario
 * @returns {Object} - Resultado de la operación
 */
const generateAndSendOTP = async (userId, userType, email, userName) => {
    try {
        // Generar el código
        const codeData = await generateRandomCode(userId, userType);
        
        // Enviar por email
        const emailResult = await sendOTPByEmail(email, codeData.code, userName, userType);
        
        if (emailResult.success) {
            return {
                success: true,
                message: "Código OTP generado y enviado por email",
                codeData: {
                    code: codeData.code,
                    expiresAt: codeData.expiresAt,
                    expiresIn: codeData.expiresIn
                },
                emailSent: true
            };
        } else {
            return {
                success: false,
                message: "Código generado pero error enviando email",
                codeData: {
                    code: codeData.code,
                    expiresAt: codeData.expiresAt,
                    expiresIn: codeData.expiresIn
                },
                emailSent: false,
                emailError: emailResult.message
            };
        }
        
    } catch (error) {
        console.error('Error en generateAndSendOTP:', error);
        return {
            success: false,
            message: "Error generando y enviando OTP",
            error: error.message
        };
    }
};

/**
 * Endpoint para generar y enviar código OTP por email
 */
const generateAndSendOTPEndpoint = async (req, res) => {
    const { userId, userType, email, userName } = req.body;
    
    try {
        if (!userId || !userType || !email || !userName) {
            return res.status(400).json({
                status: "Error",
                message: "userId, userType, email y userName son requeridos"
            });
        }
        
        if (!['trabajador', 'admin'].includes(userType)) {
            return res.status(400).json({
                status: "Error",
                message: "userType debe ser 'trabajador' o 'admin'"
            });
        }
        
        const result = await generateAndSendOTP(userId, userType, email, userName);
        
        if (result.success) {
            res.status(200).json({
                status: "Success",
                message: result.message,
                data: result.codeData,
                emailSent: result.emailSent
            });
        } else {
            res.status(500).json({
                status: "Error",
                message: result.message,
                error: result.error || result.emailError
            });
        }
        
    } catch (error) {
        console.error('Error en generateAndSendOTPEndpoint:', error);
        res.status(500).json({
            status: "Error",
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

/**
 * Verifica código OTP y completa el login
 */
const verifyOTPAndCompleteLogin = async (req, res) => {
    const { code, userId, userType } = req.body;
    
    try {
        if (!code || !userId || !userType) {
            return res.status(400).json({
                status: "Error",
                message: "code, userId y userType son requeridos"
            });
        }
        
        if (!['trabajador', 'admin'].includes(userType)) {
            return res.status(400).json({
                status: "Error",
                message: "userType debe ser 'trabajador' o 'admin'"
            });
        }
        
        // Validar el código
        const validation = await validateRandomCode(code, userId, userType);
        
        if (!validation.valid) {
            return res.status(400).json({
                status: "Error",
                message: validation.message
            });
        }
        
        // Obtener información del usuario
        const db = await getDb();
        let userInfo = null;
        
        if (userType === 'trabajador') {
            // Buscar primero en trabajadores, luego en usuarios
            userInfo = await db.collection('trabajadores').findOne({ _id: new ObjectId(userId) });
            if (!userInfo) {
                userInfo = await db.collection('usuarios').findOne({ _id: new ObjectId(userId) });
            }
        } else if (userType === 'admin') {
            // Buscar primero en administradores, luego en usuarios
            userInfo = await db.collection('administradores').findOne({ _id: new ObjectId(userId) });
            if (!userInfo) {
                userInfo = await db.collection('usuarios').findOne({ _id: new ObjectId(userId) });
            }
        }
        
        if (!userInfo) {
            return res.status(404).json({
                status: "Error",
                message: "Usuario no encontrado"
            });
        }
        
        // Login completado exitosamente
        res.status(200).json({
            status: "Success",
            message: "Código verificado correctamente. Login completado.",
            user: {
                id: userInfo._id,
                nombre: userInfo.name || userInfo.nombre,
                correo: userInfo.email || userInfo.correo,
                role: userType,
                loginCompleted: true
            }
        });
        
    } catch (error) {
        console.error('Error en verifyOTPAndCompleteLogin:', error);
        res.status(500).json({
            status: "Error",
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

/**
 * Reenvía código OTP por email
 */
const resendOTPCode = async (req, res) => {
    const { userId, userType } = req.body;
    
    try {
        if (!userId || !userType) {
            return res.status(400).json({
                status: "Error",
                message: "userId y userType son requeridos"
            });
        }
        
        if (!['trabajador', 'admin'].includes(userType)) {
            return res.status(400).json({
                status: "Error",
                message: "userType debe ser 'trabajador' o 'admin'"
            });
        }
        
        // Obtener información del usuario
        const db = await getDb();
        let userInfo = null;
        
        if (userType === 'trabajador') {
            // Buscar primero en trabajadores, luego en usuarios
            userInfo = await db.collection('trabajadores').findOne({ _id: new ObjectId(userId) });
            if (!userInfo) {
                userInfo = await db.collection('usuarios').findOne({ _id: new ObjectId(userId) });
            }
        } else if (userType === 'admin') {
            // Buscar primero en administradores, luego en usuarios
            userInfo = await db.collection('administradores').findOne({ _id: new ObjectId(userId) });
            if (!userInfo) {
                userInfo = await db.collection('usuarios').findOne({ _id: new ObjectId(userId) });
            }
        }
        
        if (!userInfo) {
            return res.status(404).json({
                status: "Error",
                message: "Usuario no encontrado"
            });
        }
        
        // Generar nuevo código y enviar por email
        const result = await generateAndSendOTP(
            userId, 
            userType, 
            userInfo.email || userInfo.correo, 
            userInfo.name || userInfo.nombre || (userType === 'admin' ? 'Administrador' : 'Usuario')
        );
        
        if (result.success) {
            res.status(200).json({
                status: "Success",
                message: "Nuevo código OTP enviado por email",
                emailSent: result.emailSent,
                email: userInfo.email || userInfo.correo,
                user: {
                    id: userInfo._id,
                    name: userInfo.name || userInfo.nombre,
                    email: userInfo.email || userInfo.correo,
                    role: userType
                }
            });
        } else {
            res.status(500).json({
                status: "Error",
                message: result.message,
                error: result.error || result.emailError,
                email: userInfo.email || userInfo.correo
            });
        }
        
    } catch (error) {
        console.error('Error en resendOTPCode:', error);
        res.status(500).json({
            status: "Error",
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

/**
 * Endpoint para probar la conectividad con N8N
 */
const testN8NWebhook = async (req, res) => {
    try {
        const webhookUrl = process.env.N8N_WEBHOOK_URL_LOGIN;
        
        if (!webhookUrl) {
            return res.status(400).json({
                status: "Error",
                message: "N8N_WEBHOOK_URL_LOGIN no está configurado"
            });
        }

        const testPayload = {
            email: "test@example.com",
            code: "123456",
            userName: "Usuario de Prueba",
            userType: "trabajador",
            expiresIn: 5,
            timestamp: new Date().toISOString(),
            test: true
        };

        console.log('Probando conectividad con N8N:', webhookUrl);
        console.log('Payload de prueba:', JSON.stringify(testPayload, null, 2));

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPayload),
            timeout: 10000
        });

        const responseText = await response.text();
        
        res.status(200).json({
            status: "Success",
            message: "Prueba de conectividad completada",
            webhookUrl,
            responseStatus: response.status,
            responseText: responseText.substring(0, 500), // Primeros 500 caracteres
            isJson: (() => {
                try {
                    JSON.parse(responseText);
                    return true;
                } catch {
                    return false;
                }
            })()
        });
        
    } catch (error) {
        console.error('Error probando N8N:', error);
        res.status(500).json({
            status: "Error",
            message: "Error probando conectividad con N8N",
            error: error.message
        });
    }
};

/**
 * Endpoint para limpiar códigos expirados manualmente
 */
const cleanupCodesEndpoint = async (req, res) => {
    try {
        await cleanupExpiredCodes();
        
        res.status(200).json({
            status: "Success",
            message: "Códigos expirados limpiados exitosamente"
        });
        
    } catch (error) {
        console.error('Error en cleanupCodesEndpoint:', error);
        res.status(500).json({
            status: "Error",
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

module.exports = {
    registertrabajador,
    loginTrabajador,
    logoutTrabajador, 
    newProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    assignProductToInventory,
    getInventoryProducts,
    updateInventoryProduct,
    deleteInventoryProduct,
    getProductsWithStock,
    createSale,
    checkAndReserveSaleCode,
    releaseSaleCode,
    getLastRegisteredSaleCode,
    getAllSales,
    getReportsData,
    registeradmin,
    loginadmin,
    getSpecificDayReport,
    getDashboardData,
    getUsers,
    createUser,
    updateUser,
    loginUser,
    exportReportPDF,
    deleteUser,
    searchCustomersapi,
    createClient,
    getClients,
    getClientById,
    updateClient,
    deleteClient,
    searchClients,
    createInvoice,
    getInvoices,
    getInvoiceById,
    updateInvoiceStatus,
    getInvoicesByClient,
    createPayment,
    getPaymentsByInvoice,
    getPaymentsByClient,
    getAccountStatus,
    getPortfolioReport,
    getOverdueInvoices,
    getPaymentAnalysis,
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
    generateInvoicePDF,
    sendInvoiceByEmail,
    sendInvoiceToN8N,
    testN8NConnection,
    // NUEVAS FUNCIONES PARA GESTIÓN DE ABONOS
    confirmPayment,
    getPaymentsDashboard,
    getInvoiceWithPaymentPlan,
    editPaymentPlan,
    // FUNCIONES PARA CÓDIGOS ALEATORIOS
    generateRandomCode,
    validateRandomCode,
    cleanupExpiredCodes,
    generateCodeAfterLogin,
    validateCodeEndpoint,
    cleanupCodesEndpoint,
    // FUNCIONES PARA ENVÍO DE OTP POR EMAIL
    sendOTPByEmail,
    generateAndSendOTP,
    generateAndSendOTPEndpoint,
    // FUNCIONES PARA VERIFICACIÓN DE OTP
    verifyOTPAndCompleteLogin,
    resendOTPCode,
    // FUNCIONES DE DIAGNÓSTICO
    testN8NWebhook,
    // FUNCIONES PARA SUGERENCIA DE ABONOS
    suggestPaymentAmounts
    
};