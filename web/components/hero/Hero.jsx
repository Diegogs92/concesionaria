'use client'

import { useEffect, useState } from 'react'
import styles from './Hero.module.css'
import SearchCard from './SearchCard'

// Palabra que rota en el titular (tipo slot), igual que la referencia.
const WORDS = ['auto', 'moto']
const ROTATE_MS = 3000

// Hero réplica de icyautomotores.com: pantalla completa, contenido centrado
// sobre una foto de auto desenfocada, con logo, ubicación, titular con palabra
// rotante y la tarjeta de búsqueda. El fondo usa el recorte del auto (no hay
// foto full-bleed en assets) desenfocado sobre un degradado oscuro.
export default function Hero() {
  const [i, setI] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setI((n) => (n + 1) % WORDS.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <section className={styles.hero}>
      <div className={styles.bg} aria-hidden="true" />
      <div className={styles.overlay} aria-hidden="true" />

      <div className={styles.content}>
        <img
          className={styles.logo}
          src="/logo-on-dark.webp"
          alt="ICY Automotores"
          width="160"
          height="54"
          draggable="false"
        />

        <p className={styles.location}>Tucumán, Argentina</p>

        <h1 className={styles.title}>
          <span className={styles.medium}>Tu próximo </span>
          <span className={styles.slot} aria-live="polite">
            <span key={i} className={styles.slotWord}>{WORDS[i]}</span>
          </span>
          <span className={styles.medium}>, </span>
          <span className={styles.bold}>sin vueltas.</span>
        </h1>

        <p className={styles.sub}>
          Venta de usados y 0KM con asesoramiento personalizado.
        </p>

        <div className={styles.search}>
          <SearchCard />
        </div>
      </div>
    </section>
  )
}
