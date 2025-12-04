const fs = require("fs");
const path = require("path");
const ProductModel = require('../models/ProductModel');

exports.getImagenesPorProducto = (req, res) => {
    const idProducto = req.params.id;
    const carpeta = path.join(__dirname, "..", "images");

    fs.readdir(carpeta, (err, archivos) => {
        if (err) {
            return res.status(500).json({ error: "Error al leer carpeta" });
        }

        const lista = archivos
            .filter(nombre => nombre.startsWith(idProducto + "_"))
            .map(nombre => ({
                nombre,
                url: `http://localhost:3000/images/${nombre}`
            }));

        res.json(lista);
    });
};

exports.getProductosSalas = async (req, res) => {
    try {
        const productos = await ProductModel.getProductosSalas();
        const carpeta = path.join(__dirname, "..", "images");

        const respuesta = productos.map(prod => {
            let imagenFinal = null;

            try {
                const archivos = fs.readdirSync(carpeta);
                const encontrado = archivos.find(nombre => 
                    nombre.startsWith(prod.id + "_")
                );

                if (encontrado) {
                    imagenFinal = `http://localhost:3000/images/${encontrado}`;
                }

            } catch (err) {
                console.log("❌ Error leyendo carpeta de imágenes:", err);
            }

            return {
                id: prod.id,
                nombre: prod.nombre,
                precio: prod.precio,
                url_imagen: imagenFinal
            };
        });

        res.json(respuesta);

    } catch (error) {
        console.error("❌ Error en getProductosSalas:", error);
        res.status(500).json({ mensaje: "Error al obtener los productos de salas" });
    }
};

exports.getProductosDormi = async (req, res) => {
    try {
        const productos = await ProductModel.getProductosDormi();
        const carpeta = path.join(__dirname, "..", "images");

        const respuesta = productos.map(prod => {
            let imagenFinal = null;

            try {
                const archivos = fs.readdirSync(carpeta);
                const encontrado = archivos.find(nombre => 
                    nombre.startsWith(prod.id + "_")
                );

                if (encontrado) {
                    imagenFinal = `http://localhost:3000/images/${encontrado}`;
                }

            } catch (err) {
                console.log("❌ Error leyendo carpeta de imágenes:", err);
            }

            return {
                id: prod.id,
                nombre: prod.nombre,
                precio: prod.precio,
                url_imagen: imagenFinal
            };
        });
        res.json(respuesta);

    } catch (error) {
        console.error("❌ Error en getProductosDormi:", error);
        res.status(500).json({ mensaje: "Error al obtener los productos de dormitorios" });
    }
};

exports.getProductosCome = async (req, res) => {
    try {
        const productos = await ProductModel.getProductosCome();
        const carpeta = path.join(__dirname, "..", "images");

        const respuesta = productos.map(prod => {
            let imagenFinal = null;

            try {
                const archivos = fs.readdirSync(carpeta);
                const encontrado = archivos.find(nombre => 
                    nombre.startsWith(prod.id + "_")
                );

                if (encontrado) {
                    imagenFinal = `http://localhost:3000/images/${encontrado}`;
                }

            } catch (err) {
                console.log("❌ Error leyendo carpeta de imágenes:", err);
            }

            return {
                id: prod.id,
                nombre: prod.nombre,
                precio: prod.precio,
                url_imagen: imagenFinal
            };
        });

        res.json(respuesta);

    } catch (error) {
        console.error("❌ Error en getProductosCome:", error);
        res.status(500).json({ mensaje: "Error al obtener los productos de comedores" });
    }
};

exports.getProduct = async (req, res) => {
    try {
        const nombreProducto = req.params.prod;
        
        const producto = await ProductModel.getProductByName(nombreProducto);
        
        if (!producto) {
            return res.status(404).json({ mensaje: "Producto no encontrado" });
        }
        
        res.json(producto);
        
    } catch (error) {
        console.error("❌ Error en getProduct:", error);
        res.status(500).json({ mensaje: "Error al obtener el producto" });
    }
};

// GET /api/products/all - Obtener todos los productos
exports.getAllProducts = async (req, res) => {
    try {
        const productos = await ProductModel.getAllProducts();
        const carpeta = path.join(__dirname, "..", "images");

        const respuesta = productos.map(prod => {
            let imagenFinal = null;

            try {
                const archivos = fs.readdirSync(carpeta);
                const encontrado = archivos.find(nombre => 
                    nombre.startsWith(prod.id + "_")
                );

                if (encontrado) {
                    imagenFinal = `http://localhost:3000/images/${encontrado}`;
                }

            } catch (err) {
                console.log("❌ Error leyendo carpeta de imágenes:", err);
            }

            return {
                id: prod.id,
                nombre: prod.nombre,
                precio: prod.precio,
                url_imagen: imagenFinal
            };
        });

        res.json(respuesta);

    } catch (error) {
        console.error("❌ Error en getAllProducts:", error);
        res.status(500).json({ mensaje: "Error al obtener todos los productos" });
    }
};