import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAutoPublico } from '../../../lib/autos'
import { formatKm, formatPrecio } from '../../../lib/format'
import { waLink } from '../../../lib/site'
import Gallery from '../../../components/vehicle/Gallery'
import StickyBar from '../../../components/vehicle/StickyBar'
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
    {
      grupo: 'Motor y transmisión',
      datos: [
        ['Motor', auto.motor],
        ['Combustible', auto.combustible],
        ['Transmisión', auto.transmision],
        ['Tracción', auto.traccion],
      ],
    },
    {
      grupo: 'Carrocería',
      datos: [
        ['Carrocería', auto.carroceria],
        ['Puertas', auto.puertas],
        ['Color', auto.color],
      ],
    },
    {
      grupo: 'Datos generales',
      datos: [
        ['Año', auto.anio],
        ['Kilometraje', formatKm(auto.kilometraje)],
        ['Condición', auto.condicion],
      ],
    },
  ]
    .map(({ grupo, datos }) => ({ grupo, datos: datos.filter(([, v]) => v != null && v !== '') }))
    .filter(({ datos }) => datos.length > 0)

  const mensaje = `Hola, me interesa el ${titulo} que vi en la web. ¿Sigue disponible?`

  return (
    <main className={styles.page}>
      <header className={styles.top}>
        <Link href="/" className={styles.brand} aria-label="ICY Automotores, inicio">
          <img src="/logo.webp" alt="" className={`${styles.brandMark} ${styles.brandLight}`} draggable="false" />
          <img src="/logo-on-dark.webp" alt="" className={`${styles.brandMark} ${styles.brandDark}`} draggable="false" />
        </Link>
        <div className={styles.topActions}>
          <Link href="/#stock" className={styles.back}>
            Volver al stock
          </Link>
        </div>
      </header>

      <div className={styles.layout}>
        <Gallery fotos={auto.fotos} titulo={titulo} />

        <aside className={styles.panel}>
          <h1 className={styles.titulo}>{titulo}</h1>
          {auto.version && <p className={styles.version}>{auto.version}</p>}
          {meta && <p className={styles.meta}>{meta}</p>}

          <p className={styles.precio}>{formatPrecio(auto.precio)}</p>

          <a id="cta-principal" href={waLink(mensaje)} className={styles.cta}>
            Consultar por WhatsApp
          </a>

          {auto.descripcion && <p className={styles.descripcion}>{auto.descripcion}</p>}
        </aside>
      </div>

      {ficha.length > 0 && (
        <section className={styles.ficha} aria-label="Ficha técnica">
          <h2 className={styles.fichaTitulo}>Ficha técnica</h2>
          <div className={styles.grupos}>
            {ficha.map(({ grupo, datos }) => (
              <div key={grupo} className={styles.grupo}>
                <h3 className={styles.grupoTitulo}>{grupo}</h3>
                <dl className={styles.datos}>
                  {datos.map(([label, valor]) => (
                    <div key={label} className={styles.dato}>
                      <dt>{label}</dt>
                      <dd>{valor}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>
      )}
      <StickyBar titulo={titulo} precio={formatPrecio(auto.precio)} waUrl={waLink(mensaje)} />
    </main>
  )
}
