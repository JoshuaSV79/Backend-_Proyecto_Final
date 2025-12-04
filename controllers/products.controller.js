const ProductModel = require('../models/ProductModel'); 
// Se eliminan 'fs' y 'path' ya que la lógica de imágenes ahora debe venir de la DB/Cloudinary

// Función auxiliar para mapear el producto y extraer la URL de la imagen principal
// ASUMPCIÓN: El modelo de datos (ProductModel) selecciona la columna 'url_imagen_principal'.
const mapProduct = (prod) => ({
    id: prod.id,
    nombre: prod.nombre,
    precio: prod.precio,
    // Usamos la URL de la base de datos, que debe ser la URL completa de Cloudinary u otro servicio.
    url_imagen: prod.url_imagen_principal || null 
});

// GET /api/products/:id/images - Obtener imágenes por producto
// Se ha refactorizado para devolver solo la URL de la imagen principal si existe.
exports.getImagenesPorProducto = async (req, res) => {
    try {
        const idProducto = req.params.id;
        const producto = await ProductModel.getProductById(idProducto); 

        if (!producto) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        
        const lista = [];

        if (producto.url_imagen_principal) {
            lista.push({ 
                nombre: `principal_${idProducto}`,
                url: producto.url_imagen_principal
            });
        }
        
        // NOTA: Si tienes múltiples imágenes para un producto, se necesitaría una
        // tabla separada en la DB (ej: 'imagenes_producto') y una consulta adicional aquí.
        
        res.json(lista);

    } catch (error) {
        console.error("❌ Error en getImagenesPorProducto:", error);
        res.status(500).json({ error: "Error al obtener imágenes del producto" });
    }
};


// GET /api/products/salas - Obtener productos de Salas
exports.getProductosSalas = async (req, res) => {
    try {
        const productos = await ProductModel.getProductosSalas();
        const respuesta = productos.map(mapProduct);
        res.json(respuesta);
    } catch (error) {
        console.error("❌ Error en getProductosSalas:", error);
        res.status(500).json({ mensaje: "Error al obtener salas" });
    }
};

// GET /api/products/dormitorios - Obtener productos de Dormitorios
exports.getProductosDormi = async (req, res) => {
    try {
        const productos = await ProductModel.getProductosDormi();
        const respuesta = productos.map(mapProduct);
        res.json(respuesta);
    } catch (error) {
        console.error("❌ Error en getProductosDormi:", error);
        res.status(500).json({ mensaje: "Error al obtener dormitorios" });
    }
};

// GET /api/products/comedores - Obtener productos de Comedores
exports.getProductosCome = async (req, res) => {
    try {
        const productos = await ProductModel.getProductosCome();
        const respuesta = productos.map(mapProduct);
        res.json(respuesta);
    } catch (error) {
        console.error("❌ Error en getProductosCome:", error);
        res.status(500).json({ mensaje: "Error al obtener comedores" });
    }
};

// GET /api/products/producto/:prod - Obtener un producto por ID
exports.getProduct = async (req, res) => {
    try {
        const id = req.params.prod;
        const producto = await ProductModel.getProductById(id);

        if (!producto) {
            return res.status(404).json({ mensaje: "Producto no encontrado" });
        }

        // Agregar url_imagen principal al producto devuelto
        const productoConImagen = {
            ...producto,
            url_imagen: producto.url_imagen_principal || null
        };
        
        res.json(productoConImagen);
        
    } catch (error) {
        console.error("❌ Error en getProduct:", error);
        res.status(500).json({ mensaje: "Error al obtener el producto" });
    }
};


// GET /api/products/all - Obtener todos los productos
exports.getAllProducts = async (req, res) => {
    try {
        const productos = await ProductModel.getAllProducts();
        
        // Se mapea directamente el resultado de la base de datos
        const respuesta = productos.map(mapProduct);

        res.json(respuesta);

    } catch (error) {
        console.error("❌ Error en getAllProducts:", error);
        res.status(500).json({ mensaje: "Error al obtener todos los productos" });
    }
};