// Paso 3 del pipeline hero: genera el overlay de faros encendidos a partir de
// la imagen base (cutout). Pinta un "bloom" (halo difuso) + un "core" (lente
// caliente) en cada posición de faro, sobre una capa transparente del mismo
// tamaño que la base. Se usa con mix-blend-mode: screen en el CSS, así solo
// suma luz donde está el faro.
//
// Uso:  node scripts/hero-lights.mjs <slug>
//   donde <slug> está definido en VEHICLES más abajo.
//
// Entrada:  public/hero-<slug>.webp        (base, cutout transparente)
// Salida:   public/hero-<slug>-lights.webp (overlay de luz)

import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const PUB = path.join(root, 'public')

// Faros por vehículo, en coordenadas absolutas (px) sobre la imagen base.
// rx/ry = semiejes del lente; el bloom se escala a partir de ahí.
const VEHICLES = {
  moto: {
    lights: [{ cx: 108, cy: 188, rx: 26, ry: 34 }],
  },
  // camioneta: { lights: [ {dos faros}, {...} ] },  // pendiente de imagen
}

const TINT = '#eaf2ff' // blanco con un dejo azulado, como xenón

async function build(slug) {
  const cfg = VEHICLES[slug]
  if (!cfg) throw new Error(`sin config para "${slug}"`)

  const base = path.join(PUB, `hero-${slug}.webp`)
  const { width, height } = await sharp(base).metadata()

  // Capa BLOOM: elipses grandes y muy difusas (el derrame de luz).
  // La opacidad se hornea en fill-opacity (sharp composite no la controla bien).
  const bloomSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${cfg.lights
    .map((l) => `<ellipse cx="${l.cx}" cy="${l.cy}" rx="${l.rx * 2.6}" ry="${l.ry * 2.6}" fill="${TINT}" fill-opacity="0.6" />`)
    .join('')}</svg>`
  const bloom = await sharp(Buffer.from(bloomSvg))
    .blur(22)
    .toBuffer()

  // Capa CORE: el lente caliente, casi blanco puro, apenas difuso.
  const coreSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${cfg.lights
    .map((l) => `<ellipse cx="${l.cx}" cy="${l.cy}" rx="${l.rx}" ry="${l.ry}" fill="#ffffff" fill-opacity="0.95" />`)
    .join('')}</svg>`
  const core = await sharp(Buffer.from(coreSvg))
    .blur(4)
    .toBuffer()

  // Lienzo transparente → bloom → core.
  const out = path.join(PUB, `hero-${slug}-lights.webp`)
  await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: bloom, blend: 'over' },
      { input: core, blend: 'over' },
    ])
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(out)

  console.log(`✓ hero-${slug}-lights.webp (${width}x${height}, ${cfg.lights.length} faro/s)`)
}

const slug = process.argv[2]
if (!slug) {
  console.error('Uso: node scripts/hero-lights.mjs <slug>')
  process.exit(1)
}
await build(slug)
