import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const iconPath = path.join('public', 'icon.svg')
const sizes = [96, 192, 512]

async function generateIcons() {
  try {
    for (const size of sizes) {
      const outputPath = path.join('public', `icon-${size}.png`)
      const maskableOutputPath = path.join('public', `icon-maskable-${size}.png`)

      // Icono regular
      await sharp(iconPath)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 122, b: 255, alpha: 1 } })
        .png()
        .toFile(outputPath)

      // Icono maskable (para Android)
      await sharp(iconPath)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 122, b: 255, alpha: 1 } })
        .png()
        .toFile(maskableOutputPath)

      console.log(`✓ Generated ${size}x${size} icons`)
    }

    // Generar favicon 32x32
    await sharp(iconPath)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 122, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join('public', 'favicon-32.png'))

    console.log('✓ All icons generated successfully')
  } catch (err) {
    console.error('Error generating icons:', err)
    process.exit(1)
  }
}

generateIcons()
