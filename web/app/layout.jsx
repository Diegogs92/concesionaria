import { Archivo } from 'next/font/google'
import Footer from '../components/footer/Footer'
import { SITE_URL } from '../lib/site'
import './globals.css'

const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-archivo',
  weight: ['400', '500', '600', '800', '900'],
})

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'ICY Automotores — Autos y motos seleccionados',
  description:
    'Stock real, precios publicados y vehículos verificados. Encontrá tu próximo auto o moto en ICY Automotores.',
  openGraph: {
    title: 'ICY Automotores — Autos y motos seleccionados',
    description: 'Stock real, precios publicados y vehículos verificados.',
    locale: 'es_AR',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es-AR" className={archivo.variable}>
      <body>
        {children}
        <Footer />
      </body>
    </html>
  )
}
