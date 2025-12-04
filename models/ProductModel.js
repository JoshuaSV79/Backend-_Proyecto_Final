const pool = require('../db/conexion');

// Registrar producto nuevo
async function createProd(nombre, precio, descripcion, cat, stockIn) {
    const [result] = await pool.query(
        'INSERT INTO productos (nombre, precio, descripcion, cat, stockAC, stockIN) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, precio, descripcion, cat, stockIn, stockIn]
    );
    return result.insertId;
}

// Buscar salas
async function getProductosSalas() {
    const [rows] = await pool.query(
        'SELECT id, nombre, precio, stockAC FROM productos WHERE cat = "Salas"'
    );
    return rows;
}

// Buscar dormitorios
async function getProductosDormi() {
    // Aceptar 'Dormitorio' y 'Dormitorios' (singular/plural)
    const [rows] = await pool.query(
        "SELECT id, nombre, precio, stockAC FROM productos WHERE cat LIKE 'Dormit%'")
    ;
    return rows;
}

// Buscar comedores
async function getProductosCome() {
    // Aceptar 'Comedor' y 'Comedores'
    const [rows] = await pool.query(
        "SELECT id, nombre, precio, stockAC FROM productos WHERE cat LIKE 'Comed%'")
    ;
    return rows;
}

// Obtener producto completo por nombre
async function getProductByName(nombre) {
    const [rows] = await pool.query(
        'SELECT id, nombre, precio, descripcion, cat, stockAC, stockIN FROM productos WHERE nombre = ?',
        [nombre]
    );
    return rows[0];
}

// Obtener producto por ID
async function getProductById(id) {
    const [rows] = await pool.query(
        'SELECT id, nombre, precio, descripcion, cat, stockAC, stockIN FROM productos WHERE id = ?',
        [id]
    );
    return rows[0];
}

// Actualizar producto
async function updateProduct(id, nombre, precio, descripcion, cat, stockIN) {
    const [result] = await pool.query(
        'UPDATE productos SET nombre = ?, precio = ?, descripcion = ?, cat = ?, stockIN = ?, stockAC = ? WHERE id = ?',
        [nombre, precio, descripcion, cat, stockIN, stockIN, id]
    );
    return result.affectedRows;
}

// Eliminar producto
async function deleteProduct(id) {
    const [result] = await pool.query('DELETE FROM productos WHERE id = ?', [id]);
    return result.affectedRows;
}

// Actualizar stock actual
async function updateStock(id, cantidadVendida) {
    const [result] = await pool.query(
        'UPDATE productos SET stockAC = stockAC - ? WHERE id = ? AND stockAC >= ?',
        [cantidadVendida, id, cantidadVendida]
    );
    return result.affectedRows;
}

// Verificar disponibilidad
async function checkAvailability(id, cantidad) {
    const [rows] = await pool.query(
        'SELECT stockAC FROM productos WHERE id = ?',
        [id]
    );
    if (rows.length === 0) return false;
    return rows[0].stockAC >= cantidad;
}

// Obtener todos los productos
async function getAllProducts() {
    const [rows] = await pool.query(
        'SELECT id, nombre, precio, descripcion, cat, stockAC FROM productos'
    );
    return rows;
}

module.exports = {
    createProd,
    getProductosSalas,
    getProductosDormi,
    getProductosCome,
    getProductByName,
    getProductById,
    updateProduct,
    deleteProduct,
    updateStock,
    checkAvailability,
    getAllProducts
};