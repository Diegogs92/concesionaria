import { getAutosPublicos } from '../lib/autos'
import { SITE_URL } from '../lib/site'

export default async function sitemap() {
  let autos = []
  try {
    autos = await getAutosPublicos()
  } catch {
    // Sin stock accesible, el sitemap igual publica la home.
  }

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'hourly', priority: 1 },
    ...autos.map((auto) => ({
      url: `${SITE_URL}/vehiculo/${auto.id}`,
      lastModified: auto.createdAt ? new Date(auto.createdAt) : new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    })),
  ]
}
