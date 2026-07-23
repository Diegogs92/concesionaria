// Manifest de la PWA pública (Next lo expone en /manifest.webmanifest y lo
// linkea solo). Hace instalable el sitio con el logo dark como ícono.
export default function manifest() {
  return {
    name: 'ICY Automotores',
    short_name: 'ICY',
    description: 'Stock real y actualizado de ICY Automotores.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#e51515',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
