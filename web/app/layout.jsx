import { DM_Sans } from 'next/font/google'
import Navbar from '../components/nav/Navbar'
import Footer from '../components/footer/Footer'
import SellModal from '../components/sell/SellModal'
import AnimatedFavicon from '../components/AnimatedFavicon'
import { SITE_URL } from '../lib/site'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
  weight: ['400', '500', '600', '700', '800'],
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

// Tema único claro (lenguaje icyautomotores.com); el hero mantiene su
// escena oscura propia, como una foto nocturna dentro de la página clara.
export default function RootLayout({ children }) {
  return (
    <html lang="es-AR" className={dmSans.variable}>
      <body>
        <AnimatedFavicon />
        <Navbar />
        {children}
        <Footer />
        <SellModal />
      </body>
    </html>
  )
}
