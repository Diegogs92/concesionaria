import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate } from './helpers'

const ROJO = [180, 30, 30]
const GRIS_OSCURO = [50, 50, 50]
const GRIS_MEDIO = [120, 120, 120]
const GRIS_CLARO = [230, 230, 230]

function seccion(doc, titulo, yPos, pageWidth, margin) {
  doc.setFillColor(...ROJO)
  doc.rect(margin, yPos, pageWidth - margin * 2, 7, 'F')
  doc.setFontSize(9)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(titulo, margin + 3, yPos + 5)
  doc.setTextColor(...GRIS_OSCURO)
  return yPos + 12
}

function campo(doc, label, valor, x, y, labelWidth = 40) {
  doc.setFontSize(8)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(...GRIS_MEDIO)
  doc.text(label.toUpperCase(), x, y)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(...GRIS_OSCURO)
  doc.text(String(valor || '—'), x + labelWidth, y)
}

async function loadBase64(url) {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

/**
 * Genera un boleto de compraventa PDF para una venta y lo descarga.
 */
export async function generateFacturaPDF(venta, auto, cliente, vendedor, vehiculoEntregado = null) {
  const doc = new jsPDF()
  const pageWidth  = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const col2 = pageWidth / 2 + 5

  // ══════════════════════════════════════════════════════════
  // HEADER
  // ══════════════════════════════════════════════════════════
  doc.setFillColor(...ROJO)
  doc.rect(0, 0, pageWidth, 28, 'F')

  try {
    const logoData = await loadBase64('/logo.png')
    doc.addImage(logoData, 'PNG', margin, 4, 42, 20)
  } catch {
    doc.setFontSize(18)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(255, 255, 255)
    doc.text('ICY AUTOMOTORES', margin, 16)
  }

  doc.setFontSize(9)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(255, 255, 255)
  doc.text('Boleto de Compraventa', margin, 25)

  doc.setFont(undefined, 'bold')
  doc.text(`N° ${venta.id.slice(0, 8).toUpperCase()}`, pageWidth - margin - 50, 12)
  doc.setFont(undefined, 'normal')
  doc.text(`Fecha: ${formatDate(venta.fecha)}`, pageWidth - margin - 50, 20)

  doc.setTextColor(...GRIS_OSCURO)
  let y = 38

  // ══════════════════════════════════════════════════════════
  // PARTES
  // ══════════════════════════════════════════════════════════
  y = seccion(doc, 'DATOS DEL COMPRADOR', y, pageWidth, margin)

  campo(doc, 'Apellido y nombre', `${cliente.apellido} ${cliente.nombre}`, margin, y)
  campo(doc, 'DNI', cliente.dni, col2, y)
  y += 8
  campo(doc, 'Teléfono', cliente.telefono, margin, y)
  campo(doc, 'Vendedor', vendedor.nombre, col2, y)
  y += 14

  // ══════════════════════════════════════════════════════════
  // VEHÍCULO QUE SE VENDE
  // ══════════════════════════════════════════════════════════
  y = seccion(doc, 'VEHÍCULO VENDIDO', y, pageWidth, margin)

  campo(doc, 'Marca', auto.marca, margin, y)
  campo(doc, 'Modelo', auto.modelo, col2, y)
  y += 8
  campo(doc, 'Año', auto.año, margin, y)
  campo(doc, 'Kilometraje', auto.kilometraje ? `${Number(auto.kilometraje).toLocaleString('es-AR')} km` : '—', col2, y)
  y += 8
  if (auto.version) {
    campo(doc, 'Versión', auto.version, margin, y)
    y += 8
  }
  if (auto.color) {
    campo(doc, 'Color', auto.color, margin, y)
    y += 8
  }
  if (auto.descripcion) {
    campo(doc, 'Descripción', auto.descripcion, margin, y)
    y += 8
  }
  y += 6

  // ══════════════════════════════════════════════════════════
  // VEHÍCULO ENTREGADO COMO PARTE DE PAGO (si existe)
  // ══════════════════════════════════════════════════════════
  if (vehiculoEntregado) {
    y = seccion(doc, 'VEHÍCULO ENTREGADO COMO PARTE DE PAGO', y, pageWidth, margin)
    campo(doc, 'Marca', vehiculoEntregado.marca, margin, y)
    campo(doc, 'Modelo', vehiculoEntregado.modelo, col2, y)
    y += 8
    campo(doc, 'Año', vehiculoEntregado.año, margin, y)
    campo(doc, 'Kilometraje', vehiculoEntregado.km ? `${Number(vehiculoEntregado.km).toLocaleString('es-AR')} km` : '—', col2, y)
    y += 8
    campo(doc, 'Valor acordado', formatCurrency(vehiculoEntregado.valor), margin, y)
    y += 14
  }

  // ══════════════════════════════════════════════════════════
  // CONDICIONES ECONÓMICAS
  // ══════════════════════════════════════════════════════════
  y = seccion(doc, 'CONDICIONES ECONÓMICAS', y, pageWidth, margin)

  const saldoCash = vehiculoEntregado?.valor
    ? venta.precioFinal - Number(vehiculoEntregado.valor)
    : null

  const bodyEconomico = [
    ['Precio de venta', formatCurrency(venta.precioFinal)],
    ['Forma de pago', venta.tipoPago === 'contado' ? 'Contado' : `Financiado`],
    ...(venta.tipoPago === 'financiado' && venta.cuotas
      ? [
          [`Cantidad de cuotas`, `${venta.cuotas} cuotas`],
          [`Valor por cuota`, formatCurrency(venta.precioFinal / venta.cuotas)],
        ]
      : []),
    ...(vehiculoEntregado?.valor
      ? [
          [`Auto entregado (${[vehiculoEntregado.marca, vehiculoEntregado.modelo].filter(Boolean).join(' ')})`, `(${formatCurrency(vehiculoEntregado.valor)})`],
          [`Saldo en efectivo`, formatCurrency(saldoCash)],
        ]
      : []),
  ]

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Concepto', 'Importe']],
    body: bodyEconomico,
    headStyles: { fillColor: ROJO, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: GRIS_OSCURO },
    columnStyles: { 0: { cellWidth: 'auto' }, 1: { halign: 'right', cellWidth: 45 } },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    tableLineColor: GRIS_CLARO,
    tableLineWidth: 0.3,
  })

  y = doc.lastAutoTable.finalY + 16

  // ══════════════════════════════════════════════════════════
  // FIRMAS
  // ══════════════════════════════════════════════════════════
  if (y + 40 > pageHeight - 20) {
    doc.addPage()
    y = 20
  }

  const firmaAncho = (pageWidth - margin * 2 - 20) / 2
  const firma1X = margin
  const firma2X = margin + firmaAncho + 20

  doc.setDrawColor(...GRIS_MEDIO)
  doc.line(firma1X, y + 20, firma1X + firmaAncho, y + 20)
  doc.line(firma2X, y + 20, firma2X + firmaAncho, y + 20)

  doc.setFontSize(8)
  doc.setTextColor(...GRIS_MEDIO)
  doc.text('Firma del comprador', firma1X, y + 26)
  doc.text('Firma del vendedor', firma2X, y + 26)
  doc.text('Aclaración: ___________________________', firma1X, y + 34)
  doc.text('Aclaración: ___________________________', firma2X, y + 34)

  // ══════════════════════════════════════════════════════════
  // FOOTER
  // ══════════════════════════════════════════════════════════
  doc.setFontSize(7)
  doc.setTextColor(180, 180, 180)
  doc.text(
    'ICY Automotores — Documento interno. No válido como comprobante fiscal.',
    margin, pageHeight - 8
  )

  doc.save(`boleto-${venta.id.slice(0, 8)}.pdf`)
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

  autoTable(doc, {
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
