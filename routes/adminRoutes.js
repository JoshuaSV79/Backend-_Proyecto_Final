const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, verifyAdmin } = require('../middleware/jwt.middleware');

// Configurar multer para ALMACENAR EN MEMORIA (Requisito de Cloudinary)
const storage = multer.memoryStorage(); 
const upload = multer({ storage }); 

// Crear producto (admin)
router.post('/newProduct', verifyToken, verifyAdmin, adminController.createProduct);

// Subir imágenes para un producto
// El controlador 'upImages' ahora subirá el buffer a Cloudinary y guardará las URLs.
router.post(
    '/newProduct/uploadImages', 
    verifyToken, 
    verifyAdmin, 
    upload.array('imagenes', 10), // multer guarda en req.files
    adminController.upImages // Lógica de Cloudinary
);

// ... (otras rutas sin cambios)
router.put('/product/:id', verifyToken, verifyAdmin, adminController.updateProduct);
router.delete('/product/:id', verifyToken, verifyAdmin, adminController.deleteProduct);
router.put('/product/:id/stock', verifyToken, verifyAdmin, adminController.updateStock);

module.exports = router;