import { NextResponse } from 'next/server'
import { getAutoPublico } from '../../../lib/autos'
import { generarImagenSocial } from '../../../lib/imagen-social'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const tipo = searchParams.get('tipo') ?? 'post'

  if (!id) {
    return NextResponse.json({ error: 'id requerido' }, { status: 400 })
  }
  if (!['post', 'story'].includes(tipo)) {
    return NextResponse.json({ error: 'tipo debe ser post o story' }, { status: 400 })
  }

  const auto = await getAutoPublico(id)
  if (!auto) {
    return NextResponse.json({ error: 'vehículo no encontrado' }, { status: 404 })
  }

  const buffer = await generarImagenSocial(tipo, auto)

  const marca = (auto.marca ?? 'auto').toLowerCase().replace(/\s+/g, '-')
  const modelo = (auto.modelo ?? '').toLowerCase().replace(/\s+/g, '-')
  const filename = `${marca}-${modelo}-${tipo}.png`

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
