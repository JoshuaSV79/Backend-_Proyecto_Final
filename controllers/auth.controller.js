const bcrypt = require('bcryptjs');
const https = require('https');
const { generateToken } = require('../middleware/jwt.middleware');
const UserModel = require('../models/UserModel');
const { enviarCorreoReset } = require('../utils/emailService');
const crypto = require('crypto');
const PasswordResetModel = require('../models/PasswordResetModel');

// Mapa para control de intentos fallidos: { nombre: { intentos, bloqueadoHasta } }
const loginAttempts = new Map();

exports.login = async (req, res) => {
    const { nombre, password } = req.body;

    if (!nombre || !password) {
        return res.status(400).json({
            error: "Faltan campos obligatorios: 'nombre' y 'password'."
        });
    }

    // Verificar si la cuenta está bloqueada
    const attemptData = loginAttempts.get(nombre);
    if (attemptData && attemptData.bloqueadoHasta > Date.now()) {
        const minutosRestantes = Math.ceil((attemptData.bloqueadoHasta - Date.now()) / 60000);
        return res.status(403).json({ 
            error: "Cuenta bloqueada por intentos fallidos",
            mensaje: `Intenta nuevamente en ${minutosRestantes} minuto(s)`
        });
    }

    const user = await UserModel.getUserForLogin(nombre);

    if (!user) {
        registrarIntentoFallido(nombre);
        return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Verificar contraseña hasheada
    const passwordMatch = await bcrypt.compare(password, user.passwd);

    if (!passwordMatch) {
        registrarIntentoFallido(nombre);
        const intentos = loginAttempts.get(nombre)?.intentos || 0;
        if (intentos >= 3) {
            return res.status(403).json({ 
                error: "Cuenta bloqueada por 5 minutos debido a múltiples intentos fallidos"
            });
        }
        return res.status(401).json({ 
            error: "Credenciales inválidas",
            intentosRestantes: 3 - intentos
        });
    }

    // Login exitoso - limpiar intentos
    loginAttempts.delete(nombre);

    const token = generateToken(user.id, user.nombre, user.tipo);
    
    console.log(`[LOGIN] Usuario: ${nombre} | Tipo: ${user.tipo}`);

    return res.status(200).json({
        mensaje: "Acceso permitido",
        usuario: nombre,
        token: token,
        tipo: user.tipo
    });
};

function registrarIntentoFallido(nombre) {
    const data = loginAttempts.get(nombre) || { intentos: 0, bloqueadoHasta: 0 };
    data.intentos++;
    
    if (data.intentos >= 3) {
        // Bloquear por 5 minutos
        data.bloqueadoHasta = Date.now() + (5 * 60 * 1000);
        console.log(`[SEGURIDAD] Cuenta ${nombre} bloqueada por 5 minutos`);
    }
    
    loginAttempts.set(nombre, data);
}

exports.logout = (req, res) => {
    console.log(`[LOGOUT] Usuario: ${req.userNombre}`);
    return res.status(200).json({ mensaje: "Sesión cerrada correctamente" });
};

exports.createUser = async (req, res) => {
    try {
        const { nombre, correo, contra, pais } = req.body;

        if (!nombre || !correo || !contra || !pais) {
            return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
        }

        const existe = await UserModel.getUserByCorreo(correo);
        if (existe) {
            return res.status(409).json({ 
                mensaje: 'Ya existe una cuenta asociada al correo indicado' 
            });
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(contra, 10);
        
        const id_insertado = await UserModel.createUser(nombre, correo, hashedPassword, pais);
        
        res.status(201).json({ 
            mensaje: 'Usuario registrado exitosamente', 
            id_insertado 
        });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ mensaje: 'Error al registrar usuario' });
    }
};

exports.checkCaptcha = async (req, res) => {
    const token = req.body.recaptchaToken;

    if (!token) {
        return res.json({
            responseCode: 1,
            responseDesc: "Token de reCAPTCHA faltante."
        });
    }

    const secretKey = "6LfwEg8sAAAAAJi1stSneik-3Xl0ymHoXfWU_ulW";

    const verificationUrl = 
        `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

    https.get(verificationUrl, (googleRes) => {
        let body = "";
        googleRes.on("data", (chunk) => { body += chunk; });
        googleRes.on("end", () => {
            const googleResponse = JSON.parse(body);

            if (!googleResponse.success) {
                return res.json({
                    responseCode: 1,
                    responseDesc: "Falló la verificación del captcha"
                });
            }

            res.json({
                responseCode: 0,
                responseDesc: "Captcha correcto"
            });
        });
    });
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
    try {
        const { correo } = req.body;
        if (!correo) return res.status(400).json({ error: 'Correo requerido' });

        const usuario = await UserModel.getUserByCorreo(correo);
        if (!usuario) return res.status(404).json({ error: 'Correo no registrado' });

        const token = crypto.randomBytes(24).toString('hex');
                const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hora (ms since epoch)

                // Eliminar tokens previos del usuario y guardar el nuevo en BD
                await PasswordResetModel.deleteByUserId(usuario.id);
                await PasswordResetModel.createToken(token, usuario.id, expiresAt);

                // Enviar correo con enlace de reseteo
                try {
                    await enviarCorreoReset(correo, usuario.nombre || correo, token);
                } catch (err) {
                    console.error('Error enviando correo de reset:', err.message || err);
                }

                // Para facilitar pruebas en Postman en desarrollo, devuelve el token si la variable de entorno lo permite
                if (process.env.RETURN_RESET_TOKEN === 'true') {
                    return res.json({ mensaje: 'Correo de recuperación enviado', token });
                }

                return res.json({ mensaje: 'Correo de recuperación enviado' });
    } catch (error) {
        console.error('Error en forgotPassword:', error);
        return res.status(500).json({ error: 'Error interno' });
    }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
    try {
        const { token, nuevaPassword } = req.body;
        if (!token || !nuevaPassword) return res.status(400).json({ error: 'Token y nuevaPassword son requeridos' });
        const entry = await PasswordResetModel.findByToken(token);
        if (!entry) return res.status(400).json({ error: 'Token inválido o expirado' });
        if (entry.expires_at < Date.now()) {
            await PasswordResetModel.deleteByToken(token);
            return res.status(400).json({ error: 'Token expirado' });
        }

        const hashed = await bcrypt.hash(nuevaPassword, 10);
        const updated = await UserModel.updatePassword(entry.user_id, hashed);

        // Consumir token
        await PasswordResetModel.deleteByToken(token);

        if (updated === 0) return res.status(500).json({ error: 'No se pudo actualizar la contraseña' });

        return res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.error('Error en resetPassword:', error);
        return res.status(500).json({ error: 'Error interno' });
    }
};