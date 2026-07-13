import Link from 'next/link'
import { formatKm, formatPrecio } from '../../lib/format'
import CardCarousel from './CardCarousel'
import styles from './Catalog.module.css'

// Ventana de "recién cargado": suficiente para que un vehículo se sienta
// nuevo en el catálogo sin que la etiqueta pierda sentido con el tiempo.
const NOVEDAD_DIAS = 14

function esReciente(auto) {
  if (!auto.createdAt) return false
  const dias = (Date.now() - new Date(auto.createdAt).getTime()) / 86_400_000
  return dias >= 0 && dias <= NOVEDAD_DIAS
}

const ZapIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
  </svg>
)

const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6Z" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

// "Usado" no aporta información (es un lote de usados: se da por sentado).
// En su lugar, el badge comunica algo real: 0 km si es 0km, Novedad si se
// cargó hace poco, Disponible como default para el resto.
function badgeDe(auto) {
  if (auto.condicion === 'Nuevo') return { texto: '0 km', tono: 'zerokm', Icono: ZapIcon }
  if (esReciente(auto)) return { texto: 'Novedad', tono: 'novedad', Icono: SparkleIcon }
  return { texto: 'Disponible', tono: 'disponible', Icono: CheckIcon }
}

export default function VehicleCard({ auto }) {
  const meta = [auto.anio, formatKm(auto.kilometraje)].filter(Boolean).join(' · ')
  const { texto, tono, Icono } = badgeDe(auto)

  return (
    <li className={styles.card}>
      <Link href={`/vehiculo/${auto.id}`} className={styles.cardLink}>
        <div className={styles.mediaWrap}>
          <CardCarousel fotos={auto.fotos} titulo={`${auto.marca} ${auto.modelo}`} />
          <span className={styles.badge} data-tono={tono}>
            <Icono />
            {texto}
          </span>
        </div>
        <div className={styles.info}>
          <h3 className={styles.cardTitle}>
            {auto.marca} {auto.modelo}
          </h3>
          {auto.version && <p className={styles.version}>{auto.version}</p>}
          {meta && <p className={styles.meta}>{meta}</p>}
          <p className={styles.precio}>{formatPrecio(auto.precio)}</p>
          <span className={styles.verDetalles}>Ver detalles</span>
        </div>
      </Link>
    </li>
  )
}
