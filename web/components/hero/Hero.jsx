'use client'

import { useEffect, useState } from 'react'
import styles from './Hero.module.css'
import HeadlightScene from './HeadlightScene'
import { waLink } from '../../lib/site'
import { VEHICLES, VEHICLE_KEYS } from './vehicles'

// Cada cuánto rota el vehículo y cuánto dura el fundido del cambio.
const ROTATE_MS = 5000
const FADE_MS = 360

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

// El hero es siempre oscuro (#050505), independiente del tema del resto de
// la página: un estacionamiento con las luces apagadas donde el vehículo
// "enciende" los faros (ver HeadlightScene).
export default function Hero() {
  // Rotación auto↔moto cada 5s: el titular y la imagen cambian juntos. El
  // fundido apaga (visible=false), recién ahí swapea el índice y vuelve a
  // encender, así el cambio sucede oculto.
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (VEHICLE_KEYS.length < 2) return
    let swap
    const tick = setInterval(() => {
      setVisible(false)
      swap = setTimeout(() => {
        setIndex((n) => (n + 1) % VEHICLE_KEYS.length)
        setVisible(true)
      }, FADE_MS)
    }, ROTATE_MS)
    return () => {
      clearInterval(tick)
      clearTimeout(swap)
    }
  }, [])

  const vehicle = VEHICLES[VEHICLE_KEYS[index]]

  return (
    <section className={styles.hero}>
      <header className={styles.topbar}>
        <a href="/" className={styles.logo} aria-label="ICY Automotores, inicio">
          <img
            className={styles.logoMark}
            src="/logo-on-dark.webp"
            alt=""
            loading="eager"
            draggable="false"
          />
          <span className={styles.logoWord}>AUTOMOTORES</span>
        </a>
        <nav className={styles.nav}>
          <a href="#stock">Catálogo</a>
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
            <span
              className={styles.lead}
              style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(8px)' }}
            >
              {vehicle.lead}
            </span>
            <br />
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

        <HeadlightScene vehicle={vehicle} visible={visible} />
      </div>

      {/* Cinta de marca: cierra el hero */}
      <div className={styles.ticker}>
        <div className={styles.tickerTrack}>
          <TickerGroup />
          <TickerGroup hidden />
        </div>
      </div>
    </section>
  )
}
