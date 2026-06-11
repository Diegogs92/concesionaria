import { INSTAGRAM_URL, waLink } from '../../lib/site'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <img src="/logo.webp" alt="ICY Automotores" className={styles.logo} draggable="false" />
          <p className={styles.tagline}>
            Stock real, precios publicados y datos verificados.
          </p>
        </div>

        <nav className={styles.links} aria-label="Contacto">
          <a href={waLink('Hola, vengo de la web de ICY Automotores.')}>WhatsApp</a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href="/#stock">Catálogo</a>
        </nav>
      </div>

      <p className={styles.legal}>
        © {new Date().getFullYear()} ICY Automotores. Precios y disponibilidad sujetos a cambios sin previo aviso.
      </p>
    </footer>
  )
}
