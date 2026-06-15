'use client'

import { useEffect } from 'react'

// Anima el favicon existente (el logo de ICY) sin reemplazarlo: lo redibuja en
// un canvas con un brillo diagonal sutil que lo recorre. Chrome no anima
// favicons SVG, por eso actualizamos el href vía JS/canvas.
export default function AnimatedFavicon({ size = 64, period = 3600, sweep = 900 }) {
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Usamos como fuente el favicon que Next ya inyectó (el logo de ICY).
    const original = document.querySelector('link[rel~="icon"]:not([data-animated])')
    const baseSrc = original?.getAttribute('href') || '/icon.png'

    let link = document.querySelector('link[rel~="icon"][data-animated]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      link.type = 'image/png'
      link.setAttribute('data-animated', '')
      document.head.appendChild(link)
    }

    const img = new Image()
    img.decoding = 'async'

    let raf = 0
    let startTs = 0
    let phase = 'init'

    const drawBase = () => {
      ctx.clearRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
    }

    const drawSweep = (p) => {
      drawBase()
      const span = size * 1.6
      const center = -span / 2 + p * (size + span)
      const grad = ctx.createLinearGradient(center - span / 2, 0, center + span / 2, size)
      grad.addColorStop(0, 'rgba(255,255,255,0)')
      grad.addColorStop(0.5, 'rgba(255,255,255,0.30)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.globalCompositeOperation = 'source-atop'
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, size, size)
      ctx.globalCompositeOperation = 'source-over'
    }

    const commit = () => {
      link.href = canvas.toDataURL('image/png')
    }

    const render = (t) => {
      raf = requestAnimationFrame(render)
      if (document.hidden) return
      if (!startTs) startTs = t
      const elapsed = (t - startTs) % period

      if (elapsed < sweep) {
        drawSweep(elapsed / sweep)
        commit()
        phase = 'sweep'
      } else if (phase !== 'rest') {
        drawBase()
        commit()
        phase = 'rest'
      }
    }

    img.onload = () => {
      drawBase()
      commit()
      raf = requestAnimationFrame(render)
    }
    img.src = baseSrc

    return () => cancelAnimationFrame(raf)
  }, [size, period, sweep])

  return null
}
