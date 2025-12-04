const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/jwt.middleware');
const PurchaseController = require('../controllers/compra.controller');

router.post('/process', verifyToken, PurchaseController.processPurchase);
router.post('/finalize', verifyToken, PurchaseController.finalizePurchase);

module.exports = router;
