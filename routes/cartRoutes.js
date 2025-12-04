const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/jwt.middleware');
const CartController = require('../controllers/cart.controller');

router.get('/', verifyToken, CartController.getCart);
router.post('/add', verifyToken, CartController.addToCart);
router.put('/update', verifyToken, CartController.updateQuantity);
router.delete('/remove/:productId', verifyToken, CartController.removeFromCart);
router.delete('/clear', verifyToken, CartController.clearCart);
router.post('/coupon', verifyToken, CartController.applyCoupon);

module.exports = router;
