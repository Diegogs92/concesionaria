import { getAutosPublicos } from '../lib/autos'
import { StockProvider } from '../components/stock/StockProvider'
import Hero from '../components/hero/Hero'
import BrandGrid from '../components/brands/BrandGrid'
import Catalog from '../components/catalog/Catalog'
import Services from '../components/services/Services'

export const revalidate = 0

export default async function Home() {
  let autos = []
  let fallo = false
  try {
    autos = await getAutosPublicos()
  } catch {
    fallo = true
  }

  return (
    <main>
      <StockProvider autos={autos} fallo={fallo}>
        <Hero />
        <BrandGrid />
        <Catalog />
      </StockProvider>
      <Services />
    </main>
  )
}
