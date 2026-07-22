import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { WHATSAPP_DISPLAY, INSTAGRAM_HANDLE } from './site'

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

// ─── Flyer con lista de precios (múltiples vehículos) ─────────────────────

const FLYER_DIMS = {
  story: { W: 1080, H: 1920, headerH: 220, footerH: 110, rowH: 190, thumb: 150 },
  post:  { W: 1080, H: 1080, headerH: 130, footerH: 70,  rowH: 108, thumb: 88 },
}

function buildFlyerSvg(tipo, autos) {
  const { W, H, headerH, footerH, rowH, thumb } = FLYER_DIMS[tipo]
  const titleSize = tipo === 'story' ? 52 : 36
  const rowTitleSize = tipo === 'story' ? 34 : 24
  const rowSpecSize = tipo === 'story' ? 24 : 18
  const priceSize = tipo === 'story' ? 34 : 24

  const rows = autos.map((auto, i) => {
    const rowY = headerH + i * rowH
    const midY = rowY + thumb / 2
    const textX = PAD + thumb + 24

    const title = [auto.marca, auto.modelo].filter(Boolean).map(s => String(s).toUpperCase()).join(' ')
    const kmStr = auto.kilometraje ? `${Number(auto.kilometraje).toLocaleString('es-AR')} km` : null
    const specStr = [auto.año ? String(auto.año) : null, kmStr].filter(Boolean).join('  ·  ')
    const precioStr = auto.precio ? `$ ${Number(auto.precio).toLocaleString('es-AR')}` : 'Consultar'

    return `
      <text x="${textX}" y="${midY - 6}" font-family="${FONT}" font-weight="700" font-size="${rowTitleSize}" fill="${WHITE}">${esc(title)}</text>
      ${specStr ? `<text x="${textX}" y="${midY + rowSpecSize + 2}" font-family="${FONT}" font-size="${rowSpecSize}" fill="${GRAY}">${esc(specStr)}</text>` : ''}
      <text x="${W - PAD}" y="${midY + priceSize / 3}" font-family="${FONT}" font-weight="900" font-size="${priceSize}" fill="${RED}" text-anchor="end">${esc(precioStr)}</text>
      ${i < autos.length - 1 ? `<line x1="${PAD}" y1="${rowY + rowH - 1}" x2="${W - PAD}" y2="${rowY + rowH - 1}" stroke="${GRAY2}" stroke-opacity="0.25" stroke-width="1"/>` : ''}
    `
  }).join('')

  const contactoStr = `${WHATSAPP_DISPLAY}  ·  ${INSTAGRAM_HANDLE}`

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${W}" height="${H}" fill="${BG.r === 28 ? '#1c1c1e' : '#1c1c1e'}"/>

  <text x="${PAD}" y="${headerH * 0.62}" font-family="${FONT}" font-weight="900" font-size="${titleSize}" fill="${WHITE}">STOCK DISPONIBLE</text>

  ${rows}

  <line x1="${PAD}" y1="${H - footerH}" x2="${W - PAD}" y2="${H - footerH}" stroke="${RED}" stroke-width="2"/>
  <text x="${W / 2}" y="${H - footerH / 2 + 6}" font-family="${FONT}" font-size="${tipo === 'story' ? 26 : 20}" fill="${GRAY}" text-anchor="middle">${esc(contactoStr)}</text>

  <rect x="0" y="${H - 8}" width="${W}" height="8" fill="${RED}"/>
</svg>`
}

export async function generarImagenSocialMultiple(tipo, autos) {
  const { W, H, rowH, thumb } = FLYER_DIMS[tipo]

  const bg = await sharp({
    create: { width: W, height: H, channels: 4, background: BG },
  }).png().toBuffer()

  const composites = []

  for (let i = 0; i < autos.length; i++) {
    const auto = autos[i]
    const fotoUrl = auto.fotos?.[0] ?? auto.foto ?? null
    const rowY = FLYER_DIMS[tipo].headerH + i * rowH + (rowH - thumb) / 2
    if (!fotoUrl) continue
    try {
      const res = await fetch(fotoUrl)
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer())
        const thumbBuffer = await sharp(buf)
          .resize(thumb, thumb, { fit: 'cover', position: 'centre' })
          .toBuffer()
        composites.push({ input: thumbBuffer, top: Math.round(rowY), left: PAD })
      }
    } catch {
      // sin foto → deja el espacio vacío
    }
  }

  const svgBuf = Buffer.from(buildFlyerSvg(tipo, autos))
  composites.push({ input: svgBuf, top: 0, left: 0 })

  const logoPath = path.join(process.cwd(), 'public', 'logo.png')
  if (fs.existsSync(logoPath)) {
    const logoW = 110
    const logoBuffer = await sharp(logoPath)
      .resize(logoW, null, { fit: 'inside' })
      .toBuffer()
    composites.push({ input: logoBuffer, top: 40, left: W - logoW - 40 })
  }

  return sharp(bg).composite(composites).png().toBuffer()
}
