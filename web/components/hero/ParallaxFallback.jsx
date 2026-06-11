'use client'

import { useEffect } from 'react'

// Fallback del parallax para navegadores sin CSS scroll-driven animations
// (animation-timeline: view()). Escribe transforms directo al DOM vía rAF,
// sin pasar por estado de React. Si hay soporte nativo, no hace nada.
export default function ParallaxFallback() {
  useEffect(() => {
    if (CSS.supports('animation-timeline: view()')) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const layers = Array.from(document.querySelectorAll('[data-parallax]'))
    if (layers.length === 0) return

    let raf = 0
    const update = () => {
      raf = 0
      const y = Math.min(window.scrollY, window.innerHeight)
      for (const el of layers) {
        el.style.transform = `translate3d(0, ${y * Number(el.dataset.parallax)}px, 0)`
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return null
}
