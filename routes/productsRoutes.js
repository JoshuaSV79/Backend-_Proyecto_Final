const express = require('express');
const router = express.Router();
const { getImagenesPorProducto, getProductosSalas, getProductosDormi, getProductosCome, getProduct, getAllProducts } = require("../controllers/products.controller");

router.get("/salas", getProductosSalas);

router.get("/dormitorios", getProductosDormi);

router.get("/comedores", getProductosCome);

// Obtener todos los productos
router.get('/all', getAllProducts);

router.get("/producto/:prod", getProduct);

router.get("/:id/images", getImagenesPorProducto);

 
module.exports = router;