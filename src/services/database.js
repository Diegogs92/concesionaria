import { databases, DB_ID, COL, ID, Query } from '../lib/appwrite'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(doc) {
  const { $id, $collectionId, $databaseId, $permissions, ...rest } = doc
  return { id: $id, ...rest }
}

function normalizeList(res) {
  return res.documents.map(normalize)
}

// Appwrite no soporta ñ en nombres de atributos
// Convertimos año ↔ anio al guardar/leer
function autoToDb(data) {
  const { año, ...rest } = data
  return año !== undefined ? { ...rest, anio: año } : rest
}

function autoFromDb(doc) {
  const normalized = normalize(doc)
  const { anio, ...rest } = normalized
  return anio !== undefined ? { ...rest, año: anio } : rest
}

function autoListFromDb(res) {
  return res.documents.map(autoFromDb)
}

// ─── AUTOS ────────────────────────────────────────────────────────────────────

export const autosService = {
  list: () =>
    databases.listDocuments(DB_ID, COL.AUTOS, [Query.orderDesc('createdAt'), Query.limit(200)])
      .then(autoListFromDb),

  create: (data) =>
    databases.createDocument(DB_ID, COL.AUTOS, ID.unique(), autoToDb(data))
      .then(autoFromDb),

  update: (id, data) =>
    databases.updateDocument(DB_ID, COL.AUTOS, id, autoToDb(data))
      .then(autoFromDb),

  delete: (id) =>
    databases.deleteDocument(DB_ID, COL.AUTOS, id),
}

// ─── CLIENTES ─────────────────────────────────────────────────────────────────

export const clientesService = {
  list: () =>
    databases.listDocuments(DB_ID, COL.CLIENTES, [Query.orderDesc('createdAt'), Query.limit(200)])
      .then(normalizeList),

  create: (data) =>
    databases.createDocument(DB_ID, COL.CLIENTES, ID.unique(), data)
      .then(normalize),

  update: (id, data) =>
    databases.updateDocument(DB_ID, COL.CLIENTES, id, data)
      .then(normalize),

  delete: (id) =>
    databases.deleteDocument(DB_ID, COL.CLIENTES, id),
}

// ─── VENTAS ───────────────────────────────────────────────────────────────────

export const ventasService = {
  list: () =>
    databases.listDocuments(DB_ID, COL.VENTAS, [Query.orderDesc('createdAt'), Query.limit(200)])
      .then(normalizeList),

  create: (data) =>
    databases.createDocument(DB_ID, COL.VENTAS, ID.unique(), data)
      .then(normalize),

  delete: (id) =>
    databases.deleteDocument(DB_ID, COL.VENTAS, id),
}

// ─── EGRESOS ──────────────────────────────────────────────────────────────────

export const egresosService = {
  list: () =>
    databases.listDocuments(DB_ID, COL.EGRESOS, [Query.orderDesc('createdAt'), Query.limit(200)])
      .then(normalizeList),

  create: (data) =>
    databases.createDocument(DB_ID, COL.EGRESOS, ID.unique(), data)
      .then(normalize),

  delete: (id) =>
    databases.deleteDocument(DB_ID, COL.EGRESOS, id),
}

// ─── TEST DRIVES ──────────────────────────────────────────────────────────────

export const testDrivesService = {
  list: () =>
    databases.listDocuments(DB_ID, COL.TEST_DRIVES, [Query.orderDesc('createdAt'), Query.limit(200)])
      .then(normalizeList),

  create: (data) =>
    databases.createDocument(DB_ID, COL.TEST_DRIVES, ID.unique(), data)
      .then(normalize),

  update: (id, data) =>
    databases.updateDocument(DB_ID, COL.TEST_DRIVES, id, data)
      .then(normalize),

  delete: (id) =>
    databases.deleteDocument(DB_ID, COL.TEST_DRIVES, id),
}

// ─── HISTORIAL DE PRECIOS ─────────────────────────────────────────────────────

export const historialService = {
  list: () =>
    databases.listDocuments(DB_ID, COL.HISTORIAL, [Query.orderDesc('createdAt'), Query.limit(500)])
      .then(normalizeList),

  create: (data) =>
    databases.createDocument(DB_ID, COL.HISTORIAL, ID.unique(), data)
      .then(normalize),
}

// ─── USUARIOS ─────────────────────────────────────────────────────────────────

export const usuariosService = {
  list: () =>
    databases.listDocuments(DB_ID, COL.USUARIOS, [Query.limit(100)])
      .then(normalizeList),

  create: (data) =>
    databases.createDocument(DB_ID, COL.USUARIOS, ID.unique(), data)
      .then(normalize),

  update: (id, data) =>
    databases.updateDocument(DB_ID, COL.USUARIOS, id, data)
      .then(normalize),

  delete: (id) =>
    databases.deleteDocument(DB_ID, COL.USUARIOS, id),

  findByUsername: async (username) => {
    const res = await databases.listDocuments(DB_ID, COL.USUARIOS, [
      Query.equal('username', username),
      Query.limit(1),
    ])
    return res.documents.length > 0 ? normalize(res.documents[0]) : null
  },
}
