import { getAutosPublicos } from '../../lib/autos'
import { waLink } from '../../lib/site'
import CatalogGrid from './CatalogGrid'
import styles from './Catalog.module.css'

export default async function Catalog() {
  let autos = []
  let fallo = false
  try {
    autos = await getAutosPublicos()
  } catch {
    fallo = true
  }

  return (
    <section id="stock" className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.title}>Stock disponible</h2>
        {autos.length > 0 && (
          <p className={styles.count}>
            {autos.length} {autos.length === 1 ? 'vehículo disponible' : 'vehículos disponibles'}
          </p>
        )}
      </header>

      {autos.length > 0 ? (
        <CatalogGrid autos={autos} />
      ) : (
        <div className={styles.empty}>
          {fallo ? (
            <>
              <h3 className={styles.emptyTitle}>No pudimos cargar el stock.</h3>
              <p className={styles.emptyText}>
                Probá recargar la página en unos segundos. Si seguís sin verlo,
                escribinos y te pasamos lo disponible por WhatsApp.
              </p>
            </>
          ) : (
            <>
              <h3 className={styles.emptyTitle}>El catálogo se publica en breve.</h3>
              <p className={styles.emptyText}>
                Estamos cargando el stock. Mientras tanto, escribinos por WhatsApp
                y te contamos qué hay disponible hoy.
              </p>
            </>
          )}
          <a href={waLink('Hola, quiero saber qué vehículos tienen disponibles.')} className={styles.emptyCta}>
            Escribinos por WhatsApp
          </a>
        </div>
      )}
    </section>
  )
}
