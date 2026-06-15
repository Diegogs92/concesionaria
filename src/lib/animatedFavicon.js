// Anima el favicon existente (PNG) sin reemplazar el logo: lo redibuja en un
// canvas cada frame y le pasa un brillo diagonal sutil que recorre el ícono.
// Chrome no anima favicons SVG, por eso se actualiza el href vía JS/canvas.
export function initAnimatedFavicon({
  src,
  size = 64,
  highlight = 'rgba(255,255,255,0.30)',
  period = 3600, // duración del ciclo completo (ms)
  sweep = 900, // duración del brillo dentro del ciclo (ms)
} = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {}

  // Respetar a quien prefiere menos movimiento: dejamos el favicon estático.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return () => {}

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

  // Un único <link> propio que controlamos (no tocamos los originales).
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
    grad.addColorStop(0.5, highlight)
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.globalCompositeOperation = 'source-atop' // solo pinta sobre el ícono
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
      // Al terminar el barrido, dejamos el ícono limpio una sola vez.
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
  // Si falla la carga, no hacemos nada: queda el favicon estático original.
  img.src = src

  return () => cancelAnimationFrame(raf)
}
