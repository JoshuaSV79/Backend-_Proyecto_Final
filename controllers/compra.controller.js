const CartModel = require('../models/CartModel');
const OrderModel = require('../models/OrderModel');
const ProductModel = require('../models/ProductModel');
const CouponModel = require('../models/CuponModel');
const UserModel = require('../models/UserModel');
const { generarNotaCompraPDF } = require('../utils/pdfGenerator');
const { enviarCorreoCompra } = require('../utils/emailService');
const fs = require('fs');

// POST /api/purchase/process - Procesar compra
exports.processPurchase = async (req, res) => {
    try {
        const userId = req.userId;
        const {
            nombre_cliente,
            direccion,
            ciudad,
            codigo_postal,
            telefono,
            pais,
            metodo_pago,
            codigo_cupon
        } = req.body;

        // Validar datos obligatorios
        if (!nombre_cliente || !direccion || !ciudad || !codigo_postal || !telefono || !pais || !metodo_pago) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }

        // Obtener carrito
        const cartItems = await CartModel.getCartByUserId(userId);

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'El carrito está vacío' });
        }

        // Verificar stock de todos los productos
        for (const item of cartItems) {
            const disponible = await ProductModel.checkAvailability(item.producto_id, item.cantidad);
            if (!disponible) {
                return res.status(400).json({ 
                    error: `Stock insuficiente para ${item.nombre}` 
                });
            }
        }

        // Calcular totales
        let subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
        
        // Calcular impuestos (16% en México, ajusta según tu país)
        const tasaImpuesto = pais === 'Mexico' ? 0.16 : 0.10;
        const impuestos = subtotal * tasaImpuesto;

        // Calcular gastos de envío (ejemplo: $100 fijo)
        const gastos_envio = 100.00;

        // Aplicar cupón si existe
        let cupon_descuento = 0;
        if (codigo_cupon) {
            const cupon = await CouponModel.validateCoupon(codigo_cupon);
            if (cupon) {
                cupon_descuento = subtotal * (cupon.descuento_porcentaje / 100);
            }
        }

        const total = subtotal + impuestos + gastos_envio - cupon_descuento;

        // Crear orden
        const orderData = {
            usuario_id: userId,
            nombre_cliente,
            direccion,
            ciudad,
            codigo_postal,
            telefono,
            pais,
            metodo_pago,
            subtotal: subtotal.toFixed(2),
            impuestos: impuestos.toFixed(2),
            gastos_envio: gastos_envio.toFixed(2),
            cupon_descuento: cupon_descuento.toFixed(2),
            total: total.toFixed(2)
        };

        const ordenId = await OrderModel.createOrder(orderData);

        // Agregar detalles de la orden
        const orderDetails = cartItems.map(item => ({
            producto_id: item.producto_id,
            nombre: item.nombre,
            cantidad: item.cantidad,
            precio: item.precio,
            subtotal: item.subtotal
        }));

        await OrderModel.addOrderDetails(ordenId, orderDetails);

        // Actualizar stock de productos
        for (const item of cartItems) {
            await ProductModel.updateStock(item.producto_id, item.cantidad);
        }

        // Registrar ventas por categoría
        for (const item of cartItems) {
            const producto = await ProductModel.getProductById(item.producto_id);
            await OrderModel.registerSale(ordenId, producto.cat, item.subtotal);
        }

        // Si se usó cupón válido, desactivarlo (consumido)
        if (codigo_cupon && cupon_descuento > 0) {
            try {
                // Eliminar el cupón para que no pueda reutilizarse
                await CouponModel.deleteCoupon(codigo_cupon);
            } catch (cErr) {
                console.error('Error eliminando cupón:', cErr);
                try {
                    // Si falla la eliminación, intentar desactivarlo como fallback
                    await CouponModel.deactivateCoupon(codigo_cupon);
                } catch (cErr2) {
                    console.error('Error desactivando cupón como fallback:', cErr2);
                }
            }
        }

        // Vaciar carrito
        await CartModel.clearCart(userId);

        res.status(201).json({
            mensaje: 'Compra procesada exitosamente',
            ordenId,
            total: total.toFixed(2),
            success: true
        });

    } catch (error) {
        console.error('Error al procesar compra:', error);
        res.status(500).json({ error: 'Error al procesar la compra' });
    }
};

// POST /api/purchase/finalize - Finalizar y enviar PDF
exports.finalizePurchase = async (req, res) => {
    try {
        const { ordenId } = req.body;
        const userId = req.userId;

        if (!ordenId) {
            return res.status(400).json({ error: 'ID de orden requerido' });
        }

        // Obtener orden completa
        const orden = await OrderModel.getOrderById(ordenId);

        if (!orden || orden.usuario_id !== userId) {
            return res.status(404).json({ error: 'Orden no encontrada' });
        }

        // Obtener datos del usuario
        const usuario = await UserModel.getUserById(userId);

        // Generar PDF
        const pdfPath = await generarNotaCompraPDF(orden);

        // Verificar que el archivo PDF fue creado
        const pdfExists = fs.existsSync(pdfPath);
        if (!pdfExists) {
            console.error('PDF generado no encontrado en la ruta:', pdfPath);
            return res.status(500).json({ mensaje: 'Error generando la nota PDF', success: false });
        }

        // Enviar correo con PDF y capturar info del envío
        try {
            const info = await enviarCorreoCompra(usuario.correo, orden.nombre_cliente, pdfPath);
            return res.json({
                mensaje: 'Compra finalizada. La nota se envió a tu correo electrónico.',
                success: true,
                pdfPath,
                mailInfo: { messageId: info && info.messageId, accepted: info && info.accepted, rejected: info && info.rejected }
            });
        } catch (mailErr) {
            console.error('Error enviando correo con PDF:', mailErr);
            return res.status(500).json({ mensaje: 'Compra finalizada pero fallo el envío del correo', success: false, error: String(mailErr) });
        }

    } catch (error) {
        console.error('Error al finalizar compra:', error);
        // Devolver detalle del error en entorno de desarrollo para depuración
        res.status(500).json({ error: 'Error al finalizar la compra', detail: String(error) });
    }
};