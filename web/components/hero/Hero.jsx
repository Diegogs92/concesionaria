import styles from './Hero.module.css'
import ParallaxFallback from './ParallaxFallback'
import ThemeToggle from '../theme/ThemeToggle'
import { waLink } from '../../lib/site'

const WHATSAPP_URL = waLink('Hola, vengo de la web de ICY Automotores.')

// Marcas con presencia en el stock (logos en public/brands/)
const BRANDS = [
  ['toyota', 'Toyota'],
  ['volkswagen', 'Volkswagen'],
  ['ford', 'Ford'],
  ['chevrolet', 'Chevrolet'],
  ['honda', 'Honda'],
  ['mercedes-benz', 'Mercedes-Benz'],
  ['hyundai', 'Hyundai'],
  ['fiat', 'Fiat'],
  ['renault', 'Renault'],
  ['citroen', 'Citroën'],
  ['peugeot', 'Peugeot'],
  ['ds', 'DS'],
]

function TickerGroup({ hidden }) {
  return (
    <div className={styles.tickerGroup} aria-hidden={hidden || undefined}>
      {BRANDS.map(([slug, name]) => (
        <img
          key={slug}
          className={styles.tickerLogo}
          src={`/brands/${slug}.png`}
          alt={hidden ? '' : name}
          title={name}
          loading="lazy"
          draggable="false"
        />
      ))}
    </div>
  )
}

// Cutouts fotográficos generados y procesados por scripts/process-vehicles.mjs
// (perfil 90°, mirando a la derecha, fondo transparente).

export default function Hero() {
  return (
    <section className={styles.hero}>
      <header className={styles.topbar}>
        <a href="/" className={styles.logo} aria-label="ICY Automotores, inicio">
          <img
            className={`${styles.logoMark} ${styles.logoLight}`}
            src="/logo.webp"
            alt=""
            loading="eager"
            draggable="false"
          />
          <img
            className={`${styles.logoMark} ${styles.logoDark}`}
            src="/logo-on-dark.webp"
            alt=""
            loading="eager"
            draggable="false"
          />
          <span className={styles.logoWord}>AUTOMOTORES</span>
        </a>
        <nav className={styles.nav}>
          <a href="#stock">Catálogo</a>
          <ThemeToggle />
          <a href={WHATSAPP_URL} className={styles.navCta}>WhatsApp</a>
        </nav>
      </header>

      <div className={styles.layout}>
        <div className={styles.content}>
          <p className={styles.kicker}>
            <span className={styles.liveDot} aria-hidden="true" />
            Concesionaria digital · Stock real, actualizado
          </p>
          <h1 className={styles.title}>
            Tu próximo vehículo<br />
            ya está <em className={styles.accent}>en movimiento.</em>
          </h1>
          <p className={styles.sub}>
            Autos y motos en stock, con precio publicado.
          </p>
          <div className={styles.actions}>
            <a href="#stock" className={styles.btnPrimary}>Ver el stock</a>
            <a href={WHATSAPP_URL} className={styles.btnGhost}>Escribinos por WhatsApp</a>
          </div>
        </div>

        {/* Vidriera: tres planos de profundidad con parallax de scroll (CSS puro) */}
        <div className={styles.stage} aria-hidden="true">
          <span className={styles.watermark} data-parallax="0.13">ICY</span>

          <div className={`${styles.layer} ${styles.layerBack}`} data-parallax="0.1">
            <div className={styles.roadBack} />
            <span className={`${styles.streak} ${styles.streakB1}`} />
            <span className={`${styles.streak} ${styles.streakRed} ${styles.streakB2}`} />
            <div className={`${styles.veh} ${styles.vehMoto}`}>
              <img src="/vehicles/moto.webp" alt="" loading="eager" draggable="false" />
              <div className={styles.shadow} />
            </div>
          </div>

          <div className={`${styles.layer} ${styles.layerMid}`} data-parallax="0.055">
            <div className={styles.roadMid} />
            <span className={`${styles.streak} ${styles.streakM1}`} />
            <span className={`${styles.streak} ${styles.streakRed} ${styles.streakM2}`} />
            <div className={`${styles.veh} ${styles.vehSedan}`}>
              <img className={styles.flip} src="/vehicles/sedan.webp" alt="" loading="eager" draggable="false" />
              <div className={styles.shadow} />
            </div>
          </div>

          <div className={`${styles.layer} ${styles.layerFront}`} data-parallax="0.02">
            <div className={styles.roadFront} />
            <span className={`${styles.streak} ${styles.streakRed} ${styles.streakF1}`} />
            <span className={`${styles.streak} ${styles.streakF2}`} />
            <div className={`${styles.veh} ${styles.vehSuv}`}>
              <img src="/vehicles/suv.webp" alt="" loading="eager" draggable="false" />
              <div className={styles.shadow} />
            </div>
          </div>
        </div>

        <ParallaxFallback />
      </div>

      {/* Cinta de marca: refuerza el "en movimiento" y cierra el hero */}
      <div className={styles.ticker}>
        <div className={styles.tickerTrack}>
          <TickerGroup />
          <TickerGroup hidden />
        </div>
      </div>
    </section>
  )
}
