const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/subscription.controller');

router.post('/subscribe', SubscriptionController.subscribe);

module.exports = router;
