import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

const PAD = 60
const BG = { r: 28, g: 28, b: 30, alpha: 1 }
const RED = '#e51515'
const WHITE = '#ffffff'
const GRAY = '#aeaeb2'
const GRAY2 = '#6e6e73'
const FONT = 'Liberation Sans, Arial, sans-serif'

const DIMS = {
  post:  { W: 1080, H: 1080, photoH: 623 },
  story: { W: 1080, H: 1920, photoH: 960 },
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function adaptSize(text, base, minSize = 40) {
  const estimated = text.length * base * 0.58
  const maxW = 1080 - PAD * 2
  if (estimated <= maxW) return base
  return Math.max(minSize, Math.floor(base * maxW / estimated))
}

function buildSvg(tipo, auto) {
  const { W, H, photoH } = DIMS[tipo]
  const { marca, modelo, version, año, kilometraje, condicion, precio } = auto

  const title = [marca, modelo].filter(Boolean).map(s => s.toUpperCase()).join(' ')
  const baseSize = tipo === 'story' ? 88 : 72
  const titleSize = adaptSize(title, baseSize)

  const kmStr = kilometraje ? `${Number(kilometraje).toLocaleString('es-AR')} km` : null
  const añoStr = año ? String(año) : null
  const specStr = [añoStr, kmStr].filter(Boolean).join('  ·  ')
  const precioStr = precio ? `$ ${Number(precio).toLocaleString('es-AR')}` : null
  const condLabel = (condicion || 'USADO').toUpperCase()
  const condBadgeW = condLabel.length <= 5 ? 125 : 158

  // running Y cursor
  let y = photoH + 30

  y += titleSize + 8
  const titleY = y
  y += 14

  let versionY = null
  if (version) {
    const vSize = tipo === 'story' ? 34 : 28
    y += vSize + 10
    versionY = y
    y += 10
  }

  const specFontSize = tipo === 'story' ? 40 : 32
  let specY = null
  if (specStr) {
    y += specFontSize + 10
    specY = y
    y += 10
  }

  y += 22
  const badgeRectY = y
  const badgeH = tipo === 'story' ? 50 : 42
  const badgeFontSize = tipo === 'story' ? 24 : 22
  y += badgeH

  const precioFontSize = tipo === 'story' ? 88 : 68
  const precioY = H - 95

  const gradStart = Math.round(photoH * 0.3)
  const gradEnd = photoH + 50

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="${gradStart}" x2="0" y2="${gradEnd}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${BG.r === 28 ? '#1c1c1e' : '#1c1c1e'}" stop-opacity="0"/>
      <stop offset="100%" stop-color="#1c1c1e" stop-opacity="1"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="${W}" height="${gradEnd}" fill="url(#g)"/>

  <text x="${PAD}" y="${titleY}"
    font-family="${FONT}" font-weight="900" font-size="${titleSize}"
    fill="${WHITE}">${esc(title)}</text>

  ${version ? `<text x="${PAD}" y="${versionY}"
    font-family="${FONT}" font-size="${tipo === 'story' ? 34 : 28}"
    fill="${GRAY2}">${esc(version.toUpperCase())}</text>` : ''}

  ${specStr ? `<text x="${PAD}" y="${specY}"
    font-family="${FONT}" font-size="${specFontSize}"
    fill="${GRAY}">${esc(specStr)}</text>` : ''}

  <rect x="${PAD}" y="${badgeRectY}" width="${condBadgeW}" height="${badgeH}" rx="${badgeH / 2}" fill="${RED}"/>
  <text x="${PAD + condBadgeW / 2}" y="${badgeRectY + badgeH * 0.68}"
    font-family="${FONT}" font-weight="700" font-size="${badgeFontSize}"
    fill="${WHITE}" text-anchor="middle">${esc(condLabel)}</text>

  ${precioStr ? `<text x="${PAD}" y="${precioY}"
    font-family="${FONT}" font-weight="900" font-size="${precioFontSize}"
    fill="${RED}">${esc(precioStr)}</text>` : ''}

  <rect x="0" y="${H - 8}" width="${W}" height="8" fill="${RED}"/>
</svg>`
}

export async function generarImagenSocial(tipo, auto) {
  const { W, H, photoH } = DIMS[tipo]

  // 1. Background
  const bg = await sharp({
    create: { width: W, height: H, channels: 4, background: BG },
  }).png().toBuffer()

  const composites = []

  // 2. Vehicle photo
  const fotoUrl = auto.fotos?.[0] ?? auto.foto ?? null
  if (fotoUrl) {
    try {
      const res = await fetch(fotoUrl)
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer())
        const photoBuffer = await sharp(buf)
          .resize(W, photoH, { fit: 'cover', position: 'centre' })
          .toBuffer()
        composites.push({ input: photoBuffer, top: 0, left: 0 })
      }
    } catch {
      // sin foto → solo fondo oscuro
    }
  }

  // 3. SVG overlay (gradiente + textos + badge)
  const svgBuf = Buffer.from(buildSvg(tipo, auto))
  composites.push({ input: svgBuf, top: 0, left: 0 })

  // 4. Logo (esquina superior derecha)
  const logoPath = path.join(process.cwd(), 'public', 'logo.webp')
  if (fs.existsSync(logoPath)) {
    const logoW = 140
    const logoBuffer = await sharp(logoPath)
      .resize(logoW, null, { fit: 'inside' })
      .toBuffer()
    const meta = await sharp(logoBuffer).metadata()
    composites.push({
      input: logoBuffer,
      top: 40,
      left: W - logoW - 40,
    })
  }

  return sharp(bg).composite(composites).png().toBuffer()
}
