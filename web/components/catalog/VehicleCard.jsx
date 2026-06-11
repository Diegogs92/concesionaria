import Link from 'next/link'
import { formatKm, formatPrecio } from '../../lib/format'
import CardCarousel from './CardCarousel'
import styles from './Catalog.module.css'

export default function VehicleCard({ auto }) {
  const meta = [auto.anio, formatKm(auto.kilometraje)].filter(Boolean).join(' · ')

  return (
    <li className={styles.card}>
      <Link href={`/vehiculo/${auto.id}`} className={styles.cardLink}>
        <CardCarousel fotos={auto.fotos} titulo={`${auto.marca} ${auto.modelo}`} />
        <div className={styles.info}>
          <h3 className={styles.cardTitle}>
            {auto.marca} {auto.modelo}
          </h3>
          {auto.version && <p className={styles.version}>{auto.version}</p>}
          {meta && <p className={styles.meta}>{meta}</p>}
          <p className={styles.precio}>{formatPrecio(auto.precio)}</p>
        </div>
      </Link>
    </li>
  )
}
