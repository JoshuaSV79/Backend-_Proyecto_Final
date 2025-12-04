const CartModel = require('../models/CartModel');
const ProductModel = require('../models/ProductModel');
const CouponModel = require('../models/CuponModel');

// GET /api/cart - Obtener carrito del usuario
exports.getCart = async (req, res) => {
    try {
        const userId = req.userId;
        const items = await CartModel.getCartByUserId(userId);

        // Calcular totales
        const subtotal = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
        const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);

        res.json({
            items,
            subtotal: subtotal.toFixed(2),
            totalItems
        });
    } catch (error) {
        console.error('Error al obtener carrito:', error);
        res.status(500).json({ error: 'Error al obtener el carrito' });
    }
};

// POST /api/cart/add - Agregar producto al carrito
exports.addToCart = async (req, res) => {
    try {
        const userId = req.userId;
        const { producto_id, cantidad } = req.body;

        if (!producto_id || !cantidad || cantidad <= 0) {
            return res.status(400).json({ error: 'Datos inválidos' });
        }

        // Verificar que el producto existe y hay stock
        const producto = await ProductModel.getProductById(producto_id);
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        if (producto.stockAC < cantidad) {
            return res.status(400).json({ 
                error: 'Stock insuficiente',
                stockDisponible: producto.stockAC
            });
        }

        await CartModel.addToCart(userId, producto_id, cantidad);

        res.status(201).json({ 
            mensaje: 'Producto agregado al carrito',
            success: true
        });
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        res.status(500).json({ error: 'Error al agregar producto al carrito' });
    }
};

// PUT /api/cart/update - Actualizar cantidad
exports.updateQuantity = async (req, res) => {
    try {
        const userId = req.userId;
        const { producto_id, cantidad } = req.body;

        if (!producto_id || !cantidad || cantidad <= 0) {
            return res.status(400).json({ error: 'Datos inválidos' });
        }

        // Verificar stock disponible
        const disponible = await ProductModel.checkAvailability(producto_id, cantidad);
        if (!disponible) {
            return res.status(400).json({ error: 'Stock insuficiente' });
        }

        const affectedRows = await CartModel.updateCartQuantity(userId, producto_id, cantidad);

        if (affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
        }

        res.json({ 
            mensaje: 'Cantidad actualizada',
            success: true
        });
    } catch (error) {
        console.error('Error al actualizar cantidad:', error);
        res.status(500).json({ error: 'Error al actualizar cantidad' });
    }
};

// DELETE /api/cart/remove/:productId - Eliminar producto
exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.userId;
        const { productId } = req.params;

        const affectedRows = await CartModel.removeFromCart(userId, productId);

        if (affectedRows === 0) {
            return res.status(404).json({ error: 'Producto no encontrado en el carrito' });
        }

        res.json({ 
            mensaje: 'Producto eliminado del carrito',
            success: true
        });
    } catch (error) {
        console.error('Error al eliminar del carrito:', error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
};

// DELETE /api/cart/clear - Vaciar carrito
exports.clearCart = async (req, res) => {
    try {
        const userId = req.userId;
        await CartModel.clearCart(userId);

        res.json({ 
            mensaje: 'Carrito vaciado',
            success: true
        });
    } catch (error) {
        console.error('Error al vaciar carrito:', error);
        res.status(500).json({ error: 'Error al vaciar el carrito' });
    }
};

// POST /api/cart/coupon - Aplicar cupón
exports.applyCoupon = async (req, res) => {
    try {
        const { codigo } = req.body;

        if (!codigo) {
            return res.status(400).json({ error: 'Código de cupón requerido' });
        }

        const cupon = await CouponModel.validateCoupon(codigo);

        if (!cupon) {
            return res.status(404).json({ error: 'Cupón inválido o expirado' });
        }

        res.json({
            mensaje: 'Cupón válido',
            cupon: {
                codigo: cupon.codigo,
                descuento: cupon.descuento_porcentaje
            },
            success: true
        });
    } catch (error) {
        console.error('Error al validar cupón:', error);
        res.status(500).json({ error: 'Error al validar el cupón' });
    }
};