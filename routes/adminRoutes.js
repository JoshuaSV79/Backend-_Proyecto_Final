const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, verifyAdmin } = require('../middleware/jwt.middleware');

// Configurar multer para guardar en public/images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "..", "images"));
    },
    filename: (req, file, cb) => {
        const nombreOriginal = Date.now() + "_" + file.originalname;
        cb(null, nombreOriginal);
    }
});
const upload = multer({ storage });

// Crear producto (admin)
router.post('/newProduct', verifyToken, verifyAdmin, adminController.createProduct);

// Subir imágenes para un producto
router.post('/newProduct/uploadImages', verifyToken, verifyAdmin, upload.array('imagenes', 10), adminController.upImages);

// Actualizar producto
router.put('/product/:id', verifyToken, verifyAdmin, adminController.updateProduct);

// Eliminar producto
router.delete('/product/:id', verifyToken, verifyAdmin, adminController.deleteProduct);

// Actualizar stock
router.put('/product/:id/stock', verifyToken, verifyAdmin, adminController.updateStock);

module.exports = router;