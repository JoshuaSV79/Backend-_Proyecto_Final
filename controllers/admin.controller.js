const ProductModel = require('../models/ProductModel');
const fs = require('fs');
const path = require('path');

// POST /api/admin/newProduct - Crear producto
exports.createProduct = async (req, res) => {
    try {
        const { nombre, precio, descripcion, categoria, stockIn } = req.body;

        if (!nombre || !precio || !descripcion || !categoria || !stockIn) {
            return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
        }

        const existente = await ProductModel.getProductByName(nombre);
        if (existente) {
            return res.status(409).json({ 
                mensaje: 'Ya existe un producto con el mismo nombre',
                id_insertado: null 
            });
        }

        const id_insertado = await ProductModel.createProd(nombre, precio, descripcion, categoria, stockIn);
        
        res.status(201).json({ 
            mensaje: 'Producto registrado', 
            id_insertado 
        });

    } catch (error) {
        console.error('Error al dar de alta el producto:', error);
        res.status(500).json({ mensaje: 'Error al dar de alta el producto' });
    }
};

// POST /api/admin/newProduct/uploadImages - Subir imágenes
exports.upImages = async (req, res) => {
    const idProducto = req.body.idProducto;
    const imagenes = req.files;

    if (!idProducto) {
        return res.status(400).json({ mensaje: "No se recibió idProducto" });
    }

    if (!imagenes || imagenes.length === 0) {
        return res.status(400).json({ mensaje: "No se enviaron imágenes" });
    }

    const nuevas = [];

    imagenes.forEach(file => {
        const nuevoNombre = `${idProducto}_${file.filename}`;
        const oldPath = file.path;
        const newPath = path.join(file.destination, nuevoNombre);

        fs.renameSync(oldPath, newPath);

        nuevas.push({
            nombre: nuevoNombre,
            url: `http://localhost:3000/images/${nuevoNombre}`
        });
    });

    res.json({
        mensaje: "Imágenes guardadas correctamente",
        idProducto,
        imagenes: nuevas
    });
};

// PUT /api/admin/product/:id - Actualizar producto
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, precio, descripcion, categoria, stockIN } = req.body;

        if (!nombre || !precio || !descripcion || !categoria || stockIN === undefined) {
            return res.status(400).json({ mensaje: 'Faltan datos obligatorios' });
        }

        const producto = await ProductModel.getProductById(id);
        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        const affectedRows = await ProductModel.updateProduct(id, nombre, precio, descripcion, categoria, stockIN);

        if (affectedRows === 0) {
            return res.status(404).json({ mensaje: 'No se pudo actualizar el producto' });
        }

        res.json({ 
            mensaje: 'Producto actualizado correctamente',
            success: true
        });

    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ mensaje: 'Error al actualizar el producto' });
    }
};

// DELETE /api/admin/product/:id - Eliminar producto
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const producto = await ProductModel.getProductById(id);
        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        // Eliminar imágenes asociadas
        const carpeta = path.join(__dirname, "..", "images");
        try {
            const archivos = fs.readdirSync(carpeta);
            const imagenesProducto = archivos.filter(nombre => nombre.startsWith(id + "_"));
            
            imagenesProducto.forEach(imagen => {
                fs.unlinkSync(path.join(carpeta, imagen));
            });
        } catch (err) {
            console.log("Error eliminando imágenes:", err);
        }

        const affectedRows = await ProductModel.deleteProduct(id);

        if (affectedRows === 0) {
            return res.status(404).json({ mensaje: 'No se pudo eliminar el producto' });
        }

        res.json({ 
            mensaje: 'Producto eliminado correctamente',
            success: true
        });

    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ mensaje: 'Error al eliminar el producto' });
    }
};

// PUT /api/admin/product/:id/stock - Actualizar stock
exports.updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { stockIN } = req.body;

        if (stockIN === undefined || stockIN < 0) {
            return res.status(400).json({ mensaje: 'Stock inválido' });
        }

        const producto = await ProductModel.getProductById(id);
        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        // Actualizar usando la función de update
        await ProductModel.updateProduct(
            id, 
            producto.nombre, 
            producto.precio, 
            producto.descripcion, 
            producto.cat, 
            stockIN
        );

        res.json({ 
            mensaje: 'Stock actualizado correctamente',
            success: true
        });

    } catch (error) {
        console.error('Error al actualizar stock:', error);
        res.status(500).json({ mensaje: 'Error al actualizar el stock' });
    }
};