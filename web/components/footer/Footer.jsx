import { ADDRESS, INSTAGRAM_URL, MAPS_URL, waLink } from '../../lib/site'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <img src="/logo.webp" alt="ICY Automotores" className={`${styles.logo} ${styles.logoLight}`} draggable="false" />
          <img src="/logo-on-dark.webp" alt="ICY Automotores" className={`${styles.logo} ${styles.logoDark}`} draggable="false" />
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.address}
          >
            {ADDRESS}
          </a>
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

      <p className={styles.credit}>
        Desarrollado por{' '}
        <a
          href="https://wa.me/543815151163"
          target="_blank"
          rel="noopener noreferrer"
        >
          DGS Solutions
        </a>
      </p>
    </footer>
  )
}
