// controllers/compra.controller.js (MODIFICADO)
const CartModel = require('../models/CartModel');
const OrderModel = require('../models/OrderModel');
const ProductModel = require('../models/ProductModel');
const CouponModel = require('../models/CuponModel');
const UserModel = require('../models/UserModel');
const { generarNotaCompraPDF } = require('../utils/pdfGenerator');
const { enviarCorreoCompra } = require('../utils/emailService');

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
        let hayStock = true;
        for (const item of cartItems) {
            const disponible = await ProductModel.checkAvailability(item.producto_id, item.cantidad);
            if (!disponible) {
                hayStock = false;
                break;
            }
        }

        if (!hayStock) {
            return res.status(409).json({ error: 'Stock insuficiente para uno o más productos' });
        }

        // Calcular totales
        let subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
        let cupon_descuento = 0;
        const gastos_envio = 150.00; // Valor fijo, podría ser variable de entorno
        const impuestos_tasa = 0.16; // 16% de IVA

        // Aplicar cupón si existe
        if (codigo_cupon) {
            const cupon = await CouponModel.validateCoupon(codigo_cupon);
            if (cupon && cupon.descuento_porcentaje) {
                cupon_descuento = subtotal * (cupon.descuento_porcentaje / 100);
            }
        }
        
        let subtotal_despues_cupon = subtotal - cupon_descuento;
        if (subtotal_despues_cupon < 0) subtotal_despues_cupon = 0;

        // El IVA se calcula sobre el subtotal después del cupón
        const impuestos = subtotal_despues_cupon * impuestos_tasa;

        // El total incluye el subtotal (después de cupón), impuestos y envío
        const total = subtotal_despues_cupon + impuestos + gastos_envio;

        // Preparar datos de la orden
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
        
        // Guardar orden y obtener ID
        const ordenId = await OrderModel.createOrder(orderData);

        // Guardar detalles de la orden
        await OrderModel.addOrderDetails(ordenId, cartItems);

        // Actualizar stock y registrar ventas (asumiendo que las ventas se registran por detalle para estadísticas)
        for (const item of cartItems) {
            await ProductModel.updateStock(item.producto_id, item.cantidad);
            // Asumiendo que el modelo de producto tiene el campo 'cat' (categoría)
            const productoInfo = await ProductModel.getProductById(item.producto_id); 
            if (productoInfo) {
                await OrderModel.registerSale(ordenId, productoInfo.cat, item.subtotal);
            }
        }

        // Desactivar cupón si fue usado (asumiendo cupones de un solo uso o que se desactiven al final)
        if (codigo_cupon && cupon_descuento > 0) {
            await CouponModel.deactivateCoupon(codigo_cupon);
        }

        // Vaciar carrito
        await CartModel.clearCart(userId);

        // Devolver el ID de la orden. La finalización (email/PDF) se hace en /finalize
        res.json({
            mensaje: 'Proceso de compra exitoso. Orden creada.',
            success: true,
            orderId: ordenId
        });

    } catch (error) {
        console.error('Error al procesar compra:', error);
        res.status(500).json({ error: 'Error al procesar la compra', detail: String(error) });
    }
};

// POST /api/purchase/finalize - Finalizar compra (envío de email/PDF)
exports.finalizePurchase = async (req, res) => {
    try {
        const userId = req.userId;
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ mensaje: 'ID de orden requerido', success: false });
        }

        // 1. Obtener la orden completa con detalles
        const orden = await OrderModel.getOrderById(orderId);

        if (!orden) {
            return res.status(404).json({ mensaje: 'Orden no encontrada', success: false });
        }

        // 2. Obtener datos del usuario
        const usuario = await UserModel.getUserById(userId);

        // 3. Generar PDF (obteniendo el Buffer directamente, sin guardar en disco)
        const pdfBuffer = await generarNotaCompraPDF(orden); // MODIFICADO

        if (!pdfBuffer) {
            console.error('Buffer de PDF no generado');
            return res.status(500).json({ mensaje: 'Error generando la nota PDF', success: false });
        }
        
        // 4. Enviar correo con PDF y capturar info del envío
        try {
            // Pasar el Buffer y el ID de la orden
            const info = await enviarCorreoCompra(usuario.correo, orden.nombre_cliente, pdfBuffer, orden.id); // MODIFICADO
            
            return res.json({
                mensaje: 'Compra finalizada. La nota se envió a tu correo electrónico.',
                success: true,
                mailInfo: { 
                    messageId: info && info.messageId, 
                    accepted: info && info.accepted, 
                    rejected: info && info.rejected 
                }
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