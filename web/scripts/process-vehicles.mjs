// Paso 2 del pipeline de vehículos del hero: recortar bordes transparentes
// y comprimir a WebP. (El paso 1, remove_bg.py, quita el fondo con rembg.)
//
// Entrada:  public/vehicles/tmp/{sedan,suv,moto}.png  (alpha, de remove_bg.py)
// Salida:   public/vehicles/{sedan,suv,moto}.webp     (recortado, máx 1000px)
//
// Uso:  python scripts/remove_bg.py && node scripts/process-vehicles.mjs

import sharp from 'sharp'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const TMP = path.join(root, 'public', 'vehicles', 'tmp')
const OUT = path.join(root, 'public', 'vehicles')
const NAMES = ['sedan', 'suv', 'moto']

await mkdir(OUT, { recursive: true })

let done = 0
for (const name of NAMES) {
  const input = path.join(TMP, `${name}.png`)
  if (!existsSync(input)) {
    console.warn(`⚠ falta ${path.relative(root, input)} — corré antes: python scripts/remove_bg.py`)
    continue
  }

  const out = path.join(OUT, `${name}.webp`)
  await sharp(input)
    .trim()
    .resize({ width: 1000, withoutEnlargement: true })
    .webp({ quality: 90 })
    .toFile(out)

  const meta = await sharp(out).metadata()
  console.log(`✓ ${name}.webp listo (${meta.width}x${meta.height})`)
  done++
}

console.log(`\n${done}/${NAMES.length} vehículos procesados en public/vehicles/`)
if (done < NAMES.length) process.exit(1)
