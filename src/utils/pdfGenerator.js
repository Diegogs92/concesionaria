import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { formatCurrency, formatDate } from './helpers'

/**
 * Genera un boleto de compraventa PDF para una venta y lo descarga.
 */
export function generateFacturaPDF(venta, auto, cliente, vendedor) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15

  // ─── Header ───
  doc.setFontSize(20)
  doc.setFont(undefined, 'bold')
  doc.text('BOLETO DE COMPRAVENTA', margin, margin + 10)

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.text('ICY Automotores', margin, margin + 20)
  doc.text(`N° ${venta.id.toUpperCase()}`, pageWidth - margin - 50, margin + 10)
  doc.text(`Fecha: ${formatDate(venta.fecha)}`, pageWidth - margin - 50, margin + 20)

  // ─── Línea divisora ───
  doc.setDrawColor(200)
  doc.line(margin, margin + 28, pageWidth - margin, margin + 28)

  // ─── Datos del cliente ───
  let yPos = margin + 35
  doc.setFont(undefined, 'bold')
  doc.text('DATOS DEL COMPRADOR:', margin, yPos)
  yPos += 8

  doc.setFont(undefined, 'normal')
  doc.text(`Nombre: ${cliente.apellido} ${cliente.nombre}`, margin, yPos)
  yPos += 6
  doc.text(`DNI: ${cliente.dni}`, margin, yPos)
  yPos += 6
  doc.text(`Teléfono: ${cliente.telefono}`, margin, yPos)

  // ─── Datos del vendedor ───
  yPos += 12
  doc.setFont(undefined, 'bold')
  doc.text('VENDEDOR:', margin, yPos)
  yPos += 6
  doc.setFont(undefined, 'normal')
  doc.text(vendedor.nombre, margin, yPos)

  // ─── Detalles del vehículo ───
  yPos += 12
  doc.setFont(undefined, 'bold')
  doc.text('DETALLES DEL VEHÍCULO:', margin, yPos)
  yPos += 8

  doc.setFont(undefined, 'normal')
  doc.text(`Marca/Modelo: ${auto.marca} ${auto.modelo}`, margin, yPos)
  yPos += 6
  doc.text(`Año: ${auto.año || '—'}`, margin, yPos)
  yPos += 6
  doc.text(`Kilometraje: ${auto.kilometraje ? Number(auto.kilometraje).toLocaleString('es-AR') + ' km' : '—'}`, margin, yPos)
  yPos += 6
  if (auto.descripcion) {
    doc.text(`Descripción: ${auto.descripcion}`, margin, yPos)
    yPos += 6
  }

  // ─── Tabla de precios ───
  yPos += 8
  doc.autoTable({
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [['Concepto', 'Importe']],
    body: [
      ['Precio de venta', formatCurrency(venta.precioFinal)],
      ['Forma de pago', venta.tipoPago === 'contado' ? 'Contado' : `Financiado (${venta.cuotas || '—'} cuotas)`],
      ...(venta.tipoPago === 'financiado' && venta.cuotas ? [['Valor por cuota', formatCurrency(venta.precioFinal / venta.cuotas)]] : []),
    ],
    headStyles: { fillColor: [180, 30, 30], textColor: 255, fontStyle: 'bold', fontSize: 11 },
    bodyStyles: { fontSize: 10 },
    columnStyles: { 1: { halign: 'right' } },
  })

  // ─── Footer ───
  doc.setFont(undefined, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text('ICY Automotores — Documento interno de compraventa.', margin, pageHeight - 10)

  doc.save(`boleto-compraventa-${venta.id}.pdf`)
}

/**
 * Exporta un reporte de ventas a PDF con tabla.
 */
export function generateVentasReportPDF(ventas, autos, clientes, usuarios) {
  const doc = new jsPDF()
  const margin = 15

  doc.setFontSize(16)
  doc.setFont(undefined, 'bold')
  doc.text('REPORTE DE VENTAS', margin, margin + 10)

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, margin, margin + 20)

  const tableData = ventas.map(v => {
    const auto = autos.find(a => a.id === v.autoId)
    const cliente = clientes.find(c => c.id === v.clienteId)
    const vendedor = usuarios.find(u => u.id === v.vendedorId)

    return [
      v.id,
      `${auto?.marca || '?'} ${auto?.modelo || '?'}`,
      cliente?.nombre || '?',
      vendedor?.nombre || '?',
      formatCurrency(v.precioFinal),
      formatCurrency(v.ganancia),
      formatDate(v.fecha),
    ]
  })

  doc.autoTable({
    startY: margin + 28,
    margin: margin,
    head: [['ID', 'Vehículo', 'Cliente', 'Vendedor', 'Precio Final', 'Ganancia', 'Fecha']],
    body: tableData,
    headStyles: {
      fillColor: [0, 122, 255],
      textColor: 255,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
    },
    columnStyles: {
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
  })

  doc.save('reporte-ventas.pdf')
}
