// utils/pdfGenerator.js (MODIFICADO - Ahora devuelve un Buffer)
const PDFDocument = require('pdfkit');

function formatCurrency(value) {
  const num = Number(value || 0);
  return num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// MODIFICACIÓN: La función ahora devuelve un Promise<Buffer>
async function generarNotaCompraPDF(orden) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const buffers = [];

    // Capturar el contenido del PDF en un Buffer
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', reject);

    // --- Lógica de generación de PDF ---

    // Encabezado
    doc.font('Helvetica-Bold').fontSize(20).text(process.env.EMPRESA_NOMBRE || 'Nova Hogar', 40, 40);
    doc.font('Helvetica').fontSize(10).text(process.env.EMPRESA_LEMA || 'Diseño y Confort para tu Hogar', 40, 64);

    // Bloque con la dirección/contacto de la empresa (en la parte superior derecha)
    const companyX = 360;
    const companyY = 40;
    const companyWidth = 180;
    doc.rect(companyX, companyY, companyWidth, 60).fillAndStroke('#f9f9f9', '#cccccc');
    doc.fillColor('#333333').font('Helvetica-Bold').fontSize(10).text('FACTURA / NOTA DE COMPRA', companyX + 10, companyY + 8, { width: companyWidth - 20 });
    doc.font('Helvetica').fontSize(9);
    doc.text(`N° Orden: ${orden.id || 'N/A'}`, companyX + 10, companyY + 22);
    doc.text(`Fecha: ${new Date(orden.fecha_creacion).toLocaleDateString()}`, companyX + 10, companyY + 34);
    doc.text(`Método: ${orden.metodo_pago}`, companyX + 10, companyY + 46);
    doc.fillColor('#000000');


    // Bloque de datos del cliente
    doc.font('Helvetica-Bold').fontSize(12).text('Detalles del Cliente:', 40, 120);
    doc.font('Helvetica').fontSize(10);
    doc.text(`Nombre: ${orden.nombre_cliente}`, 40, 138);
    doc.text(`Dirección: ${orden.direccion}, ${orden.ciudad}, ${orden.codigo_postal}`, 40, 150);
    doc.text(`País: ${orden.pais}`, 40, 162);
    doc.text(`Teléfono: ${orden.telefono}`, 40, 174);
    
    // Linea separadora
    doc.moveTo(40, 195).lineTo(550, 195).stroke('#cccccc');
    doc.moveDown(1.5);

    // Tabla de Detalles de la Compra
    doc.font('Helvetica-Bold').fontSize(11).text('DETALLES DE LA ORDEN', 40, doc.y);
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const itemHeight = 20;
    const col1 = 40; // Producto
    const col2 = 300; // Precio Unitario
    const col3 = 400; // Cantidad
    const col4 = 480; // Total

    // Encabezados de tabla
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333');
    doc.text('Producto', col1, tableTop);
    doc.text('Precio Unitario', col2, tableTop, { align: 'right' });
    doc.text('Cantidad', col3, tableTop, { align: 'right' });
    doc.text('Subtotal', col4, tableTop, { align: 'right' });

    doc.moveDown(0.5);
    doc.moveTo(col1, doc.y).lineTo(550, doc.y).stroke('#999999');
    doc.moveDown(0.5);
    
    // Filas de productos
    let currentY = doc.y;
    orden.detalles.forEach(item => {
      doc.font('Helvetica').fontSize(10).fillColor('#000000');
      doc.text(item.nombre_producto, col1, currentY);
      doc.text(`$${formatCurrency(item.precio_unitario)}`, col2, currentY, { align: 'right' });
      doc.text(item.cantidad, col3, currentY, { align: 'right' });
      doc.text(`$${formatCurrency(item.subtotal)}`, col4, currentY, { align: 'right' });
      currentY += itemHeight;
    });

    // Subtotal/Totales (Caja a la derecha)
    doc.moveDown(orden.detalles.length * 0.8);
    const totalsBoxX = 320;
    const totalsBoxY = currentY + 10;
    const totalsBoxWidth = 230;
    const lineHeight = 15;
    const boxPadding = 10;

    const rows = [
      { label: 'Subtotal:', value: `$${formatCurrency(orden.subtotal)}` },
      { label: 'Gastos de Envío:', value: `$${formatCurrency(orden.gastos_envio)}` },
      { label: 'Impuestos (IVA):', value: `$${formatCurrency(orden.impuestos)}` },
      { label: 'Cupón Descuento:', value: `-$${formatCurrency(orden.cupon_descuento || 0)}` },
      { label: 'TOTAL PAGADO:', value: `$${formatCurrency(orden.total)}`, bold: true }
    ];

    const boxHeight = (rows.length * lineHeight) + (2 * boxPadding) - 5; 

    doc.save();
    doc.rect(totalsBoxX, totalsBoxY, totalsBoxWidth, boxHeight).fillAndStroke('#eeeeee', '#666666');
    doc.fillColor('#000000');
    doc.restore();

    let ry = totalsBoxY + boxPadding;
    rows.forEach(r => {
      if (r.bold) {
        doc.font('Helvetica-Bold').fontSize(12);
      } else {
        doc.font('Helvetica').fontSize(10);
      }
      
      doc.text(r.label, totalsBoxX + 8, ry, { width: 120, align: 'left' });
     
      doc.text(r.value, totalsBoxX + 140, ry, { width: 82, align: 'right' });
      ry += lineHeight;
    });

    doc.moveDown(rows.length * 0.8 + 0.5);

    doc.moveDown(1);
    
    const pageLeft = 40;
    const pageWidth = 515; 
    doc.x = pageLeft;
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#333333').text('Gracias por tu compra', pageLeft, doc.y, { width: pageWidth, align: 'center' });
    doc.moveDown(0.3);
    if (process.env.EMPRESA_NOMBRE) {
      doc.font('Helvetica').fontSize(10).fillColor('#666666').text(process.env.EMPRESA_NOMBRE, pageLeft, doc.y, { width: pageWidth, align: 'center' });
    }

    // Terminar de generar el PDF
    doc.end();
  });
}

module.exports = {
  generarNotaCompraPDF,
};