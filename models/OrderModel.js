const pool = require('../db/conexion');

// Crear nueva orden
async function createOrder(orderData) {
    const {
        usuario_id,
        nombre_cliente,
        direccion,
        ciudad,
        codigo_postal,
        telefono,
        pais,
        metodo_pago,
        subtotal,
        impuestos,
        gastos_envio,
        cupon_descuento,
        total
    } = orderData;

    const [result] = await pool.query(`
        INSERT INTO ordenes (
            usuario_id, nombre_cliente, direccion, ciudad, codigo_postal, 
            telefono, pais, metodo_pago, subtotal, impuestos, gastos_envio, 
            cupon_descuento, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        usuario_id, nombre_cliente, direccion, ciudad, codigo_postal,
        telefono, pais, metodo_pago, subtotal, impuestos, gastos_envio,
        cupon_descuento, total
    ]);

    return result.insertId;
}

// Agregar detalles de la orden
async function addOrderDetails(ordenId, items) {
    const values = items.map(item => [
        ordenId,
        item.producto_id,
        item.nombre,
        item.cantidad,
        item.precio,
        item.subtotal
    ]);

    const [result] = await pool.query(`
        INSERT INTO detalles_orden (
            orden_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal
        ) VALUES ?
    `, [values]);

    return result.affectedRows;
}

// Registrar venta para estadísticas
async function registerSale(ordenId, categoria, monto) {
    const [result] = await pool.query(`
        INSERT INTO ventas (orden_id, categoria, monto) VALUES (?, ?, ?)
    `, [ordenId, categoria, monto]);
    
    return result.insertId;
}

// Obtener orden por ID con detalles
async function getOrderById(ordenId) {
    const [orden] = await pool.query(`
        SELECT * FROM ordenes WHERE id = ?
    `, [ordenId]);

    if (orden.length === 0) return null;

    const [detalles] = await pool.query(`
        SELECT * FROM detalles_orden WHERE orden_id = ?
    `, [ordenId]);

    return {
        ...orden[0],
        detalles
    };
}

// Obtener órdenes de un usuario
async function getOrdersByUserId(userId) {
    const [rows] = await pool.query(`
        SELECT * FROM ordenes WHERE usuario_id = ? ORDER BY fecha_orden DESC
    `, [userId]);
    return rows;
}

module.exports = {
    createOrder,
    addOrderDetails,
    registerSale,
    getOrderById,
    getOrdersByUserId
};