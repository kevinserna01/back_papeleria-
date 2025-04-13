const express = require('express');
const dotenv = require('dotenv');
const router = express.Router();
const mongoose = require('mongoose');
const { registertrabajador, loginTrabajador,logoutTrabajador,newProduct,getProducts,updateProduct,deleteProduct,createInventoryProduct,assignProductToInventory} =require('./controllers/papeleriaControllers');

dotenv.config({ path: './config.env' });



mongoose.connect(process.env.MONGO_URI)
   .then(() => {
       console.log('Conexión exitosa a MongoDB');
   })
   .catch(err => {
       console.error('Error al conectar a MongoDB:', err);
   });
   
   router.post('/registertrabajador', registertrabajador);
   router.post('/logintrabajador', loginTrabajador);
   router.post('/logouttrabajador', logoutTrabajador);
   router.post('/newproductapi', newProduct);
   router.get('/getProductsapi', getProducts);  
   router.put('/updateProductapi', updateProduct);
   router.delete('/deleteProductapi', deleteProduct);
   router.post('/createInventoryProductapi',createInventoryProduct);
   router.post('/assignProductToInventoryapi',assignProductToInventory);



module.exports = router;