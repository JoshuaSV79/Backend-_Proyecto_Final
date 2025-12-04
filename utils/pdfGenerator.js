const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function formatCurrency(value) {
  const num = Number(value || 0);
  return num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function generarNotaCompraPDF(orden) {
  const pdfDir = path.join(__dirname, '..', 'pdf');
  if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

  const fileName = `nota_compra_${orden.id || Date.now()}.pdf`;
  const pdfPath = path.join(pdfDir, fileName);

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  // Encabezado
  doc.font('Helvetica-Bold').fontSize(20).text(process.env.EMPRESA_NOMBRE || 'Nova Hogar', 40, 40);
  doc.font('Helvetica').fontSize(10).text(process.env.EMPRESA_LEMA || 'Diseño y Confort para tu Hogar', 40, 64);

  // Bloque con la dirección/contacto de la empresa (en la parte superior derecha)
  const companyX = 360;
  const companyY = 40;
  const companyWidth = 180;
  doc.rect(companyX - 6, companyY - 6, companyWidth + 12, 64).strokeOpacity(0.05).stroke();
  doc.font('Helvetica-Bold').fontSize(10).text(process.env.EMPRESA_NOMBRE || 'Nova Hogar', companyX, companyY, { width: companyWidth, align: 'left' });
  doc.font('Helvetica').fontSize(9).text(process.env.EMPRESA_DIRECCION || 'Calle Ejemplo 123, Ciudad', companyX, companyY + 14, { width: companyWidth });
  doc.text(`Tel: ${process.env.EMPRESA_TELEFONO || '0000000000'}`, companyX, companyY + 30, { width: companyWidth });
  doc.text(`${process.env.EMPRESA_CORREO || (process.env.EMAIL_USER || '')}`, companyX, companyY + 44, { width: companyWidth });

  doc.moveDown(1.2);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeOpacity(0.2).stroke();
  doc.moveDown(0.5);

  // Meta datos de la orden
  // Ajustar posición para metadatos
  const metaStartY = doc.y;
  doc.fontSize(11).font('Helvetica-Bold').text(`Orden #${orden.id || ''}`, 40, metaStartY);
  doc.fontSize(10).font('Helvetica').text(`Fecha: ${new Date().toLocaleString()}`, 40, metaStartY + 0, { align: 'right' });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Cliente: ${orden.nombre_cliente || ''}`);
  if (orden.direccion) doc.text(`Dirección: ${orden.direccion}`);
  if (orden.telefono) doc.text(`Teléfono: ${orden.telefono}`);
  doc.moveDown(0.6);

  // Tabla de ítems
  doc.font('Helvetica-Bold').fontSize(11);
  const startX = 40;
  const colCantidad = startX;
  const colProducto = 90;
  const colPrecio = 420;
  const colSubtotal = 500;

  // Cabecera tabla
  const headerY = doc.y;
  doc.text('Cant', colCantidad, headerY);
  doc.text('Producto', colProducto, headerY);
  doc.text('Precio', colPrecio, headerY, { width: 70, align: 'right' });
  doc.text('Subtotal', colSubtotal, headerY, { width: 70, align: 'right' });
  doc.moveDown(0.3);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeOpacity(0.08).stroke();
  doc.moveDown(0.3);

  doc.font('Helvetica').fontSize(10);
  if (Array.isArray(orden.detalles)) {
    orden.detalles.forEach(item => {
      const nombre = item.nombre || item.nombre_producto || '';
      const cantidad = String(item.cantidad || item.cant || 0);
      const precioStr = `$${formatCurrency(item.precio || item.precio_unitario)}`;
      const subtotalStr = `$${formatCurrency(item.subtotal)}`;
      // Guardar posición antes de escribir para controlar saltos
      const rowY = doc.y;
      doc.text(cantidad, colCantidad, rowY);
      doc.text(nombre, colProducto, rowY, { width: colPrecio - colProducto - 10 });
      doc.text(precioStr, colPrecio, rowY, { width: 70, align: 'right' });
      // Mostrar subtotal sin quiebres
      doc.text(`$${formatCurrency(item.subtotal)}`, colSubtotal, rowY, { width: 70, align: 'right' });
      doc.moveDown(0.8);
    });
  }

  doc.moveDown(0.5);
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeOpacity(0.1).stroke();
  doc.moveDown(0.5);

  // Totales
  const a4PageWidth = 595; 
  const pageMargin = 40;
  const totalsBoxWidth = 230;
  const totalsBoxX = a4PageWidth - pageMargin - totalsBoxWidth; 
  const lineHeight = 14;
  const cur = val => `$${formatCurrency(val)}`;
  const rows = [
    { label: 'Subtotal:', value: cur(orden.subtotal), bold: false },
    { label: 'Descuento Cupón:', value: cur(orden.cupon_descuento || 0), bold: false },
    { label: 'Impuestos:', value: cur(orden.impuestos), bold: false },
    { label: 'Gastos de envío:', value: cur(orden.gastos_envio), bold: false },
    { label: 'Total:', value: cur(orden.total), bold: true }
  ];

  const boxPadding = 10;
  const boxHeight = rows.length * lineHeight + boxPadding * 2;
  const boxTop = doc.y;

  
  doc.save();
  doc.roundedRect(totalsBoxX, boxTop - 6, totalsBoxWidth, boxHeight + 6, 4).fillOpacity(0.04).fill('#000000');
  doc.restore();

  let ry = boxTop + boxPadding;
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
    doc.moveDown(0.2);
  }
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(9).fillColor('#666666').text('Si tienes preguntas sobre tu pedido, contáctanos en: ' + (process.env.EMPRESA_CORREO || process.env.EMAIL_USER || ''), pageLeft, doc.y, { width: pageWidth, align: 'center' });
  
    // Finalizar y esperar a que el stream termine antes de retornar la ruta
    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(pdfPath));
      stream.on('error', reject);
    });
}

module.exports = { generarNotaCompraPDF };
