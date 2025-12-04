const pool = require('../db/conexion');

// Obtener carrito del usuario con detalles de productos
async function getCartByUserId(userId) {
    const [rows] = await pool.query(`
        SELECT 
            c.id,
            c.producto_id,
            c.cantidad,
            p.nombre,
            p.precio,
            p.stockAC,
            (c.cantidad * p.precio) as subtotal
        FROM carrito c
        INNER JOIN productos p ON c.producto_id = p.id
        WHERE c.usuario_id = ?
    `, [userId]);
    return rows;
}

// Agregar producto al carrito
async function addToCart(userId, productId, cantidad) {
    // Verificar si el producto ya está en el carrito
    const [existing] = await pool.query(
        'SELECT id, cantidad FROM carrito WHERE usuario_id = ? AND producto_id = ?',
        [userId, productId]
    );

    if (existing.length > 0) {
        // Si ya existe, actualizar cantidad
        const nuevaCantidad = existing[0].cantidad + cantidad;
        const [result] = await pool.query(
            'UPDATE carrito SET cantidad = ? WHERE id = ?',
            [nuevaCantidad, existing[0].id]
        );
        return result.affectedRows;
    } else {
        // Si no existe, insertar nuevo
        const [result] = await pool.query(
            'INSERT INTO carrito (usuario_id, producto_id, cantidad) VALUES (?, ?, ?)',
            [userId, productId, cantidad]
        );
        return result.insertId;
    }
}

// Actualizar cantidad de un producto en el carrito
async function updateCartQuantity(userId, productId, cantidad) {
    const [result] = await pool.query(
        'UPDATE carrito SET cantidad = ? WHERE usuario_id = ? AND producto_id = ?',
        [cantidad, userId, productId]
    );
    return result.affectedRows;
}

// Eliminar producto del carrito
async function removeFromCart(userId, productId) {
    const [result] = await pool.query(
        'DELETE FROM carrito WHERE usuario_id = ? AND producto_id = ?',
        [userId, productId]
    );
    return result.affectedRows;
}

// Vaciar carrito completo del usuario
async function clearCart(userId) {
    const [result] = await pool.query(
        'DELETE FROM carrito WHERE usuario_id = ?',
        [userId]
    );
    return result.affectedRows;
}

module.exports = {
    getCartByUserId,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart
};