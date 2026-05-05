import { supabase } from '../lib/supabase'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function autoToDb(data) {
  const { año, id, ...rest } = data
  const clean = {}
  for (const [k, v] of Object.entries(rest)) {
    if (v !== null && v !== undefined && v !== '') clean[k] = v
  }
  if (año !== undefined && año !== '') clean.anio = Number(año)
  return clean
}

function autoFromDb(row) {
  if (!row) return null
  const { anio, ...rest } = row
  return anio !== undefined ? { ...rest, año: anio } : rest
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

// ─── TEST DRIVES ──────────────────────────────────────────────────────────────

export const testDrivesService = {
  list: async () => {
    const { data, error } = await supabase
      .from('test_drives')
      .select('*')
      .order('createdAt', { ascending: false })
    throwIfError(error, 'testDrives.list')
    return data || []
  },

  create: async (data) => {
    const { data: row, error } = await supabase
      .from('test_drives').insert(data).select().single()
    throwIfError(error, 'testDrives.create')
    return row
  },

  update: async (id, data) => {
    const { data: row, error } = await supabase
      .from('test_drives').update(data).eq('id', id).select().single()
    throwIfError(error, 'testDrives.update')
    return row
  },

  delete: async (id) => {
    const { error } = await supabase.from('test_drives').delete().eq('id', id)
    throwIfError(error, 'testDrives.delete')
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
      .from('usuarios').select('*').eq('username', username).single()
    if (error?.code === 'PGRST116') return null
    throwIfError(error, 'usuarios.findByUsername')
    return data
  },
}
