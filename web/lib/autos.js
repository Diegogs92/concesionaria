import { cache } from 'react'
import { supabase } from './supabase'

// `fotos` viaja como string JSON; el dato legado puede ser una URL suelta
// (mismo manejo defensivo que src/services/database.js del sistema interno).
function parseFotos(row) {
  let fotos = []
  try {
    fotos = row.fotos ? JSON.parse(row.fotos) : []
  } catch {
    fotos = row.fotos ? [row.fotos] : []
  }
  return [...new Set([row.foto, ...fotos].filter(Boolean))]
}

function normalizar(row) {
  return { ...row, fotos: parseFotos(row) }
}

export const getAutosPublicos = cache(async () => {
  const { data, error } = await supabase
    .from('autos_publicos')
    .select('*')
    .order('createdAt', { ascending: false })
  if (error) throw error
  return (data || []).map(normalizar)
})

export const getAutoPublico = cache(async (id) => {
  const { data, error } = await supabase
    .from('autos_publicos')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? normalizar(data) : null
})
