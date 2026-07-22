import React, { useState, useMemo } from 'react'
import { FileBarChart, Download } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, filterByDateRange, exportToCSV, today, sumBy } from '../utils/helpers'
import { generateVentasReportPDF } from '../utils/pdfGenerator'
import * as XLSX from 'xlsx'

export default function ReportesPage() {
  const { autos, clientes, ventas, egresos } = useApp()
  const { usuarios } = useAuth()

  const [tipoReporte, setTipoReporte] = useState('ventas')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState(today())

  const reporteFiltraado = useMemo(() => {
    let data = []

    if (tipoReporte === 'ventas') {
      data = filterByDateRange(ventas, 'fecha', fechaDesde, fechaHasta).map(v => ({
        ID: v.id,
        'Fecha': v.fecha,
        'Auto': `${autos.find(a => a.id === v.autoId)?.marca || '?'} ${autos.find(a => a.id === v.autoId)?.modelo || '?'}`,
        'Cliente': clientes.find(c => c.id === v.clienteId)?.nombre || '?',
        'Vendedor': usuarios.find(u => u.id === v.vendedorId)?.nombre || '?',
        'Precio Final': v.precioFinal,
        'Ganancia': v.ganancia,
        'Comisión': v.comisionVendedor,
      }))
    } else if (tipoReporte === 'egresos') {
      data = filterByDateRange(egresos.filter(e => !e.isVirtual), 'fecha', fechaDesde, fechaHasta).map(e => ({
        ID: e.id,
        'Fecha': e.fecha,
        'Tipo': e.tipo,
        'Descripción': e.descripcion,
        'Monto': e.monto,
      }))
    } else if (tipoReporte === 'comisiones') {
      const ventasFiltraadas = filterByDateRange(ventas, 'fecha', fechaDesde, fechaHasta)
      data = usuarios
        .filter(u => u.rol === 'vendedor')
        .map(u => {
          const ventasEmp = ventasFiltraadas.filter(v => v.vendedorId === u.id)
          return {
            'Vendedor': u.nombre,
            'Cantidad Ventas': ventasEmp.length,
            'Monto Total Ventas': sumBy(ventasEmp, 'precioFinal'),
            'Ganancia Total': sumBy(ventasEmp, 'ganancia'),
            'Comisión Total': sumBy(ventasEmp, 'comisionVendedor'),
            'Comisión %': u.comision,
          }
        })
        .filter(d => d['Cantidad Ventas'] > 0)
    }

    return data
  }, [tipoReporte, fechaDesde, fechaHasta, ventas, egresos, autos, clientes, usuarios])

  function exportarPDF() {
    if (tipoReporte === 'ventas') {
      generateVentasReportPDF(
        filterByDateRange(ventas, 'fecha', fechaDesde, fechaHasta),
        autos,
        clientes,
        usuarios
      )
    } else {
      alert('Exportar a PDF solo está disponible para reportes de ventas.')
    }
  }

  function exportarExcel() {
    const ws = XLSX.utils.json_to_sheet(reporteFiltraado)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte')
    XLSX.writeFile(wb, `reporte-${tipoReporte}-${today()}.xlsx`)
  }

  function exportarCSV() {
    exportToCSV(reporteFiltraado, `reporte-${tipoReporte}-${today()}.csv`)
  }

  const titulos = {
    ventas: 'Reporte de Ventas',
    egresos: 'Reporte de Egresos',
    comisiones: 'Reporte de Comisiones',
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Exporta datos en PDF, Excel o CSV</p>
        </div>
      </div>

      <div className="card card-padding">
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Filtros</h3>

          <div className="form-grid" style={{ gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Tipo de reporte</label>
              <select className="form-input form-select" value={tipoReporte} onChange={e => setTipoReporte(e.target.value)}>
                <option value="ventas">Ventas</option>
                <option value="egresos">Egresos</option>
                <option value="comisiones">Comisiones</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Desde</label>
              <input type="date" className="form-input" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">Hasta</label>
              <input type="date" className="form-input" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>{titulos[tipoReporte]}</h3>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 16 }}>
            {reporteFiltraado.length} registros
          </p>

          <div className="table-wrapper reporte-table-wrapper" style={{ marginBottom: 20, maxHeight: '400px', border: '1px solid var(--border-color)' }}>
            {reporteFiltraado.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><FileBarChart size={24} /></div>
                <p>No hay datos para el período seleccionado.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-input)' }}>
                    {Object.keys(reporteFiltraado[0]).map(header => (
                      <th key={header} className="reporte-table-cell" style={{ textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reporteFiltraado.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--divider)' }}>
                      {Object.values(row).map((val, i) => (
                        <td key={i} className="reporte-table-cell" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                          {typeof val === 'number' && val > 1000 ? formatCurrency(val) : val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex gap-2" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {tipoReporte === 'ventas' && (
            <button className="btn btn-primary btn--icon-down" onClick={exportarPDF}>
              <Download size={16} /> Exportar PDF
            </button>
          )}
          <button className="btn btn-secondary btn--icon-down" onClick={exportarExcel}>
            <Download size={16} /> Exportar Excel
          </button>
          <button className="btn btn-secondary btn--icon-down" onClick={exportarCSV}>
            <Download size={16} /> Exportar CSV
          </button>
        </div>
      </div>
    </>
  )
}
