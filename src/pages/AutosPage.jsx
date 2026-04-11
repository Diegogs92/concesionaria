import React, { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Car, Image } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDate, today } from '../utils/helpers'
import { AutoEstadoBadge } from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SearchBar from '../components/ui/SearchBar'

// ─── Formulario de auto ───────────────────────────────────────────────────────
const EMPTY_FORM = {
  marca: '', modelo: '', año: new Date().getFullYear(),
  precioCompra: '', precioVenta: '',
  kilometraje: '', foto: '', descripcion: '',
}

function AutoForm({ initial = EMPTY_FORM, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.marca.trim())      e.marca      = 'Requerido'
    if (!form.modelo.trim())     e.modelo     = 'Requerido'
    if (!form.año)               e.año        = 'Requerido'
    if (!form.precioCompra)      e.precioCompra = 'Requerido'
    if (!form.precioVenta)       e.precioVenta  = 'Requerido'
    if (!form.kilometraje && form.kilometraje !== 0) e.kilometraje = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      ...form,
      año: Number(form.año),
      precioCompra: Number(form.precioCompra),
      precioVenta: Number(form.precioVenta),
      kilometraje: Number(form.kilometraje),
    })
  }

  const margen = form.precioVenta && form.precioCompra
    ? ((form.precioVenta - form.precioCompra) / form.precioCompra * 100).toFixed(1)
    : null

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid" style={{ gap: 14 }}>
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
          <label className="form-label">Año *</label>
          <input
            type="number" className="form-input" value={form.año}
            onChange={e => set('año', e.target.value)}
            min="1990" max={new Date().getFullYear() + 1}
          />
          {errors.año && <span className="form-error">{errors.año}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Kilometraje *</label>
          <input
            type="number" className="form-input" value={form.kilometraje}
            onChange={e => set('kilometraje', e.target.value)}
            placeholder="15000" min="0"
          />
          {errors.kilometraje && <span className="form-error">{errors.kilometraje}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Precio de compra *</label>
          <input
            type="number" className="form-input" value={form.precioCompra}
            onChange={e => set('precioCompra', e.target.value)}
            placeholder="18000000" min="0"
          />
          {errors.precioCompra && <span className="form-error">{errors.precioCompra}</span>}
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
            type="number" className="form-input" value={form.precioVenta}
            onChange={e => set('precioVenta', e.target.value)}
            placeholder="22500000" min="0"
          />
          {errors.precioVenta && <span className="form-error">{errors.precioVenta}</span>}
        </div>

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
            rows={3} placeholder="Descripción del vehículo..."
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
  const { autos, addAuto, updateAuto, deleteAuto } = useApp()
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
        || String(a.año).includes(q)
      const matchEstado = filtroEstado === 'todos' || a.estado === filtroEstado
      return matchSearch && matchEstado
    })
  }, [autos, search, filtroEstado])

  function openAdd()  { setEditing(null); setModalOpen(true) }
  function openEdit(auto) { setEditing(auto); setModalOpen(true) }
  function closeModal()   { setModalOpen(false); setEditing(null) }

  function handleSubmit(data) {
    if (editingAuto) updateAuto(editingAuto.id, data)
    else             addAuto(data)
    closeModal()
  }

  return (
    <>
      {/* Header de página */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Autos</h1>
          <p className="page-subtitle">{autos.filter(a=>a.estado==='disponible').length} disponibles · {autos.length} en total</p>
        </div>

        <div className="flex items-center gap-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar marca, modelo..." />

          <select
            className="form-input form-select"
            style={{ width: 'auto' }}
            value={filtroEstado}
            onChange={e => setFiltro(e.target.value)}
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
                  {isGerente && <th className="hide-mobile">Compra</th>}
                  <th>Precio venta</th>
                  {isGerente && <th className="hide-mobile">Margen</th>}
                  <th>Estado</th>
                  <th style={{ width: 100 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(auto => {
                  const margen = isGerente
                    ? ((auto.precioVenta - auto.precioCompra) / auto.precioCompra * 100).toFixed(1)
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
                            <div style={{ fontWeight: 600 }}>{auto.marca} {auto.modelo}</div>
                            {auto.descripcion && (
                              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {auto.descripcion}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hide-mobile">{auto.año}</td>
                      <td className="hide-mobile">{auto.kilometraje.toLocaleString('es-AR')} km</td>
                      {isGerente && <td className="hide-mobile">{formatCurrency(auto.precioCompra)}</td>}
                      <td style={{ fontWeight: 600 }}>{formatCurrency(auto.precioVenta)}</td>
                      {isGerente && (
                        <td className="hide-mobile">
                          <span style={{ color: margen > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 500, fontSize: 13 }}>
                            {margen > 0 ? '+' : ''}{margen}%
                          </span>
                        </td>
                      )}
                      <td><AutoEstadoBadge estado={auto.estado} /></td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => setPreview(auto)}
                            title="Ver detalle"
                          >
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
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingAuto ? 'Editar auto' : 'Nuevo auto'}
        size="lg"
      >
        <AutoForm
          initial={editingAuto ?? EMPTY_FORM}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </Modal>

      {/* Modal preview */}
      <Modal
        open={!!previewAuto}
        onClose={() => setPreview(null)}
        title={previewAuto ? `${previewAuto.marca} ${previewAuto.modelo}` : ''}
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
                ['Año', previewAuto.año],
                ['Kilometraje', `${previewAuto.kilometraje.toLocaleString('es-AR')} km`],
                ['Estado', <AutoEstadoBadge key="e" estado={previewAuto.estado} />],
                isGerente && ['Precio compra', formatCurrency(previewAuto.precioCompra)],
                ['Precio venta', formatCurrency(previewAuto.precioVenta)],
                ['Agregado', formatDate(previewAuto.createdAt)],
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
            {previewAuto.descripcion && (
              <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Descripción</div>
                <p style={{ fontSize: 14, lineHeight: 1.6 }}>{previewAuto.descripcion}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirmar eliminación */}
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
