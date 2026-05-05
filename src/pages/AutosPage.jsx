import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Car, Image, Clock, ChevronLeft, ChevronRight, Upload, X, DollarSign } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDate } from '../utils/helpers'
import { AutoEstadoBadge } from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SearchBar from '../components/ui/SearchBar'
import { supabase } from '../lib/supabase'

// ─── Opciones ─────────────────────────────────────────────────────────────────
const AÑOS = Array.from({ length: new Date().getFullYear() - 1969 + 2 }, (_, i) => new Date().getFullYear() + 1 - i)
const COMBUSTIBLES  = ['Nafta', 'Diesel', 'Eléctrico', 'Híbrido', 'GNC', 'Otro']
const TRANSMISIONES = ['Manual', 'Automática', 'CVT', 'Doble embrague']
const CARROCERIAS   = ['Sedán', 'SUV', 'Pickup', 'Hatchback', 'Coupé', 'Cabrio', 'Minivan', 'Furgoneta', 'Otro']
const TRACCIONES    = ['4x2', '4x4', 'AWD', 'FWD', 'RWD']
const PUERTAS       = ['2', '3', '4', '5']

const EMPTY_FORM = {
  tipo: 'Auto', estadoPublicacion: 'En venta',
  marca: '', modelo: '', version: '',
  año: new Date().getFullYear(),
  color: '', patente: '', chasis: '',
  condicion: 'Usado',
  combustible: '', transmision: '', traccion: '',
  puertas: '', carroceria: '', motor: '', kilometraje: '',
  precioCompra: '', precio: '',
  descripcion: '',
  fotos: [],
}

