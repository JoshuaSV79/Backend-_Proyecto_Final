// utils/emailService.js (MODIFICADO - Ahora usa pdfBuffer)
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verificar conexión al servidor SMTP al iniciar (logs para depuración)
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP verify error:', error);
  } else {
    console.log('SMTP server is ready to take messages');
  }
});

async function enviarCorreoContacto(destino, nombre, mensaje) {
  const subject = `${process.env.EMPRESA_NOMBRE} - Confirmación de contacto`;
  const html = `<p>Hola ${nombre},</p>
    <p>Hemos recibido tu mensaje: <i>${mensaje}</i></p>
    <p>Pronto nos pondremos en contacto contigo.</p>
    <p><strong>${process.env.EMPRESA_NOMBRE}</strong><br/>${process.env.EMPRESA_LEMA}</p>`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: destino,
    subject,
    html
  });
}

async function enviarCorreoSuscripcion(destino, nombre, codigoCupon) {
  const subject = `${process.env.EMPRESA_NOMBRE} - ¡Bienvenido!`;
  const html = `<p>Hola ${nombre},</p>
    <p>¡Gracias por suscribirte a nuestro boletín! Aquí está tu cupón de descuento:</p>
    <h2>CÓDIGO: <strong>${codigoCupon}</strong></h2>
    <p>Úsalo en tu próxima compra para obtener un descuento especial.</p>
    <p>${process.env.EMPRESA_NOMBRE} - ${process.env.EMPRESA_LEMA}</p>`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: destino,
    subject,
    html
  });
}

// MODIFICACIÓN: Aceptar pdfBuffer en lugar de pdfPath
async function enviarCorreoCompra(destino, nombre, pdfBuffer, orderId) { 
  const subject = `${process.env.EMPRESA_NOMBRE} - Confirmación de Compra #${orderId}`;
  const html = `<p>Hola ${nombre},</p>
    <p>¡Gracias por tu compra! Adjuntamos la nota de tu orden con ID <strong>#${orderId}</strong>.</p>
    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
    <p>${process.env.EMPRESA_NOMBRE} - ${process.env.EMPRESA_LEMA}</p>`;

  const attachments = [];
  if (pdfBuffer) {
    attachments.push({
      filename: `nota_compra_${orderId}.pdf`,
      content: pdfBuffer, // <- Usar el Buffer directamente
      contentType: 'application/pdf'
    });
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: destino,
      subject,
      html,
      attachments
    });
    console.log(`Correo de compra enviado a ${destino}. messageId=${info.messageId || ''} attachments=${attachments.length}`);
    if (info.accepted) console.log('accepted:', info.accepted);
    if (info.rejected) console.log('rejected:', info.rejected);
    return info;
  } catch (err) {
    console.error('Error enviando correo de compra:', err);
    throw err;
  }
}

async function enviarCorreoReset(destino, nombre, resetToken) {
  const subject = `${process.env.EMPRESA_NOMBRE} - Recuperación de contraseña`;
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  const html = `<p>Hola ${nombre},</p>
    <p>Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
    <p><a href="${resetUrl}">Restablecer contraseña</a></p>
    <p>Si no solicitaste este cambio, ignora este correo.</p>
    <p>${process.env.EMPRESA_NOMBRE} - ${process.env.EMPRESA_LEMA}</p>`;

  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: destino,
    subject,
    html
  });
}

module.exports = {
  enviarCorreoContacto,
  enviarCorreoSuscripcion,
  enviarCorreoCompra,
  enviarCorreoReset
};