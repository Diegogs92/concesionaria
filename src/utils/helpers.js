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