// ─── ToggleGroup ──────────────────────────────────────────────────────────────
function ToggleGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
      {options.map((opt, i) => {
        const active = value === opt
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              flex: 1,
              padding: '10px 8px',
              fontSize: 13,
              fontWeight: active ? 700 : 400,
              background: active ? 'var(--accent)' : 'var(--bg-input)',
              color: active ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              borderRight: i < options.length - 1 ? '1px solid var(--border-strong)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// ─── StepBar ──────────────────────────────────────────────────────────────────
function StepBar({ step, steps }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24, gap: 0 }}>
      {steps.map((label, i) => {
        const n = i + 1
        const done = n < step
        const active = n === step
        return (
          <React.Fragment key={n}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
                background: done || active ? 'var(--accent)' : 'var(--bg-input)',
                color: done || active ? '#ffffff' : 'var(--text-tertiary)',
                border: active ? '2px solid var(--accent)' : '2px solid transparent',
                boxShadow: active ? '0 0 0 3px var(--accent-light)' : 'none',
              }}>
                {done ? '✓' : n}
              </div>
              <span style={{ fontSize: 11, color: active ? 'var(--accent)' : 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 8px', marginBottom: 18,
                background: done ? 'var(--primary)' : 'var(--divider)',
              }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Formulario multi-paso ────────────────────────────────────────────────────
function AutoForm({ initial = EMPTY_FORM, onSubmit, onCancel, isGerente }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial })
  const [errors, setErrors] = useState({})
  const [uploading, setUploading] = useState(false)
  const [dolarBlue, setDolarBlue] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('https://dolarapi.com/v1/dolares/blue')
      .then(r => r.json())
      .then(d => setDolarBlue(d.venta))
      .catch(() => {})
  }, [])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validateStep(s) {
    const e = {}
    if (s === 1) {
      if (!form.marca.trim())  e.marca  = 'Requerido'
      if (!form.modelo.trim()) e.modelo = 'Requerido'
    }
    if (s === 3) {
      if (!form.precio) e.precio = 'Requerido'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function next() {
    if (validateStep(step)) setStep(s => s + 1)
  }
  function prev() {
    setStep(s => s - 1)
    setErrors({})
  }

  async function handleUpload(files) {
    if (!files.length) return
    setUploading(true)
    const urls = []
    for (const file of files) {
      const ext  = file.name.split('.').pop()
      const name = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('vehiculos').upload(name, file, { upsert: false })
      if (!error) {
        const { data } = supabase.storage.from('vehiculos').getPublicUrl(name)
        urls.push(data.publicUrl)
      }
    }
    set('fotos', [...(form.fotos || []), ...urls])
    setUploading(false)
  }

  function removePhoto(idx) {
    set('fotos', form.fotos.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validateStep(3)) return
    setSubmitting(true)
    await onSubmit({
      ...form,
      año: Number(form.año),
      precioCompra: form.precioCompra ? Number(form.precioCompra) : null,
      precio: Number(form.precio),
      kilometraje: form.kilometraje ? Number(form.kilometraje) : null,
      puertas: form.puertas ? Number(form.puertas) : null,
    })
    setSubmitting(false)
  }

  const usdEquiv = dolarBlue && form.precio
    ? Math.round(Number(form.precio) / dolarBlue).toLocaleString('en-US')
    : null

  const margen = form.precio && form.precioCompra
    ? ((Number(form.precio) - Number(form.precioCompra)) / Number(form.precioCompra) * 100).toFixed(1)
    : null

  return (
    <form onSubmit={handleSubmit}>
      <StepBar step={step} steps={['Identificación', 'Características', 'Precio y fotos']} />

      {/* ── Paso 1 ── */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-grid">
            <div className="form-group form-full">
              <label className="form-label">Tipo de vehículo</label>
              <ToggleGroup options={['Auto', 'Moto', 'Utilitario', 'Camión']} value={form.tipo} onChange={v => set('tipo', v)} />
            </div>
            <div className="form-group form-full">
              <label className="form-label">Estado de publicación</label>
              <ToggleGroup options={['En venta', 'Novedad', 'Reservado']} value={form.estadoPublicacion} onChange={v => set('estadoPublicacion', v)} />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Marca *</label>
              <input className="form-input" value={form.marca} onChange={e => set('marca', e.target.value)} placeholder="Toyota" autoFocus />
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
            <div className="form-group">
              <label className="form-label">Año</label>
              <select className="form-input form-select" value={form.año} onChange={e => set('año', e.target.value)}>
                {AÑOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <input className="form-input" value={form.color} onChange={e => set('color', e.target.value)} placeholder="Blanco" />
            </div>
            <div className="form-group">
              <label className="form-label">Patente</label>
              <input className="form-input" value={form.patente} onChange={e => set('patente', e.target.value)} placeholder="AA123BB" style={{ textTransform: 'uppercase' }} />
            </div>
            <div className="form-group form-full">
              <label className="form-label">Chasis / VIN</label>
              <input className="form-input" value={form.chasis} onChange={e => set('chasis', e.target.value)} placeholder="9BWZZZ377VT004251" />
            </div>
          </div>
        </div>
      )}

      {/* ── Paso 2 ── */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Condición</label>
            <ToggleGroup options={['Usado', 'Nuevo']} value={form.condicion} onChange={v => set('condicion', v)} />
          </div>

          <div className="form-group">
            <label className="form-label">Combustible</label>
            <ToggleGroup options={COMBUSTIBLES} value={form.combustible} onChange={v => set('combustible', v)} />
          </div>

          <div className="form-group">
            <label className="form-label">Transmisión</label>
            <ToggleGroup options={TRANSMISIONES} value={form.transmision} onChange={v => set('transmision', v)} />
          </div>

          <div className="form-group">
            <label className="form-label">Tracción</label>
            <ToggleGroup options={TRACCIONES} value={form.traccion} onChange={v => set('traccion', v)} />
          </div>

          <div className="form-group">
            <label className="form-label">Puertas</label>
            <ToggleGroup options={PUERTAS} value={String(form.puertas)} onChange={v => set('puertas', v)} />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Carrocería</label>
              <select className="form-input form-select" value={form.carroceria} onChange={e => set('carroceria', e.target.value)}>
                <option value="">— Seleccionar —</option>
                {CARROCERIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Motor</label>
              <input className="form-input" value={form.motor} onChange={e => set('motor', e.target.value)} placeholder="2.0 TSI 190cv" />
            </div>
            <div className="form-group">
              <label className="form-label">Kilometraje</label>
              <input type="number" className="form-input" value={form.kilometraje} onChange={e => set('kilometraje', e.target.value)} placeholder="15000" min="0" />
            </div>
          </div>
        </div>
      )}

      {/* ── Paso 3 ── */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isGerente && (
            <div className="form-group">
              <label className="form-label">Precio de compra ($ ARS)</label>
              <input
                type="number" className="form-input" value={form.precioCompra}
                onChange={e => set('precioCompra', e.target.value)}
                placeholder="18.000.000" min="0"
              />
              {margen && (
                <span style={{ fontSize: 12, color: Number(margen) > 0 ? 'var(--success)' : 'var(--danger)', marginTop: 4, display: 'block' }}>
                  Margen: {Number(margen) > 0 ? '+' : ''}{margen}%
                </span>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              Precio de venta * ($ ARS)
              {usdEquiv && (
                <span style={{ color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                  ≈ USD {usdEquiv}
                </span>
              )}
            </label>
            <input
              type="number" className="form-input" value={form.precio}
              onChange={e => set('precio', e.target.value)}
              placeholder="22.500.000" min="0"
            />
            {errors.precio && <span className="form-error">{errors.precio}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-input" value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)}
              rows={3} placeholder="Único dueño, service al día, impecable estado..." style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Fotos</label>
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '20px 16px', borderRadius: 12,
              border: '2px dashed var(--divider)', cursor: 'pointer',
              background: 'var(--bg-input)', color: 'var(--text-secondary)',
            }}>
              <Upload size={24} />
              <span style={{ fontSize: 13 }}>{uploading ? 'Subiendo...' : 'Toca para subir fotos'}</span>
              <input
                type="file" accept="image/*" multiple hidden
                disabled={uploading}
                onChange={e => handleUpload(Array.from(e.target.files))}
              />
            </label>

            {form.fotos && form.fotos.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {form.fotos.map((url, i) => (
                  <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      style={{
                        position: 'absolute', top: 2, right: 2,
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', padding: 0,
                      }}
                    >
                      <X size={12} />
                    </button>
                    {i === 0 && (
                      <span style={{
                        position: 'absolute', bottom: 2, left: 2,
                        fontSize: 10, background: 'var(--primary)', color: '#fff',
                        borderRadius: 4, padding: '1px 4px',
                      }}>
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Navegación ── */}
      <div className="modal-footer" style={{ paddingInline: 0, paddingBottom: 0, marginTop: 20 }}>
        <button type="button" className="btn btn-secondary" onClick={step === 1 ? onCancel : prev}>
          {step === 1 ? 'Cancelar' : <><ChevronLeft size={16} /> Atrás</>}
        </button>
        {step < 3 ? (
          <button type="button" className="btn btn-primary" onClick={next}>
            Siguiente <ChevronRight size={16} />
          </button>
        ) : (
          <button type="submit" className="btn btn-primary" disabled={submitting || uploading}>
            {submitting ? 'Guardando...' : 'Guardar vehículo'}
          </button>
        )}
      </div>
    </form>
  )
}

// ─── Preview carousel ──────────────────────────────────────────────────────────
function PhotoCarousel({ fotos }) {
  const [idx, setIdx] = useState(0)
  if (!fotos || fotos.length === 0) return null
  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', marginBottom: 4 }}>
      <img
        src={fotos[idx]} alt=""
        style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
      />
      {fotos.length > 1 && (
        <>
          <button
            onClick={() => setIdx(i => (i - 1 + fotos.length) % fotos.length)}
            style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setIdx(i => (i + 1) % fotos.length)}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
            }}
          >
            <ChevronRight size={18} />
          </button>
          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
            {fotos.map((_, i) => (
              <div
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: i === idx ? 16 : 6, height: 6, borderRadius: 3,
                  background: i === idx ? '#fff' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
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
        || (a.marca || '').toLowerCase().includes(q)
        || (a.modelo || '').toLowerCase().includes(q)
        || (a.version || '').toLowerCase().includes(q)
        || String(a.año || '').includes(q)
        || (a.color || '').toLowerCase().includes(q)
        || (a.patente || '').toLowerCase().includes(q)
      const matchEstado = filtroEstado === 'todos' || a.estado === filtroEstado
      return matchSearch && matchEstado
    })
  }, [autos, search, filtroEstado])

  function openAdd()      { setEditing(null); setModalOpen(true) }
  function openEdit(auto) { setEditing(auto); setModalOpen(true) }
  function closeModal()   { setModalOpen(false); setEditing(null) }

  async function handleSubmit(data) {
    if (editingAuto) await updateAuto(editingAuto.id, data)
    else             await addAuto(data)
    closeModal()
  }

  function thumbUrl(auto) {
    if (auto.fotos && auto.fotos.length > 0) return auto.fotos[0]
    return null
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vehículos</h1>
          <p className="page-subtitle">{autos.filter(a => a.estado === 'disponible').length} disponibles · {autos.length} en total</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar marca, modelo, patente..." />
          <select
            className="form-input form-select" style={{ width: 'auto' }}
            value={filtroEstado} onChange={e => setFiltro(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="disponible">Disponibles</option>
            <option value="vendido">Vendidos</option>
          </select>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Agregar
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Car size={24} /></div>
              <strong>Sin resultados</strong>
              <p>No se encontraron vehículos con esos criterios.</p>
              <button className="btn btn-primary btn-sm" onClick={openAdd}>
                <Plus size={14} /> Agregar el primero
              </button>
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
                  const thumb = thumbUrl(auto)
                  return (
                    <tr key={auto.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div style={{
                            width: 44, height: 44, borderRadius: 8,
                            background: 'var(--bg-input)', overflow: 'hidden',
                            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {thumb
                              ? <img src={thumb} alt={auto.modelo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <Car size={20} color="var(--text-tertiary)" />
                            }
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {auto.marca} {auto.modelo}
                              {auto.version && <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}> {auto.version}</span>}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                              {[auto.condicion, auto.color, auto.tipo].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hide-mobile">{auto.año}</td>
                      <td className="hide-mobile">{auto.kilometraje ? `${Number(auto.kilometraje).toLocaleString('es-AR')} km` : '—'}</td>
                      <td className="hide-mobile">{auto.combustible || '—'}</td>
                      {isGerente && <td className="hide-mobile">{auto.precioCompra ? formatCurrency(auto.precioCompra) : '—'}</td>}
                      <td style={{ fontWeight: 600 }}>{auto.precio ? formatCurrency(auto.precio) : '—'}</td>
                      {isGerente && (
                        <td className="hide-mobile">
                          {margen ? (
                            <span style={{ color: Number(margen) > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 500, fontSize: 13 }}>
                              {Number(margen) > 0 ? '+' : ''}{margen}%
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
      <Modal open={modalOpen} onClose={closeModal} title={editingAuto ? 'Editar vehículo' : 'Nuevo vehículo'} size="lg" disableOutsideClick>
        <AutoForm
          initial={editingAuto ?? EMPTY_FORM}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isGerente={isGerente}
        />
      </Modal>

      {/* Modal preview */}
      <Modal
        open={!!previewAuto}
        onClose={() => setPreview(null)}
        title={previewAuto ? `${previewAuto.marca} ${previewAuto.modelo}${previewAuto.version ? ' ' + previewAuto.version : ''}` : ''}
      >
        {previewAuto && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <PhotoCarousel fotos={previewAuto.fotos} />

            <div className="form-grid" style={{ gap: 10 }}>
              {[
                ['Tipo',         previewAuto.tipo],
                ['Año',          previewAuto.año],
                ['Condición',    previewAuto.condicion],
                ['Kilometraje',  previewAuto.kilometraje ? `${Number(previewAuto.kilometraje).toLocaleString('es-AR')} km` : null],
                ['Combustible',  previewAuto.combustible],
                ['Transmisión',  previewAuto.transmision],
                ['Tracción',     previewAuto.traccion],
                ['Carrocería',   previewAuto.carroceria],
                ['Puertas',      previewAuto.puertas],
                ['Motor',        previewAuto.motor],
                ['Color',        previewAuto.color],
                ['Patente',      previewAuto.patente],
                ['Publicación',  previewAuto.estadoPublicacion],
                ['Estado',       <AutoEstadoBadge key="e" estado={previewAuto.estado} />],
                isGerente && previewAuto.precioCompra ? ['Precio compra', formatCurrency(previewAuto.precioCompra)] : null,
                ['Precio',       previewAuto.precio ? formatCurrency(previewAuto.precio) : null],
                ['Agregado',     formatDate(previewAuto.createdAt)],
              ].filter(row => row && row[1]).map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>

            {previewAuto.descripcion && (
              <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Descripción</div>
                <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{previewAuto.descripcion}</p>
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
        title="Eliminar vehículo"
        message="¿Estás seguro de que querés eliminar este vehículo? Esta acción no se puede deshacer."
      />
    </>
  )
}
