const express = require('express');
const dotenv = require('dotenv');
const router = express.Router();
const mongoose = require('mongoose');
const { registertrabajador, loginTrabajador,logoutTrabajador,newProduct,getProducts,updateProduct,deleteProduct,assignProductToInventory,getInventoryProducts,updateInventoryProduct,deleteInventoryProduct,getProductsWithStock,createSale,checkAndReserveSaleCode,releaseSaleCode,getLastRegisteredSaleCode,getAllSales,getReportsData,registeradmin,loginadmin,getSpecificDayReport,getDashboardData,getUsers,createUser,updateUser,loginUser,exportReportPDF,deleteUser,searchCustomersapi,createClient,getClients,getClientById,updateClient,deleteClient,searchClients,createInvoice,getInvoices,getInvoiceById,updateInvoiceStatus,getInvoicesByClient,createPayment,getPaymentsByInvoice,getPaymentsByClient,getAccountStatus,getPortfolioReport,getOverdueInvoices,getPaymentAnalysis,createCategory,getCategories,updateCategory,deleteCategory,generateInvoicePDF,sendInvoiceByEmail,sendInvoiceToN8N,testN8NConnection} =require('./controllers/papeleriaControllers');

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
   router.get('/invoice-pdf/:saleId', generateInvoicePDF);
   router.post('/send-invoice-email', sendInvoiceByEmail);
   router.post('/send-invoice-n8n', sendInvoiceToN8N);
   router.get('/test-n8n-connection', testN8NConnection);
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
   
   // Rutas de Clientes Mejoradas
   router.post('/clientes', createClient);
   router.get('/clientes', getClients);
   router.get('/clientes/:id', getClientById);
   router.put('/clientes/:id', updateClient);
   router.delete('/clientes/:id', deleteClient);
   router.get('/clientes/search', searchClients);
   
   // Rutas de Facturación
   router.post('/facturas', createInvoice);
   router.get('/facturas', getInvoices);
   router.get('/facturas/:id', getInvoiceById);
   router.put('/facturas/:id/estado', updateInvoiceStatus);
   router.get('/facturas/cliente/:clienteId', getInvoicesByClient);
   
   // Rutas de Abonos
   router.post('/abonos', createPayment);
   router.get('/abonos/factura/:facturaId', getPaymentsByInvoice);
   router.get('/abonos/cliente/:clienteId', getPaymentsByClient);
   
   // Rutas de Estado de Cuenta
   router.get('/estado-cuenta/:clienteId', getAccountStatus);
   
   // Rutas de Reportes de Cartera
   router.get('/reportes/cartera', getPortfolioReport);
   router.get('/reportes/facturas-vencidas', getOverdueInvoices);
   router.get('/reportes/analisis-pagos', getPaymentAnalysis);
   
   // Rutas de Categorías
   router.post('/categorias', createCategory);
   router.get('/categorias', getCategories);
   router.put('/categorias/:id', updateCategory);
   router.delete('/categorias/:id', deleteCategory);






  




module.exports = router;