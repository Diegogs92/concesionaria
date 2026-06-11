import Hero from '../components/hero/Hero'
import Catalog from '../components/catalog/Catalog'

export const revalidate = 0

export default function Home() {
  return (
    <main>
      <Hero />
      <Catalog />
    </main>
  )
}
