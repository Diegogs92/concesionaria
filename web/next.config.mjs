import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  // Las fuentes viven en web/fonts/ y no se importan, así que hay que forzar
  // que Next las incluya en el bundle serverless de los generadores de imagen.
  outputFileTracingIncludes: {
    '/api/imagen-social': ['./fonts/**'],
    '/api/imagen-social-multiple': ['./fonts/**'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'hwlzycxbcbtktobogurr.supabase.co' },
    ],
  },
}

export default nextConfig
