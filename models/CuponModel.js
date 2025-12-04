const pool = require('../db/conexion');

// Validar cupón
async function validateCoupon(codigo) {
    const [rows] = await pool.query(`
        SELECT id, codigo, descuento_porcentaje, activo
        FROM cupones
        WHERE codigo = ? AND activo = TRUE
    `, [codigo]);

    return rows.length > 0 ? rows[0] : null;
}

// Crear nuevo cupón
async function createCoupon(codigo, descuento) {
    const [result] = await pool.query(`
        INSERT INTO cupones (codigo, descuento_porcentaje, activo)
        VALUES (?, ?, TRUE)
    `, [codigo, descuento]);

    return result.insertId;
}

// Desactivar cupón
async function deactivateCoupon(codigo) {
    const [result] = await pool.query(`
        UPDATE cupones SET activo = FALSE WHERE codigo = ?
    `, [codigo]);

    return result.affectedRows;
}

// Eliminar cupón (uso único)
async function deleteCoupon(codigo) {
    const [result] = await pool.query(`
        DELETE FROM cupones WHERE codigo = ?
    `, [codigo]);

    return result.affectedRows;
}

// Obtener todos los cupones
async function getAllCoupons() {
    const [rows] = await pool.query(`
        SELECT * FROM cupones ORDER BY fecha_creacion DESC
    `);
    return rows;
}

module.exports = {
    validateCoupon,
    createCoupon,
    deactivateCoupon,
    deleteCoupon,
    getAllCoupons
};