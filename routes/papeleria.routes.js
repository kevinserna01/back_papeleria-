const express = require('express');
const dotenv = require('dotenv');
const router = express.Router();
const mongoose = require('mongoose');
const { registertrabajador, loginTrabajador,logoutTrabajador,newProduct,getProducts,updateProduct,deleteProduct,assignProductToInventory,getInventoryProducts,updateInventoryProduct,deleteInventoryProduct,getProductsWithStock,createSale,checkAndReserveSaleCode,releaseSaleCode,getLastRegisteredSaleCode,getAllSales,getReportsData,registeradmin,loginadmin,getSpecificDayReport,getDashboardData,getUsers,createUser,updateUser,loginUser,exportReportPDF,deleteUser,searchCustomersapi} =require('./controllers/papeleriaControllers');

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
   router.post('/assignProductToInventoryapi',assignProductToInventory);
   router.get('/getInventoryProductsapi', getInventoryProducts);  
   router.put('/updateInventoryProductapi', updateInventoryProduct);
   router.delete('/deleteInventoryProductapi', deleteInventoryProduct);
   router.get('/getProductsWithStockapi', getProductsWithStock); 
   router.post('/createSaleapi', createSale);
   router.post('/checkAndReserveSaleCodeapi/:code', checkAndReserveSaleCode);
   router.post('/releaseSaleCodeapi/:code', releaseSaleCode);
   router.get('/getLastSaleCodeapi', getLastRegisteredSaleCode);
   router.get('/salesapi', getAllSales);
   router.get('/reportsapi', getReportsData);
   router.post('/registeradminapi', registeradmin);
   router.post('/loginadminapi', loginadmin);
   router.get('/reportsapi/day', getSpecificDayReport);
   router.get('/dashboardapi', getDashboardData);
   router.get('/getUsersapi', getUsers);
   router.post('/createUserapi', createUser);
   router.put('/updateUserapi/:id', updateUser);
   router.post('/loginUserapi', loginUser);
   router.post('/reportsapi/export', exportReportPDF);
   router.delete('/deleteUserapi/:id', deleteUser);
   router.get('/searchCustomersapi', searchCustomersapi);






  




module.exports = router;