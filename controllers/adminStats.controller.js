const VentasModel = require('../models/VentasModel');

exports.getSalesChart = async (req, res) => {
  try {
    const rows = await VentasModel.getSalesByCategory();
    res.json({ data: rows });
  } catch (error) {
    console.error('Error obteniendo ventas por categoría:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.getTotalSales = async (req, res) => {
  try {
    const totals = await VentasModel.getTotalSales();
    res.json({ data: totals });
  } catch (error) {
    console.error('Error obteniendo totales de ventas:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.getInventoryReport = async (req, res) => {
  try {
    const rows = await VentasModel.getInventoryByCategory();
    res.json({ data: rows });
  } catch (error) {
    console.error('Error obteniendo inventario por categoría:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};

exports.getDetailedInventory = async (req, res) => {
  try {
    const rows = await VentasModel.getDetailedInventory();
    res.json({ data: rows });
  } catch (error) {
    console.error('Error obteniendo inventario detallado:', error);
    res.status(500).json({ error: 'Error interno' });
  }
};
