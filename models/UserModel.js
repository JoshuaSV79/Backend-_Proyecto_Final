const pool = require('../db/conexion');

// Verificar si existe usuario por correo
async function getUserByCorreo(correo) {
    const [rows] = await pool.query(
        'SELECT id FROM usuarios WHERE correo = ?', 
        [correo]
    );
    return rows.length > 0 ? rows[0] : null;
}

// Marcar/desmarcar suscripción para un usuario por correo
async function setSuscritoByCorreo(correo, valor) {
    const [result] = await pool.query(
        'UPDATE usuarios SET suscrito = ? WHERE correo = ?',
        [valor ? 1 : 0, correo]
    );
    return result.affectedRows;
}

// Insertar nuevo usuario (con contraseña ya hasheada)
async function createUser(nombre, correo, contraseñaHash, pais) {
    const [result] = await pool.query(
        'INSERT INTO usuarios (nombre, correo, passwd, tipo, pais) VALUES (?, ?, ?, ?, ?)',
        [nombre, correo, contraseñaHash, "cliente", pais]
    );
    return result.insertId;
}

// Obtener usuario completo para login (incluye password hash)
async function getUserForLogin(nombre) {
    const [rows] = await pool.query(
        'SELECT id, nombre, passwd, tipo, correo FROM usuarios WHERE nombre = ?', 
        [nombre]
    );
    return rows.length > 0 ? rows[0] : null;
}

// Obtener usuario por ID (sin password)
async function getUserById(id) {
    const [rows] = await pool.query(
        'SELECT id, nombre, correo, tipo, pais FROM usuarios WHERE id = ?', 
        [id]
    );
    return rows.length > 0 ? rows[0] : null;
}

// Actualizar la contraseña de un usuario por id
async function updatePassword(id, contraseñaHash) {
    const [result] = await pool.query(
        'UPDATE usuarios SET passwd = ? WHERE id = ?',
        [contraseñaHash, id]
    );
    return result.affectedRows;
}

module.exports = {
    getUserByCorreo,
    createUser,
    getUserForLogin,
    getUserById,
    updatePassword
    , setSuscritoByCorreo
};