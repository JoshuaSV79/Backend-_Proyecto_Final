const express = require('express');
const router = express.Router();
const CouponController = require('../controllers/coupon.controller');

router.get('/:code', CouponController.getCouponByCode);

module.exports = router;
