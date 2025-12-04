const pool = require('../db/conexion');

// Crear token de reseteo
async function createToken(token, userId, expiresAt) {
  const [result] = await pool.query(
    'INSERT INTO password_resets (token, user_id, expires_at) VALUES (?, ?, ?)',
    [token, userId, expiresAt]
  );
  return result.insertId;
}

// Buscar por token
async function findByToken(token) {
  const [rows] = await pool.query(
    'SELECT id, token, user_id, expires_at, created_at FROM password_resets WHERE token = ? LIMIT 1',
    [token]
  );
  return rows.length > 0 ? rows[0] : null;
}

// Borrar token
async function deleteByToken(token) {
  const [result] = await pool.query(
    'DELETE FROM password_resets WHERE token = ?',
    [token]
  );
  return result.affectedRows;
}

// Borrar tokens antiguos de un usuario
async function deleteByUserId(userId) {
  const [result] = await pool.query(
    'DELETE FROM password_resets WHERE user_id = ?',
    [userId]
  );
  return result.affectedRows;
}

module.exports = {
  createToken,
  findByToken,
  deleteByToken,
  deleteByUserId
};
