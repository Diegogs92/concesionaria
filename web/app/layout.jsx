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

// Se ejecuta antes del primer paint: lee la preferencia guardada (o la del
// sistema) y marca <html data-theme> para que no haya flash de tema.
const themeInit = `(function(){try{var t=localStorage.getItem('icy-theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}})()`

export default function RootLayout({ children }) {
  return (
    <html lang="es-AR" className={archivo.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        {children}
        <Footer />
      </body>
    </html>
  )
}
