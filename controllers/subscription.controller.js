const CouponModel = require('../models/CuponModel');
const UserModel = require('../models/UserModel');
const { enviarCorreoSuscripcion } = require('../utils/emailService');

// POST /api/subscription/subscribe
exports.subscribe = async (req, res) => {
  try {
    const { nombre, correo } = req.body;
    if (!nombre || !correo) return res.status(400).json({ success: false, error: 'Faltan datos' });

    // Generar código de cupón sencillo
    const codigo = `WELCOME-${Date.now().toString().slice(-6)}`;

    await CouponModel.createCoupon(codigo, 10); // 10% por ejemplo

    // Si el usuario existe en la tabla usuarios, marcarlo como suscrito
    try {
      const usuario = await UserModel.getUserByCorreo(correo);
      if (usuario && usuario.id) {
        await UserModel.setSuscritoByCorreo(correo, true);
      }
    } catch (uErr) {
      console.error('Error actualizando campo suscrito del usuario:', uErr);
      // no abortar la suscripción por este fallo
    }

    await enviarCorreoSuscripcion(correo, nombre, codigo);

    res.status(201).json({ success: true, mensaje: 'Suscripción registrada. Cupón enviado por correo.', codigo });
  } catch (error) {
    console.error('Error en subscribe:', error);
    res.status(500).json({ success: false, error: 'Error en suscripción' });
  }
};
