'use client'

import { useState, useRef, useCallback } from 'react'
import styles from './CardCarousel.module.css'

export default function CardCarousel({ fotos, titulo }) {
  const [idx, setIdx] = useState(0)
  const timerRef = useRef(null)
  const count = fotos.length

  const start = useCallback(() => {
    if (count < 2) return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setIdx(i => (i + 1) % count)
    }, 2200)
  }, [count])

  const stop = useCallback(() => {
    clearInterval(timerRef.current)
  }, [])

  if (!fotos[0]) {
    return <figure className={styles.carousel}><span className={styles.sinFoto}>Fotos en camino</span></figure>
  }

  return (
    <figure
      className={styles.carousel}
      onMouseEnter={start}
      onMouseLeave={stop}
    >
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
