import Hero from '../components/hero/Hero'
import Catalog from '../components/catalog/Catalog'

// La vitrina se regenera cada 60s: lo publicado en /admin aparece solo.
export const revalidate = 60

export default function Home() {
  return (
    <main>
      <Hero />
      <Catalog />
    </main>
  )
}
