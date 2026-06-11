// Identidad y contacto del sitio público.
// TODO: reemplazar por el dominio, número de WhatsApp e Instagram reales.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
export const WHATSAPP_NUMBER = '5490000000000'
export const INSTAGRAM_URL = 'https://instagram.com/icyautomotores'
export const ADDRESS = 'Avenida Aconquija 2579, Yerba Buena, Tucumán'
export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`

export function waLink(text) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}
