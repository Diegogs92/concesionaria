'use client'

import { useEffect, useState } from 'react'
import styles from './StickyBar.module.css'

export default function StickyBar({ titulo, precio, waUrl }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const cta = document.getElementById('cta-principal')
    if (!cta) return
    const obs = new IntersectionObserver(([e]) => setVisible(!e.isIntersecting), { threshold: 0 })
    obs.observe(cta)
    return () => obs.disconnect()
  }, [])

  return (
    <div className={styles.bar} data-visible={String(visible)} aria-hidden={String(!visible)}>
      <div className={styles.inner}>
        <div className={styles.info}>
          <span className={styles.titulo}>{titulo}</span>
          <span className={styles.precio}>{precio}</span>
        </div>
        <a href={waUrl} className={styles.cta}>Consultar por WhatsApp</a>
      </div>
    </div>
  )
}
