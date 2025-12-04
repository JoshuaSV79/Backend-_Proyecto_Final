// server.js (MODIFICADO)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const prodRoutes = require('./routes/productsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const path = require('path');
const pool = require('./db/conexion');
const app = express();
const PORT = process.env.PORT || 3000;

// ELIMINAR O COMENTAR la línea que sirve imágenes estáticas locales:
// app.use('/images', express.static(path.join(__dirname, 'images'))); // <-- ELIMINADA

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => { res.send('Ruta base funcionando correctamente'); });

// Rutas de autenticacion
app.use('/api/auth', authRoutes);

// Rutas principales
app.use('/api/products', prodRoutes);

// Rutas que usa el admin
app.use('/api/admin', adminRoutes);
// Rutas adicionales
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/purchase', require('./routes/purchaseRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/subscription', require('./routes/subscriptionRoutes'));
app.use('/api/admin/stats', require('./routes/adminStatsRoutes'));
// Rutas adicionales (cupones)
app.use('/api/coupons', require('./routes/couponsRoutes'));

async function testConnection() {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS result');
        console.log('✅ Conexión a la base de datos establecida. Resultado:', rows[0].result);
    } catch (error) {
        console.error('❌ Error al conectar con la base de datos:', error.message);
    }
}

app.listen(PORT, async () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
    await testConnection(); // <--------------------- se ejecuta al arrancar el servidor
});