const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'defaultdb',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_CA_CERT ? {
        rejectUnauthorized: true,
        ca: process.env.DB_CA_CERT.replace(/\\n/g, '\n')
    } : {
        rejectUnauthorized: false  // Solo para desarrollo local
    }
});

module.exports = pool;
