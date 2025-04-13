const CryptoJS = require('crypto-js');
const moment = require('moment-timezone'); 
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












  


module.exports = {
    registertrabajador,
    loginTrabajador,
    logoutTrabajador, 
    newProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    assignProductToInventory,
    getInventoryProducts
    
};