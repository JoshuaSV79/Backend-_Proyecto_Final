const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/jwt.middleware');
const AdminStats = require('../controllers/adminStats.controller');

router.get('/sales-chart', verifyToken, verifyAdmin, AdminStats.getSalesChart);
router.get('/total-sales', verifyToken, verifyAdmin, AdminStats.getTotalSales);
router.get('/inventory', verifyToken, verifyAdmin, AdminStats.getInventoryReport);
router.get('/inventory/detailed', verifyToken, verifyAdmin, AdminStats.getDetailedInventory);

module.exports = router;
