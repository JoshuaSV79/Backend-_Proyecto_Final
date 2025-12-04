const mysql = require('mysql2/promise');

// 1. OBTENER el certificado CA de Aiven desde la variable de entorno
const caCert = process.env.DB_CA_CERT; 

// 2. Definir la configuración SSL
const sslConfig = caCert 
    ? {
        // Establecemos el certificado CA. Es la clave para que la cadena sea reconocida.
        ca: caCert, 
        // Mantenemos rejectUnauthorized en true para asegurar que la conexión es segura.
        rejectUnauthorized: true 
    } 
    : undefined; // Si no hay certificado (solo para entornos locales sin SSL), el objeto ssl será undefined

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    // ¡IMPORTANTE! El puerto 14521 es no estándar y debe especificarse.
    port: process.env.DB_PORT, 
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // 3. Usar la configuración SSL que incluye el certificado CA.
    ssl: sslConfig 
});

module.exports = pool;
