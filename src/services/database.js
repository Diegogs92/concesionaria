import { supabase } from '../lib/supabase'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function autoToDb(data) {
  const { año, id, fotos, ...rest } = data
  const clean = {}
  for (const [k, v] of Object.entries(rest)) {
    if (v !== null && v !== undefined && v !== '') clean[k] = v
  }
  if (año !== undefined && año !== '') clean.anio = Number(año)
  if (fotos !== undefined) clean.fotos = JSON.stringify(fotos ?? [])
  return clean
}

function autoFromDb(row) {
  if (!row) return null
  const { anio, fotos, ...rest } = row
  const result = anio !== undefined ? { ...rest, año: anio } : rest
  try {
    result.fotos = fotos ? JSON.parse(fotos) : []
  } catch {
    result.fotos = fotos ? [fotos] : []
  }
  return result
}

function throwIfError(error, context) {
  if (error) {
    console.error(`Supabase error [${context}]:`, error)
    throw new Error(error.message)
  }
}

// ─── AUTOS ────────────────────────────────────────────────────────────────────

export const autosService = {
  list: async () => {
    const { data, error } = await supabase
      .from('autos')
      .select('*')
      .order('createdAt', { ascending: false })
    throwIfError(error, 'autos.list')
    return (data || []).map(autoFromDb)
  },

  create: async (data) => {
    const { data: row, error } = await supabase
      .from('autos')
      .insert(autoToDb(data))
      .select()
      .single()
    throwIfError(error, 'autos.create')
    return autoFromDb(row)
  },

  update: async (id, data) => {
    const { data: row, error } = await supabase
      .from('autos')
      .update(autoToDb(data))
      .eq('id', id)
      .select()
      .single()
    throwIfError(error, 'autos.update')
    return autoFromDb(row)
  },

  delete: async (id) => {
    const { error } = await supabase.from('autos').delete().eq('id', id)
    throwIfError(error, 'autos.delete')
  },
}

// ─── CLIENTES ─────────────────────────────────────────────────────────────────

export const clientesService = {
  list: async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('createdAt', { ascending: false })
    throwIfError(error, 'clientes.list')
    return data || []
  },

  create: async (data) => {
    const { data: row, error } = await supabase
      .from('clientes').insert(data).select().single()
    throwIfError(error, 'clientes.create')
    return row
  },

  update: async (id, data) => {
    const { data: row, error } = await supabase
      .from('clientes').update(data).eq('id', id).select().single()
    throwIfError(error, 'clientes.update')
    return row
  },

  delete: async (id) => {
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    throwIfError(error, 'clientes.delete')
  },
}

// ─── VENTAS ───────────────────────────────────────────────────────────────────

export const ventasService = {
  list: async () => {
    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .order('createdAt', { ascending: false })
    throwIfError(error, 'ventas.list')
    return data || []
  },

  create: async (data) => {
    const { data: row, error } = await supabase
      .from('ventas').insert(data).select().single()
    throwIfError(error, 'ventas.create')
    return row
  },

  delete: async (id) => {
    const { error } = await supabase.from('ventas').delete().eq('id', id)
    throwIfError(error, 'ventas.delete')
  },
}

// ─── EGRESOS ──────────────────────────────────────────────────────────────────

export const egresosService = {
  list: async () => {
    const { data, error } = await supabase
      .from('egresos')
      .select('*')
      .order('createdAt', { ascending: false })
    throwIfError(error, 'egresos.list')
    return data || []
  },

  create: async (data) => {
    const { data: row, error } = await supabase
      .from('egresos').insert(data).select().single()
    throwIfError(error, 'egresos.create')
    return row
  },

  delete: async (id) => {
    const { error } = await supabase.from('egresos').delete().eq('id', id)
    throwIfError(error, 'egresos.delete')
  },
}

// ─── DEUDAS ──────────────────────────────────────────────────────────────────

