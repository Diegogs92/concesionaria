'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import styles from './Navbar.module.css'
import WhatsAppIcon from '../icons/WhatsAppIcon'
import { waLink } from '../../lib/site'

const WHATSAPP_URL = waLink('Hola, vengo de la web de ICY Automotores.')

// Barra fija, presente en todo el sitio (vive en el layout raíz). Solo la
// home tiene un hero oscuro debajo: ahí arranca transparente y se vuelve
// placa sólida al scrollear. En el resto de las páginas (sin hero) arranca
// directamente sólida, porque no hay nada oscuro contra lo cual "flotar".
export default function Navbar() {
  const pathname = usePathname()
  const esHome = pathname === '/'
  const [scrolled, setScrolled] = useState(!esHome)

  useEffect(() => {
    if (!esHome) {
      setScrolled(true)
      return
    }
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [esHome])

  return (
    <header className={styles.bar} data-scrolled={scrolled || undefined}>
      <a href="/" className={styles.logo} aria-label="ICY Automotores, inicio">
        <img
          className={styles.logoMark}
          src={scrolled ? '/logo.webp' : '/logo-on-dark.webp'}
          alt=""
          loading="eager"
          draggable="false"
        />
        <span className={styles.logoWord}>AUTOMOTORES</span>
      </a>
      <nav className={styles.nav}>
        <a href="/#stock">En stock</a>
        <a href="/#servicios">Servicios</a>
        <a href="/#contacto">Contacto</a>
        <a href={WHATSAPP_URL} className={styles.cta}>
          <WhatsAppIcon />
          WhatsApp
        </a>
      </nav>
    </header>
  )
}
