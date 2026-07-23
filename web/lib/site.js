// Identidad y contacto reales de ICY Automotores (Yerba Buena, Tucumán).
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
export const WHATSAPP_NUMBER = '5493815540754'
export const WHATSAPP_DISPLAY = '+54 9 381 554-0754'
export const EMAIL = 'imanolcardenasypa@gmail.com'
export const INSTAGRAM_HANDLE = '@icy_automotores_ok'
export const INSTAGRAM_URL = 'https://instagram.com/icy_automotores_ok'
export const ADDRESS = 'Av. Aconquija 2579 - Galería Lenna - Local 3/4/5, Yerba Buena, Tucumán'
export const CITY = 'Yerba Buena, Tucumán'
export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`

export function waLink(text) {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}
