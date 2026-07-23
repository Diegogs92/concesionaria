import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAutoPublico } from '../../../lib/autos'
import { formatKm, formatPrecio } from '../../../lib/format'
import { CITY } from '../../../lib/site'
import Gallery from '../../../components/vehicle/Gallery'
import SpecIcon from '../../../components/vehicle/SpecIcon'
import VehicleActions from '../../../components/vehicle/VehicleActions'
import styles from './page.module.css'

export const revalidate = 0

function tituloDe(auto) {
  return [auto.marca, auto.modelo, auto.anio].filter(Boolean).join(' ')
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const auto = await getAutoPublico(id).catch(() => null)
  if (!auto) return { title: 'Vehículo no encontrado | ICY Automotores' }

  const titulo = tituloDe(auto)
  const detalle = [auto.version, formatKm(auto.kilometraje), formatPrecio(auto.precio)]
    .filter(Boolean)
    .join(' · ')

  return {
    title: `${titulo} | ICY Automotores`,
    description: `${titulo}${detalle ? `: ${detalle}` : ''}. Publicado con datos verificados en ICY Automotores.`,
    openGraph: {
      title: `${titulo} | ICY Automotores`,
      description: detalle || 'Stock real, actualizado.',
      images: auto.fotos.slice(0, 1),
    },
  }
}

export default async function VehiculoPage({ params }) {
  const { id } = await params
  const auto = await getAutoPublico(id).catch(() => null)
  if (!auto) notFound()

  const titulo = tituloDe(auto)
  const meta = [auto.anio, formatKm(auto.kilometraje)].filter(Boolean).join(' · ')

  const ficha = [
    ['calendar', 'Año', auto.anio],
    ['gauge', 'Kilómetros', formatKm(auto.kilometraje)],
    ['gear', 'Transmisión', auto.transmision],
    ['engine', 'Motor', auto.motor],
    ['traction', 'Tracción', auto.traccion],
    ['body', 'Carrocería', auto.carroceria],
    ['fuel', 'Combustible', auto.combustible],
    ['doors', 'Puertas', auto.puertas],
    ['color', 'Color', auto.color],
    ['condition', 'Condición', auto.condicion],
    ['location', 'Ciudad', CITY],
  ].filter(([, , valor]) => valor != null && valor !== '')

  const mensaje = `Hola, me interesa el ${titulo} que vi en la web. ¿Sigue disponible?`

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <Link href="/#stock" className={styles.back}>
          ← Volver al stock
        </Link>
      </div>

      <div className={styles.layout}>
        <Gallery fotos={auto.fotos} titulo={titulo} />

        <aside className={styles.panel}>
          <h1 className={styles.titulo}>{titulo}</h1>
          {auto.version && <p className={styles.version}>{auto.version}</p>}
          {meta && <p className={styles.meta}>{meta}</p>}

          <p className={styles.precio}>{formatPrecio(auto.precio)}</p>

          <VehicleActions
            titulo={titulo}
            subtitulo={auto.version}
            precio={formatPrecio(auto.precio)}
            fotoUrl={auto.fotos?.[0] ?? null}
            fichaData={ficha.map(([, label, valor]) => [label, valor])}
            waMensaje={mensaje}
            fileName={`ficha-${[auto.marca, auto.modelo, auto.anio].filter(Boolean).join('-').replace(/\s+/g, '-').toLowerCase()}`}
          />

          {auto.descripcion && <p className={styles.descripcion}>{auto.descripcion}</p>}
        </aside>
      </div>

      {ficha.length > 0 && (
        <section className={styles.ficha} aria-label="Ficha técnica">
          <h2 className={styles.fichaTitulo}>Ficha técnica</h2>
          <div className={styles.specGrid}>
            {ficha.map(([icon, label, valor]) => (
              <div key={label} className={styles.specCard}>
                <span className={styles.specIcon}>
                  <SpecIcon name={icon} />
                </span>
                <span className={styles.specLabel}>{label}</span>
                <span className={styles.specValue}>{valor}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
