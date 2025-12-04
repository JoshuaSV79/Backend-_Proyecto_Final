const express = require('express');
const router = express.Router();
const { login, logout, checkCaptcha, createUser, forgotPassword, resetPassword } = require('../controllers/auth.controller');
// use jwt middleware
const { verifyToken } = require('../middleware/jwt.middleware');

router.post('/login', login);

router.post('/logout', verifyToken, logout);

router.post('/captcha', checkCaptcha);

router.post('/newUser', createUser);

// Recuperación de contraseña
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;