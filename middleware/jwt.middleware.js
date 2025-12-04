const jwt = require('jsonwebtoken');

// Middleware para verificar JWT
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Token no proporcionado',
            formato_esperado: 'Authorization: Bearer <token>'
        });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        req.userNombre = decoded.nombre;
        req.userTipo = decoded.tipo;
        next();
    } catch (error) {
        return res.status(401).json({ 
            error: 'Token inválido o expirado',
            detalles: error.message 
        });
    }
};

// Middleware para verificar que sea admin
exports.verifyAdmin = (req, res, next) => {
    if (req.userTipo !== 'admin') {
        return res.status(403).json({ 
            error: 'Acceso denegado. Se requiere rol de administrador' 
        });
    }
    next();
};

// Función para generar JWT
exports.generateToken = (userId, nombre, tipo) => {
    return jwt.sign(
        { userId, nombre, tipo },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};