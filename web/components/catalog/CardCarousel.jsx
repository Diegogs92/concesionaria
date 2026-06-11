'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './CardCarousel.module.css'

export default function CardCarousel({ fotos, titulo }) {
  const [idx, setIdx] = useState(0)
  const timerRef = useRef(null)
  const rootRef = useRef(null)
  const count = fotos.length

  useEffect(() => {
    if (count < 2) return
    const el = rootRef.current
    if (!el) return

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        timerRef.current = setInterval(() => setIdx(i => (i + 1) % count), 2200)
      } else {
        clearInterval(timerRef.current)
      }
    }, { threshold: 0.25 })

    obs.observe(el)
    return () => { obs.disconnect(); clearInterval(timerRef.current) }
  }, [count])

  if (!fotos[0]) {
    return <figure className={styles.carousel}><span className={styles.sinFoto}>Fotos en camino</span></figure>
  }

  return (
    <figure ref={rootRef} className={styles.carousel}>
      {fotos.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={i === 0 ? titulo : ''}
          loading={i === 0 ? 'eager' : 'lazy'}
          className={styles.slide}
          data-active={String(i === idx)}
        />
      ))}
      {count > 1 && (
        <div className={styles.dots} aria-hidden="true">
          {fotos.map((_, i) => (
            <span key={i} className={i === idx ? styles.dotActive : styles.dot} />
          ))}
        </div>
      )}
    </figure>
  )
}