export const deudasService = {
  list: async () => {
    const { data, error } = await supabase
      .from('deudas')
      .select('*')
      .order('createdAt', { ascending: false })
    throwIfError(error, 'deudas.list')
    return data || []
  },

  create: async (data) => {
    const { data: row, error } = await supabase
      .from('deudas').insert(data).select().single()
    throwIfError(error, 'deudas.create')
    return row
  },

  update: async (id, data) => {
    const { data: row, error } = await supabase
      .from('deudas').update(data).eq('id', id).select().single()
    throwIfError(error, 'deudas.update')
    return row
  },

  delete: async (id) => {
    const { error } = await supabase.from('deudas').delete().eq('id', id)
    throwIfError(error, 'deudas.delete')
  },
}

export const deudaConceptosService = {
  list: async () => {
    const { data, error } = await supabase
      .from('deuda_conceptos')
      .select('*')
      .order('nombre', { ascending: true })
    throwIfError(error, 'deudaConceptos.list')
    return data || []
  },

  save: async (data) => {
    const { data: row, error } = await supabase
      .from('deuda_conceptos')
      .upsert(data, { onConflict: 'tipo,nombre' })
      .select()
      .single()
    throwIfError(error, 'deudaConceptos.save')
    return row
  },
}

// ─── DEUDA PAGOS ─────────────────────────────────────────────────────────────

export const deudaPagosService = {
  list: async () => {
    const { data, error } = await supabase
      .from('deuda_pagos')
      .select('*')
      .order('createdAt', { ascending: true })
    throwIfError(error, 'deudaPagos.list')
    return data || []
  },

  create: async (data) => {
    const { data: row, error } = await supabase
      .from('deuda_pagos').insert(data).select().single()
    throwIfError(error, 'deudaPagos.create')
    return row
  },

  update: async (id, data) => {
    const { data: row, error } = await supabase
      .from('deuda_pagos').update(data).eq('id', id).select().single()
    throwIfError(error, 'deudaPagos.update')
    return row
  },

  deleteOne: async (id) => {
    const { error } = await supabase
      .from('deuda_pagos').delete().eq('id', id)
    throwIfError(error, 'deudaPagos.deleteOne')
  },

  deleteByDeuda: async (deudaId) => {
    const { error } = await supabase
      .from('deuda_pagos').delete().eq('deuda_id', deudaId)
    throwIfError(error, 'deudaPagos.deleteByDeuda')
  },
}

// ─── HISTORIAL DE PRECIOS ─────────────────────────────────────────────────────

export const historialService = {
  list: async () => {
    const { data, error } = await supabase
      .from('historial_precios')
      .select('*')
      .order('createdAt', { ascending: false })
    throwIfError(error, 'historial.list')
    return data || []
  },

  create: async (data) => {
    const { data: row, error } = await supabase
      .from('historial_precios').insert(data).select().single()
    throwIfError(error, 'historial.create')
    return row
  },
}

// ─── USUARIOS ─────────────────────────────────────────────────────────────────

export const usuariosService = {
  list: async () => {
    const { data, error } = await supabase
      .from('usuarios').select('*')
    throwIfError(error, 'usuarios.list')
    return data || []
  },

  create: async (data) => {
    const { data: row, error } = await supabase
      .from('usuarios').insert(data).select().single()
    throwIfError(error, 'usuarios.create')
    return row
  },

  update: async (id, data) => {
    const { data: row, error } = await supabase
      .from('usuarios').update(data).eq('id', id).select().single()
    throwIfError(error, 'usuarios.update')
    return row
  },

  delete: async (id) => {
    const { error } = await supabase.from('usuarios').delete().eq('id', id)
    throwIfError(error, 'usuarios.delete')
  },

  findByUsername: async (username) => {
    const { data, error } = await supabase
      .from('usuarios').select('*').eq('username', username).maybeSingle()
    throwIfError(error, 'usuarios.findByUsername')
    return data
  },

  uploadFoto: async (userId, file) => {
    const path = `${userId}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, {
      upsert: true,
      contentType: file.type,
    })
    throwIfError(error, 'usuarios.uploadFoto')
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    return publicUrl
  },
}
