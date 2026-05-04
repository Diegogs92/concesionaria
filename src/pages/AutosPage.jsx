import React, { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Car, Image, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDate } from '../utils/helpers'
import { AutoEstadoBadge } from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SearchBar from '../components/ui/SearchBar'

// ─── Opciones de selects ──────────────────────────────────────────────────────
const COMBUSTIBLES  = ['Nafta', 'Diesel', 'Eléctrico', 'Híbrido', 'GNC', 'Otro']
const TRANSMISIONES = ['Manual', 'Automática', 'CVT', 'Doble embrague']
const CARROCERIAS   = ['Sedán', 'SUV', 'Pickup', 'Hatchback', 'Coupé', 'Cabrio', 'Minivan', 'Furgoneta', 'Otro']
const TRACCIONES    = ['4x2', '4x4', 'AWD', 'FWD', 'RWD']
const PUERTAS       = [2, 3, 4, 5]

const EMPTY_FORM = {
  marca: '', modelo: '', version: '',
  año: new Date().getFullYear(),
  condicion: 'Usado',
  precioCompra: '', precio: '',
  kilometraje: '',
  combustible: '', transmision: '',
  puertas: '', carroceria: '', traccion: '', color: '',
  foto: '', descripcion: '',
}

// ─── Formulario ───────────────────────────────────────────────────────────────
function AutoForm({ initial = EMPTY_FORM, onSubmit, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial })
  const [errors, setErrors] = useState({})

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.marca.trim())   e.marca   = 'Requerido'
    if (!form.modelo.trim())  e.modelo  = 'Requerido'
    if (!form.año)            e.año     = 'Requerido'
    if (!form.precio)         e.precio  = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      ...form,
      año: Number(form.año),
      precioCompra: form.precioCompra ? Number(form.precioCompra) : 0,
      precio: Number(form.precio),
      kilometraje: form.kilometraje ? Number(form.kilometraje) : 0,
      puertas: form.puertas ? Number(form.puertas) : null,
    })
  }

  const margen = form.precio && form.precioCompra
    ? ((form.precio - form.precioCompra) / form.precioCompra * 100).toFixed(1)
    : null

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid" style={{ gap: 14 }}>

        {/* Fila 1: Marca / Modelo / Versión */}
        <div className="form-group">
          <label className="form-label">Marca *</label>
          <input className="form-input" value={form.marca} onChange={e => set('marca', e.target.value)} placeholder="Toyota" />
          {errors.marca && <span className="form-error">{errors.marca}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Modelo *</label>
          <input className="form-input" value={form.modelo} onChange={e => set('modelo', e.target.value)} placeholder="Corolla" />
          {errors.modelo && <span className="form-error">{errors.modelo}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Versión</label>
          <input className="form-input" value={form.version} onChange={e => set('version', e.target.value)} placeholder="XEI CVT" />
        </div>

        {/* Fila 2: Año / Condición / Color */}
        <div className="form-group">
          <label className="form-label">Año *</label>
          <input
            type="number" className="form-input" value={form.año}
            onChange={e => set('año', e.target.value)}
            min="1990" max={new Date().getFullYear() + 1}
          />
          {errors.año && <span className="form-error">{errors.año}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Condición</label>
          <select className="form-input form-select" value={form.condicion} onChange={e => set('condicion', e.target.value)}>
            <option value="Usado">Usado</option>
            <option value="Nuevo">Nuevo</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Color</label>
          <input className="form-input" value={form.color} onChange={e => set('color', e.target.value)} placeholder="Blanco" />
        </div>

        {/* Fila 3: Kilometraje / Puertas / Carrocería */}
        <div className="form-group">
          <label className="form-label">Kilometraje</label>
          <input
            type="number" className="form-input" value={form.kilometraje}
            onChange={e => set('kilometraje', e.target.value)}
            placeholder="15000" min="0"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Puertas</label>
          <select className="form-input form-select" value={form.puertas} onChange={e => set('puertas', e.target.value)}>
            <option value="">—</option>
            {PUERTAS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Carrocería</label>
          <select className="form-input form-select" value={form.carroceria} onChange={e => set('carroceria', e.target.value)}>
            <option value="">—</option>
            {CARROCERIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Fila 4: Combustible / Transmisión / Tracción */}
        <div className="form-group">
          <label className="form-label">Combustible</label>
          <select className="form-input form-select" value={form.combustible} onChange={e => set('combustible', e.target.value)}>
            <option value="">—</option>
            {COMBUSTIBLES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Transmisión</label>
          <select className="form-input form-select" value={form.transmision} onChange={e => set('transmision', e.target.value)}>
            <option value="">—</option>
            {TRANSMISIONES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Tracción</label>
          <select className="form-input form-select" value={form.traccion} onChange={e => set('traccion', e.target.value)}>
            <option value="">—</option>
            {TRACCIONES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Fila 5: Precios */}
        <div className="form-group">
          <label className="form-label">Precio de compra</label>
          <input
            type="number" className="form-input" value={form.precioCompra}
            onChange={e => set('precioCompra', e.target.value)}
            placeholder="18000000" min="0"
          />
        </div>
        <div className="form-group">
          <label className="form-label">
            Precio de venta *
            {margen && (
              <span style={{ color: 'var(--success)', fontWeight: 400, marginLeft: 6 }}>
                ({margen > 0 ? '+' : ''}{margen}% margen)
              </span>
            )}
          </label>
          <input
            type="number" className="form-input" value={form.precio}
            onChange={e => set('precio', e.target.value)}
            placeholder="22500000" min="0"
          />
          {errors.precio && <span className="form-error">{errors.precio}</span>}
        </div>

        {/* URL foto */}
        <div className="form-group form-full">
          <label className="form-label">URL de foto (opcional)</label>
          <input
            className="form-input" value={form.foto}
            onChange={e => set('foto', e.target.value)}
            placeholder="https://ejemplo.com/foto.jpg"
          />
        </div>

        <div className="form-group form-full">
          <label className="form-label">Descripción</label>
          <textarea
            className="form-input" value={form.descripcion}
            onChange={e => set('descripcion', e.target.value)}
            rows={3} placeholder="Descripción adicional..."
            style={{ resize: 'vertical' }}
          />
        </div>
      </div>

      <div className="modal-footer" style={{ paddingInline: 0, paddingBottom: 0, marginTop: 16 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary">Guardar auto</button>
      </div>
    </form>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AutosPage() {
  const { autos, addAuto, updateAuto, deleteAuto, historialPrecios } = useApp()
  const { isGerente } = useAuth()

  const [search, setSearch]       = useState('')
  const [filtroEstado, setFiltro] = useState('todos')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAuto, setEditing] = useState(null)
  const [deletingId, setDeleting] = useState(null)
  const [previewAuto, setPreview] = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return autos.filter(a => {
      const matchSearch = !q
        || a.marca.toLowerCase().includes(q)
        || a.modelo.toLowerCase().includes(q)
        || (a.version || '').toLowerCase().includes(q)
        || String(a.año).includes(q)
        || (a.color || '').toLowerCase().includes(q)
      const matchEstado = filtroEstado === 'todos' || a.estado === filtroEstado
      return matchSearch && matchEstado
    })
  }, [autos, search, filtroEstado])

  function openAdd()      { setEditing(null); setModalOpen(true) }
  function openEdit(auto) { setEditing(auto); setModalOpen(true) }
  function closeModal()   { setModalOpen(false); setEditing(null) }

  function handleSubmit(data) {
    if (editingAuto) updateAuto(editingAuto.id, data)
    else             addAuto(data)
    closeModal()
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Autos</h1>
          <p className="page-subtitle">{autos.filter(a => a.estado === 'disponible').length} disponibles · {autos.length} en total</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar marca, modelo, color..." />
          <select
            className="form-input form-select" style={{ width: 'auto' }}
            value={filtroEstado} onChange={e => setFiltro(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="disponible">Disponibles</option>
            <option value="vendido">Vendidos</option>
          </select>
          {isGerente && (
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} /> Agregar auto
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="table-wrapper">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Car size={24} /></div>
              <strong>Sin resultados</strong>
              <p>No se encontraron autos con esos criterios.</p>
              {isGerente && (
                <button className="btn btn-primary btn-sm" onClick={openAdd}>
                  <Plus size={14} /> Agregar el primero
                </button>
              )}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th className="hide-mobile">Año</th>
                  <th className="hide-mobile">Km</th>
                  <th className="hide-mobile">Combustible</th>
                  {isGerente && <th className="hide-mobile">Compra</th>}
                  <th>Precio</th>
                  {isGerente && <th className="hide-mobile">Margen</th>}
                  <th>Estado</th>
                  <th style={{ width: 100 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(auto => {
                  const margen = isGerente && auto.precioCompra
                    ? ((auto.precio - auto.precioCompra) / auto.precioCompra * 100).toFixed(1)
                    : null
                  return (
                    <tr key={auto.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div style={{
                            width: 44, height: 44, borderRadius: 8,
                            background: 'var(--bg-input)', overflow: 'hidden',
                            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {auto.foto
                              ? <img src={auto.foto} alt={auto.modelo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <Car size={20} color="var(--text-tertiary)" />
                            }
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {auto.marca} {auto.modelo}
                              {auto.version && <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}> {auto.version}</span>}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                              {[auto.condicion, auto.color, auto.carroceria].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hide-mobile">{auto.año}</td>
                      <td className="hide-mobile">{auto.kilometraje ? `${Number(auto.kilometraje).toLocaleString('es-AR')} km` : '—'}</td>
                      <td className="hide-mobile">{auto.combustible || '—'}</td>
                      {isGerente && <td className="hide-mobile">{auto.precioCompra ? formatCurrency(auto.precioCompra) : '—'}</td>}
                      <td style={{ fontWeight: 600 }}>{formatCurrency(auto.precio)}</td>
                      {isGerente && (
                        <td className="hide-mobile">
                          {margen ? (
                            <span style={{ color: margen > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 500, fontSize: 13 }}>
                              {margen > 0 ? '+' : ''}{margen}%
                            </span>
                          ) : '—'}
                        </td>
                      )}
                      <td><AutoEstadoBadge estado={auto.estado} /></td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setPreview(auto)} title="Ver detalle">
                            <Image size={15} />
                          </button>
                          {isGerente && (
                            <>
                              <button
                                className="btn btn-ghost btn-icon btn-sm"
                                onClick={() => openEdit(auto)}
                                title="Editar"
                                disabled={auto.estado === 'vendido'}
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                className="btn btn-ghost btn-icon btn-sm"
                                onClick={() => setDeleting(auto.id)}
                                title="Eliminar"
                                style={{ color: 'var(--danger)' }}
                                disabled={auto.estado === 'vendido'}
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal agregar/editar */}
      <Modal open={modalOpen} onClose={closeModal} title={editingAuto ? 'Editar auto' : 'Nuevo auto'} size="lg">
        <AutoForm initial={editingAuto ?? EMPTY_FORM} onSubmit={handleSubmit} onCancel={closeModal} />
      </Modal>

      {/* Modal preview */}
      <Modal
        open={!!previewAuto}
        onClose={() => setPreview(null)}
        title={previewAuto ? `${previewAuto.marca} ${previewAuto.modelo}${previewAuto.version ? ' ' + previewAuto.version : ''}` : ''}
      >
        {previewAuto && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {previewAuto.foto && (
              <img
                src={previewAuto.foto}
                alt={previewAuto.modelo}
                style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 12 }}
              />
            )}
            <div className="form-grid" style={{ gap: 10 }}>
              {[
                ['Año',          previewAuto.año],
                ['Condición',    previewAuto.condicion],
                ['Kilometraje',  previewAuto.kilometraje ? `${Number(previewAuto.kilometraje).toLocaleString('es-AR')} km` : '—'],
                ['Combustible',  previewAuto.combustible],
                ['Transmisión',  previewAuto.transmision],
                ['Tracción',     previewAuto.traccion],
                ['Carrocería',   previewAuto.carroceria],
                ['Puertas',      previewAuto.puertas],
                ['Color',        previewAuto.color],
                ['Estado',       <AutoEstadoBadge key="e" estado={previewAuto.estado} />],
                isGerente && previewAuto.precioCompra && ['Precio compra', formatCurrency(previewAuto.precioCompra)],
                ['Precio',       formatCurrency(previewAuto.precio)],
                ['Agregado',     formatDate(previewAuto.createdAt)],
              ].filter(Boolean).map(([k, v]) => v ? (
                <div key={k} style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{v}</div>
                </div>
              ) : null)}
            </div>

            {previewAuto.descripcion && (
              <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Descripción</div>
                <p style={{ fontSize: 14, lineHeight: 1.6 }}>{previewAuto.descripcion}</p>
              </div>
            )}

            {(() => {
              const historialAuto = historialPrecios.filter(h => h.autoId === previewAuto.id)
              return historialAuto.length > 0 ? (
                <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} /> Historial de precios
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {historialAuto.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map(h => (
                      <div key={h.id} style={{ fontSize: 12, paddingBottom: 8, borderBottom: '1px solid var(--divider)' }}>
                        <div style={{ color: 'var(--text-tertiary)', marginBottom: 2 }}>{formatDate(h.fecha)}</div>
                        <div>
                          {h.campo === 'precio' ? 'Precio de venta' : 'Precio de compra'}:{' '}
                          <span style={{ color: 'var(--danger)' }}>{formatCurrency(h.valorAnterior)}</span>
                          {' → '}
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(h.valorNuevo)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            })()}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteAuto(deletingId)}
        title="Eliminar auto"
        message="¿Estás seguro de que querés eliminar este auto? Esta acción no se puede deshacer."
      />
    </>
  )
}
