'use client'

import { useRef } from 'react'
import { useStock, FILTRO_INICIAL } from '../stock/StockProvider'
import { BRANDS } from '../../lib/brands'
import styles from './BrandGrid.module.css'

const ArrowIcon = ({ flip }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={flip ? { transform: 'scaleX(-1)' } : undefined}
    aria-hidden="true"
  >
    <path d="M9 6l6 6-6 6" />
  </svg>
)

// Grilla de marcas (réplica icyautomotores.com) como carrusel horizontal:
// swipe nativo en touch, flechas en desktop. Sin autoplay: las cards son
// botones que filtran el stock, y un carrusel que se mueve solo mientras
// alguien intenta tocar una marca es mala UX.
export default function BrandGrid() {
  const { setFiltro } = useStock()
  const trackRef = useRef(null)

  function elegir(nombre) {
    setFiltro({ ...FILTRO_INICIAL, marca: nombre })
    document.getElementById('stock')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function desplazar(dir) {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: 'smooth' })
  }

  return (
    <section className={styles.section} aria-label="Marcas">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Marcas</p>
        <h2 className={styles.title}>Elegí por marca</h2>
        <p className={styles.sub}>Encontrá tu próximo vehículo disponible</p>

        <div className={styles.carousel}>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowLeft}`}
            onClick={() => desplazar(-1)}
            aria-label="Marcas anteriores"
          >
            <ArrowIcon flip />
          </button>

          <ul ref={trackRef} className={styles.track}>
            {BRANDS.map(([slug, nombre]) => (
              <li key={slug} className={styles.item}>
                <button type="button" className={styles.card} onClick={() => elegir(nombre)}>
                  <img
                    className={styles.logo}
                    src={`/brands/${slug}.png`}
                    alt=""
                    loading="lazy"
                    draggable="false"
                  />
                  <span className={styles.name}>{nombre}</span>
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowRight}`}
            onClick={() => desplazar(1)}
            aria-label="Marcas siguientes"
          >
            <ArrowIcon />
          </button>
        </div>
      </div>
    </section>
  )
}
