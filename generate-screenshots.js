import sharp from 'sharp'
import path from 'path'

async function generateScreenshots() {
  try {
    // Screenshot 1: 540x720 (portrait, mobile)
    await sharp({
      create: {
        width: 540,
        height: 720,
        channels: 4,
        background: { r: 242, g: 242, b: 247, alpha: 1 }
      }
    })
      .composite([
        {
          input: Buffer.from(
            '<svg width="540" height="720" xmlns="http://www.w3.org/2000/svg">' +
            '<rect width="540" height="120" fill="#007aff"/>' +
            '<text x="270" y="70" font-size="32" fill="white" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold">AutoGestión</text>' +
            '<rect x="30" y="180" width="480" height="100" fill="white" rx="12" stroke="#007aff" stroke-width="2"/>' +
            '<text x="50" y="215" font-size="16" fill="#007aff" font-weight="bold" font-family="Arial">Dashboard</text>' +
            '<text x="50" y="245" font-size="14" fill="#666" font-family="Arial">KPIs y estadísticas</text>' +
            '<rect x="30" y="310" width="480" height="100" fill="white" rx="12" stroke="#007aff" stroke-width="2"/>' +
            '<text x="50" y="345" font-size="16" fill="#007aff" font-weight="bold" font-family="Arial">Ventas</text>' +
            '<text x="50" y="375" font-size="14" fill="#666" font-family="Arial">Registra y administra ventas</text>' +
            '<rect x="30" y="440" width="480" height="100" fill="white" rx="12" stroke="#007aff" stroke-width="2"/>' +
            '<text x="50" y="475" font-size="16" fill="#007aff" font-weight="bold" font-family="Arial">Reportes</text>' +
            '<text x="50" y="505" font-size="14" fill="#666" font-family="Arial">Exporta PDF y Excel</text>' +
            '</svg>'
          ),
          top: 0,
          left: 0
        }
      ])
      .png()
      .toFile(path.join('public', 'screenshot-1.png'))

    // Screenshot 2: 1280x720 (landscape, tablet/desktop)
    await sharp({
      create: {
        width: 1280,
        height: 720,
        channels: 4,
        background: { r: 242, g: 242, b: 247, alpha: 1 }
      }
    })
      .composite([
        {
          input: Buffer.from(
            '<svg width="1280" height="720" xmlns="http://www.w3.org/2000/svg">' +
            '<rect width="1280" height="60" fill="#007aff"/>' +
            '<text x="640" y="40" font-size="28" fill="white" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold">AutoGestión — Sistema de Administración</text>' +
            '<rect x="20" y="80" width="400" height="300" fill="white" rx="12" stroke="#007aff" stroke-width="1"/>' +
            '<text x="40" y="110" font-size="14" fill="#007aff" font-weight="bold" font-family="Arial">Dashboard</text>' +
            '<rect x="20" y="400" width="400" height="300" fill="white" rx="12" stroke="#007aff" stroke-width="1"/>' +
            '<text x="40" y="430" font-size="14" fill="#007aff" font-weight="bold" font-family="Arial">Autos</text>' +
            '<rect x="440" y="80" width="400" height="300" fill="white" rx="12" stroke="#34c759" stroke-width="1"/>' +
            '<text x="460" y="110" font-size="14" fill="#34c759" font-weight="bold" font-family="Arial">Clientes</text>' +
            '<rect x="440" y="400" width="400" height="300" fill="white" rx="12" stroke="#34c759" stroke-width="1"/>' +
            '<text x="460" y="430" font-size="14" fill="#34c759" font-weight="bold" font-family="Arial">Ventas</text>' +
            '<rect x="860" y="80" width="400" height="300" fill="white" rx="12" stroke="#ff9500" stroke-width="1"/>' +
            '<text x="880" y="110" font-size="14" fill="#ff9500" font-weight="bold" font-family="Arial">Finanzas</text>' +
            '<rect x="860" y="400" width="400" height="300" fill="white" rx="12" stroke="#ff9500" stroke-width="1"/>' +
            '<text x="880" y="430" font-size="14" fill="#ff9500" font-weight="bold" font-family="Arial">Reportes</text>' +
            '</svg>'
          ),
          top: 0,
          left: 0
        }
      ])
      .png()
      .toFile(path.join('public', 'screenshot-2.png'))

    console.log('✓ Screenshots generated successfully')
  } catch (err) {
    console.error('Error generating screenshots:', err)
    process.exit(1)
  }
}

generateScreenshots()
