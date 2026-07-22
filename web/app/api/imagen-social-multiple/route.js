import { NextResponse } from 'next/server'
import { getAutoPublico } from '../../../lib/autos'
import { generarImagenSocialMultiple } from '../../../lib/imagen-social'

const MAX_FLYER = 8

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const ids = (searchParams.get('ids') ?? '').split(',').map(s => s.trim()).filter(Boolean)
  const tipo = searchParams.get('tipo') ?? 'story'

  if (ids.length === 0) {
    return NextResponse.json({ error: 'ids requerido' }, { status: 400 })
  }
  if (!['post', 'story'].includes(tipo)) {
    return NextResponse.json({ error: 'tipo debe ser post o story' }, { status: 400 })
  }
  if (ids.length > MAX_FLYER) {
    return NextResponse.json({ error: `máximo ${MAX_FLYER} vehículos por flyer` }, { status: 400 })
  }

  const autosResueltos = await Promise.all(ids.map(id => getAutoPublico(id)))
  const autos = autosResueltos.filter(Boolean)

  if (autos.length === 0) {
    return NextResponse.json({ error: 'ningún vehículo encontrado' }, { status: 404 })
  }

  const buffer = await generarImagenSocialMultiple(tipo, autos)

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="flyer-${tipo}.png"`,
      'Cache-Control': 'no-store',
    },
  })
}
