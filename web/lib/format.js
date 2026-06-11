// Mismo formato de moneda que el sistema interno (src/utils/helpers.js).
export function formatPrecio(n) {
  if (n == null || isNaN(n)) return 'Consultar'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatKm(n) {
  if (n == null || n === '' || isNaN(n)) return null
  return `${Number(n).toLocaleString('es-AR')} km`
}
