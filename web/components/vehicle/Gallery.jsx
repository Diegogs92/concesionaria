'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './Gallery.module.css'

const AUTO_DELAY   = 4000
const RESUME_AFTER = 7000

export default function Gallery({ fotos, titulo }) {
  const [idx, setIdx] = useState(0)
  const timerRef  = useRef(null)
  const resumeRef = useRef(null)
  const count = fotos.length

  const startAuto = useCallback(() => {
    if (count < 2) return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % count), AUTO_DELAY)
  }, [count])

  const pauseAuto = useCallback(() => {
    clearInterval(timerRef.current)
    clearTimeout(resumeRef.current)
    resumeRef.current = setTimeout(startAuto, RESUME_AFTER)
  }, [startAuto])

  useEffect(() => {
    startAuto()
    return () => { clearInterval(timerRef.current); clearTimeout(resumeRef.current) }
  }, [startAuto])

  const go = useCallback((dir) => {
    setIdx(i => (i + dir + count) % count)
    pauseAuto()
  }, [count, pauseAuto])

  const goTo = useCallback((i) => {
    setIdx(i)
    pauseAuto()
  }, [pauseAuto])

  if (fotos.length === 0) {
    return (
      <div className={styles.vacio}>
        <span>Fotos en camino. Pedilas por WhatsApp y te las mandamos hoy.</span>
      </div>
    )
  }

  return (
    <div>
      <figure className={styles.main}>
        {fotos.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={i === 0 ? `${titulo}, foto ${i + 1} de ${count}` : ''}
            loading={i === 0 ? 'eager' : 'lazy'}
            className={styles.slide}
            data-active={String(i === idx)}
          />
        ))}

        {count > 1 && (
          <>
            <button className={`${styles.arrow} ${styles.arrowPrev}`} onClick={() => go(-1)} aria-label="Foto anterior">
              ‹
            </button>
            <button className={`${styles.arrow} ${styles.arrowNext}`} onClick={() => go(1)} aria-label="Siguiente foto">
              ›
            </button>
            <div className={styles.dots} aria-hidden="true">
              {fotos.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} className={i === idx ? styles.dotActive : styles.dot} aria-label={`Foto ${i + 1}`} />
              ))}
            </div>
          </>
        )}
      </figure>

      {fotos.length > 1 && (
        <div className={styles.thumbs} role="group" aria-label="Elegir foto">
          {fotos.map((src, i) => (
            <button
              key={src}
              type="button"
              className={i === idx ? styles.thumbActive : styles.thumb}
              aria-label={`Foto ${i + 1}`}
              aria-pressed={i === idx}
              onClick={() => goTo(i)}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
