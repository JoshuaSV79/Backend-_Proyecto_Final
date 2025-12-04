const CuponModel = require('../models/CuponModel');

// GET /api/coupons/:code - consultar estado del cupón
exports.getCouponByCode = async (req, res) => {
  try {
    const codigo = req.params.code;
    if (!codigo) return res.status(400).json({ error: 'Código requerido' });

    const cupon = await CuponModel.validateCoupon(codigo);
    if (!cupon) return res.status(404).json({ success: false, mensaje: 'Cupón no encontrado o inactivo' });

    res.json({ success: true, cupon });
  } catch (error) {
    console.error('Error en getCouponByCode:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
};
