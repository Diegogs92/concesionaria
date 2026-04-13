// ===================================================================
// UTILIDADES GENERALES
// ===================================================================

/**
 * Genera un ID único basado en timestamp + random.
 * Reemplazar por UUID real si se migra a backend.
 */
export function generateId(prefix = '') {
  return `${prefix}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Formatea un número como moneda argentina (ARS).
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '$0'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formatea una fecha ISO a formato legible.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`
}

/**
 * Devuelve la fecha de hoy en formato YYYY-MM-DD.
 */
export function today() {
  return new Date().toISOString().split('T')[0]
}

/**
 * Devuelve las iniciales de un nombre (máx. 2 caracteres).
 */
export function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

/**
 * Agrupa un array de objetos por el valor de una propiedad.
 * groupBy([{mes:'Ene', v:1},{mes:'Ene', v:2}], 'mes')
 * => { 'Ene': [{...},{...}] }
 */
export function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key]
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})
}

/**
 * Devuelve el nombre del mes abreviado dado un string YYYY-MM-DD.
 */
export function getMonthLabel(dateStr) {
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const month = parseInt(dateStr?.split('-')[1]) - 1
  return months[month] ?? '?'
}

/**
 * Suma una propiedad numérica de un array de objetos.
 */
export function sumBy(arr, key) {
  return arr.reduce((acc, item) => acc + (Number(item[key]) || 0), 0)
}

/**
 * Genera datos de ventas agrupados por mes para gráficos.
 * Devuelve los últimos N meses.
 */
export function getVentasPorMes(ventas, meses = 6) {
  const now = new Date()
  const result = []

  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const key = `${year}-${month}`
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    const label = months[d.getMonth()]

    const ventasDelMes = ventas.filter(v => v.fecha?.startsWith(key))
    result.push({
      mes: label,
      ventas: ventasDelMes.length,
      ganancias: sumBy(ventasDelMes, 'ganancia'),
      ingresos: sumBy(ventasDelMes, 'precioFinal'),
    })
  }

  return result
}

/**
 * Calcula el ranking de vendedores por cantidad de ventas y comisiones.
 */
export function getRankingVendedores(ventas, usuarios) {
  const empleados = usuarios.filter(u => u.rol === 'empleado')
  return empleados
    .map(emp => {
      const ventasEmp = ventas.filter(v => v.vendedorId === emp.id)
      return {
        id: emp.id,
        nombre: emp.nombre,
        ventas: ventasEmp.length,
        comision: sumBy(ventasEmp, 'comisionVendedor'),
        total: sumBy(ventasEmp, 'precioFinal'),
      }
    })
    .sort((a, b) => b.ventas - a.ventas)
}

/**
 * Calcula días transcurridos desde una fecha hasta hoy.
 */
export function diffDays(dateStr) {
  if (!dateStr) return 0
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  return Math.floor((now - d) / (1000 * 60 * 60 * 24))
}

/**
 * Filtra un array por rango de fechas en un campo específico.
 */
export function filterByDateRange(arr, field, fromDate, toDate) {
  if (!fromDate || !toDate) return arr
  return arr.filter(item => {
    const itemDate = item[field]
    return itemDate >= fromDate && itemDate <= toDate
  })
}

/**
 * Exporta array de objetos a CSV y lo descarga.
 */
export function exportToCSV(rows, filename = 'export.csv') {
  if (!rows || rows.length === 0) return

  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h]
        if (val == null) return ''
        if (typeof val === 'string' && val.includes(',')) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val
      }).join(',')
    )
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Calcula margen promedio por marca de auto.
 */
export function getMargenPorMarca(autos, ventas) {
  const marcas = {}
  ventas.forEach(venta => {
    const auto = autos.find(a => a.id === venta.autoId)
    if (!auto) return
    if (!marcas[auto.marca]) {
      marcas[auto.marca] = { ventas: 0, margenTotal: 0, ingresoTotal: 0 }
    }
    marcas[auto.marca].ventas += 1
    marcas[auto.marca].margenTotal += venta.ganancia || 0
    marcas[auto.marca].ingresoTotal += venta.precioFinal || 0
  })

  return Object.entries(marcas)
    .map(([marca, data]) => ({
      marca,
      ventasTotales: data.ventas,
      margenPromedio: data.ventas > 0 ? data.margenTotal / data.ventas : 0,
      ingresoTotal: data.ingresoTotal,
    }))
    .sort((a, b) => b.margenPromedio - a.margenPromedio)
}

/**
 * Extiende el ranking de vendedores con margen promedio.
 */
export function getMargenPorVendedor(ventas, usuarios) {
  const ranking = getRankingVendedores(ventas, usuarios)
  return ranking.map(emp => ({
    ...emp,
    margenPromedio: emp.ventas > 0 ? (sumBy(ventas.filter(v => v.vendedorId === emp.id), 'ganancia') / emp.ventas) : 0,
  }))
}
