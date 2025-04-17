const CryptoJS = require('crypto-js');
const moment = require('moment-timezone');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const jwt = require('jsonwebtoken');
const { getDb }  = require('../../database/mongo'); 



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

        res.status(200).json({ status: "Éxito", message: "Inicio de sesión exitoso", logEntry });
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

    const { name, code, price = 0, category, description = '' } = req.body;

    if (!name || !code || !category) {
      return res.status(400).json({
        status: "Error",
        message: "Faltan campos obligatorios (name, code o category)."
      });
    }

    if (price < 0) {
      return res.status(400).json({
        status: "Error",
        message: "El precio no puede ser negativo."
      });
    }

    const existingProduct = await db.collection('productos').findOne({ code });
    if (existingProduct) {
      return res.status(409).json({
        status: "Error",
        message: "Ya existe un producto con ese código."
      });
    }

    const newProduct = {
      name,
      code,
      price,
      category,
      description,
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

    const { code, name, price, category, description } = req.body;

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

    const updatedFields = {
      ...(name && { name }),
      ...(price !== undefined && { price }),
      ...(category && { category }),
      ...(description && { description }),
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
        precio: p.price,
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

const createSale = async (req, res) => {
  try {
    const db = await getDb();
    const {
      code, // <- nuevo campo obligatorio
      productos, // array con code, cantidad
      metodoPago, // 'Efectivo', 'Nequi', 'Transferencia'
      cliente // opcional: { nombre, documento }
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

    if (!metodoPago || !['Efectivo', 'Nequi', 'Transferencia'].includes(metodoPago)) {
      return res.status(400).json({
        status: "Error",
        message: "Debe especificar un método de pago válido."
      });
    }

    const inventario = db.collection('inventario');
    const productosCol = db.collection('productos');
    const ventasCol = db.collection('ventas');

    // Verificar si ya existe una venta con ese código
    const ventaExistente = await ventasCol.findOne({ code });
    if (ventaExistente) {
      return res.status(409).json({
        status: "Error",
        message: "Ya existe una venta con ese código."
      });
    }

    let totalVenta = 0;
    const detalleVenta = [];

    for (const item of productos) {
      const { code: productCode, cantidad } = item;

      if (!productCode || cantidad <= 0) {
        return res.status(400).json({
          status: "Error",
          message: "Código de producto inválido o cantidad no válida."
        });
      }

      const prodInventario = await inventario.findOne({ code: productCode });
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

      const subtotal = prodInfo.price * cantidad;
      totalVenta += subtotal;

      detalleVenta.push({
        code: prodInfo.code,
        name: prodInfo.name,
        categoria: prodInfo.category,
        cantidad,
        precioUnitario: prodInfo.price,
        total: subtotal
      });

      await inventario.updateOne(
        { code: productCode },
        { $inc: { stock: -cantidad }, $set: { lastUpdate: new Date() } }
      );
    }

    // Obtener hora local de Colombia
    const horaColombia = moment().tz('America/Bogota').format('HH:mm:ss');

    const venta = {
      code,
      fecha: new Date(),
      hora: horaColombia,
      cliente: cliente || null,
      productos: detalleVenta,
      totalVenta,
      metodoPago,
      createdAt: new Date()
    };

    await ventasCol.insertOne(venta);

    res.status(201).json({
      status: "Success",
      message: "Venta registrada correctamente.",
      data: venta
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

    const { startDate, endDate, type, format, date } = req.query;

    if (!type) {
      return res.status(400).json({
        status: 'Error',
        message: 'El parámetro "type" es obligatorio.'
      });
    }

    // 📆 Si viene un día específico (consulta por día)
    let query = {};
    if (date) {
      const target = new Date(date);
      const nextDay = new Date(target);
      nextDay.setDate(nextDay.getDate() + 1);
      query.fecha = { $gte: target, $lt: nextDay };
    }

    // 📅 Si viene un rango de fechas
    else if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1); // para incluir todo el día final
      query.fecha = { $gte: start, $lt: end };
    } else {
      return res.status(400).json({
        status: 'Error',
        message: 'Debe proporcionar startDate y endDate o un date específico.'
      });
    }

    // Validar tipo
    if (!['ventas', 'total', 'top'].includes(type)) {
      return res.status(400).json({
        status: 'Error',
        message: 'El parámetro "type" debe ser uno de: ventas, total, top.'
      });
    }

    const ventas = await ventasCol.find(query).toArray();
    let report = [];

    if (type === 'ventas') {
      report = ventas.map(v => ({
        Código: v.code,
        Cliente: v.cliente?.nombre || 'Sin cliente',
        Total: v.totalVenta,
        Método: v.metodoPago,
        Fecha: moment(v.fecha).tz('America/Bogota').format('YYYY-MM-DD HH:mm:ss')
      }));
    } else if (type === 'total') {
      const totalVentas = ventas.reduce((sum, v) => sum + v.totalVenta, 0);
      report = [{ TotalVentas: totalVentas }];
    } else if (type === 'top') {
      const productosVendidos = {};
      ventas.forEach(v => {
        v.productos.forEach(p => {
          if (!productosVendidos[p.name]) {
            productosVendidos[p.name] = 0;
          }
          productosVendidos[p.name] += p.cantidad;
        });
      });
      report = Object.entries(productosVendidos)
        .map(([name, cantidad]) => ({ Producto: name, Cantidad: cantidad }))
        .sort((a, b) => b.Cantidad - a.Cantidad);
    }

    // Formatos: PDF, Excel, o JSON
    if (format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=report-${type}.pdf`);
      doc.pipe(res);
      doc.fontSize(18).text(`Reporte: ${type.toUpperCase()}`, { align: 'center' }).moveDown();
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
      res.setHeader('Content-Disposition', `attachment; filename=report-${type}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      res.status(200).json(report);
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



// Middleware para verificar el token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token no proporcionado' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido o expirado' });

    req.user = user;
    next();
  });
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

    // Generar token con el _id y el rol
    const token = jwt.sign(
      {
        adminId: admin._id,
        correo: admin.correo,
        role: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      status: "Success",
      message: "Login exitoso",
      token
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
    verifyToken,
    registeradmin,
    loginadmin
    
};