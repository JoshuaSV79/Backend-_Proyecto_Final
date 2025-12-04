const { enviarCorreoContacto } = require('../utils/emailService');

exports.sendContactMessage = async (req, res) => {
  try {
    const { nombre, correo, mensaje } = req.body;
    if (!nombre || !correo || !mensaje) {
      return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }

    // Enviar confirmación al usuario
    await enviarCorreoContacto(correo, nombre, mensaje);

    res.json({ mensaje: 'Mensaje recibido. Se envió confirmación por correo.' });
  } catch (error) {
    console.error('Error en sendContactMessage:', error);
    res.status(500).json({ error: 'Error enviando correo de contacto' });
  }
};
