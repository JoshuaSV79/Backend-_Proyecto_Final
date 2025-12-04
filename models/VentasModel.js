const pool = require('../db/conexion');

// Obtener ventas por categoría (para gráfica)
async function getSalesByCategory() {
    const [rows] = await pool.query(`
        SELECT 
            categoria,
            COUNT(*) as cantidad_ventas,
            SUM(monto) as total_ventas
        FROM ventas
        GROUP BY categoria
        ORDER BY total_ventas DESC
    `);
    return rows;
}

// Obtener total de ventas de la empresa
async function getTotalSales() {
    const [rows] = await pool.query(`
        SELECT 
            COUNT(*) as total_ordenes,
            SUM(total) as total_ventas,
            AVG(total) as promedio_venta
        FROM ordenes
    `);
    return rows[0];
}

// Obtener inventario por categoría
async function getInventoryByCategory() {
    const [rows] = await pool.query(`
        SELECT 
            cat as categoria,
            COUNT(*) as total_productos,
            SUM(stockAC) as stock_disponible,
            SUM(stockIN) as stock_inicial
        FROM productos
        GROUP BY cat
    `);
    return rows;
}

// Obtener reporte detallado de productos
async function getDetailedInventory() {
    const [rows] = await pool.query(`
        SELECT 
            id,
            nombre,
            cat as categoria,
            precio,
            stockAC as stock_actual,
            stockIN as stock_inicial,
            (stockIN - stockAC) as unidades_vendidas
        FROM productos
        ORDER BY cat, nombre
    `);
    return rows;
}

module.exports = {
    getSalesByCategory,
    getTotalSales,
    getInventoryByCategory,
    getDetailedInventory
};