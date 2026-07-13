import {
  ADDRESS,
  EMAIL,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  MAPS_URL,
  WHATSAPP_DISPLAY,
  waLink,
} from '../../lib/site'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer id="contacto" className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.brand}>
          <img src="/logo.webp" alt="ICY Automotores" className={styles.logo} draggable="false" />
          <p className={styles.tagline}>
            Compra y venta de vehículos usados y 0KM en Tucumán. Asesoramiento
            personalizado y financiación disponible.
          </p>
        </div>

        <div className={styles.col}>
          <p className={styles.heading}>Navegación</p>
          <nav className={styles.links} aria-label="Navegación">
            <a href="/#stock">En Stock</a>
            <a href={waLink('Hola, quiero vender mi vehículo.')}>Vendé tu Vehículo</a>
            <a href="/#contacto">Contacto</a>
          </nav>
        </div>

        <div className={styles.col}>
          <p className={styles.heading}>Contacto</p>
          <ul className={styles.contact}>
            <li>
              <a href={MAPS_URL} target="_blank" rel="noopener noreferrer">{ADDRESS}</a>
            </li>
            <li>
              <a href={waLink('Hola, vengo de la web de ICY Automotores.')}>
                WhatsApp: {WHATSAPP_DISPLAY}
              </a>
            </li>
            <li>
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            </li>
            <li>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">{INSTAGRAM_HANDLE}</a>
            </li>
          </ul>
        </div>
      </div>

      <p className={styles.legal}>
        © {new Date().getFullYear()} ICY Automotores. Todos los derechos reservados.
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
