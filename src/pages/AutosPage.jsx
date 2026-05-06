import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Car, Clock, ChevronLeft, ChevronRight, Upload, X, LayoutGrid, List } from 'lucide-react'
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
const COMBUSTIBLES  = ['Nafta', 'Diesel', 'Híbrida', 'GNC']
const TRANSMISIONES = ['Manual', 'Automática']
const CARROCERIAS   = ['Sedán', 'SUV', 'Pickup', 'Hatchback', 'Coupé', 'Convertible', 'Van']
const TRACCIONES    = ['Delantera', 'Trasera', '4x4']
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

// ─── Thumbnail con fallback a ícono ──────────────────────────────────────────
function Thumbnail({ src }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <Car size={20} color="var(--text-tertiary)" />
  return (
    <img
      src={src} alt=""
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      onError={() => setFailed(true)}
    />
  )
}

// ─── Input numérico con separador de miles ────────────────────────────────────
function NumInput({ value, onChange, placeholder, className = 'form-input' }) {
  function fmt(v) {
    const n = String(v ?? '').replace(/\D/g, '')
    return n ? Number(n).toLocaleString('es-AR') : ''
  }
  function handleChange(e) {
    const raw = e.target.value.replace(/\D/g, '')
    onChange(raw)
  }
  return (
    <input
      type="text"
      inputMode="numeric"
      className={className}
      value={fmt(value)}
      onChange={handleChange}
      placeholder={placeholder}
    />
  )
}

// ─── Formulario multi-paso ────────────────────────────────────────────────────
function AutoForm({ initial = EMPTY_FORM, onSubmit, onCancel, isAdmin, cotizaciones }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial })
  const [errors, setErrors] = useState({})
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

  async function handleSubmit() {
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

  function toUSD(rate) {
    if (!rate || !form.precio) return null
    return Math.round(Number(form.precio) / rate).toLocaleString('es-AR')
  }
  const usdOficial = cotizaciones ? toUSD(cotizaciones.oficial) : null
  const usdMep     = cotizaciones ? toUSD(cotizaciones.mep)     : null
  const usdBlue    = cotizaciones ? toUSD(cotizaciones.blue)    : null

  const margen = form.precio && form.precioCompra
    ? ((Number(form.precio) - Number(form.precioCompra)) / Number(form.precioCompra) * 100).toFixed(1)
    : null

  return (
    <form onSubmit={e => e.preventDefault()}>
      <StepBar step={step} steps={['Identificación', 'Características', 'Precio y fotos']} />

      {/* ── Paso 1 ── */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-grid">
            <div className="form-group form-full">
              <label className="form-label">Tipo de vehículo</label>
              <ToggleGroup options={['Auto', 'Moto']} value={form.tipo} onChange={v => set('tipo', v)} />
            </div>
            <div className="form-group form-full">
              <label className="form-label">Estado de publicación</label>
              <ToggleGroup options={['En venta', 'Novedad']} value={form.estadoPublicacion} onChange={v => set('estadoPublicacion', v)} />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Marca *</label>
              <input className="form-input" value={form.marca} onChange={e => set('marca', e.target.value)} placeholder="Toyota" autoFocus style={{ textTransform: 'uppercase' }} />
              {errors.marca && <span className="form-error">{errors.marca}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Modelo *</label>
              <input className="form-input" value={form.modelo} onChange={e => set('modelo', e.target.value)} placeholder="Corolla" style={{ textTransform: 'uppercase' }} />
              {errors.modelo && <span className="form-error">{errors.modelo}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Versión</label>
              <input className="form-input" value={form.version} onChange={e => set('version', e.target.value)} placeholder="XEI CVT" style={{ textTransform: 'uppercase' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Año</label>
              <select className="form-input form-select" value={form.año} onChange={e => set('año', e.target.value)}>
                {AÑOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Color</label>
              <input className="form-input" value={form.color} onChange={e => set('color', e.target.value)} placeholder="Blanco" style={{ textTransform: 'uppercase' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Patente</label>
              <input className="form-input" value={form.patente} onChange={e => set('patente', e.target.value)} placeholder="AA123BB" style={{ textTransform: 'uppercase' }} />
            </div>
            <div className="form-group form-full">
              <label className="form-label">Chasis / VIN</label>
              <input className="form-input" value={form.chasis} onChange={e => set('chasis', e.target.value)} placeholder="9BWZZZ377VT004251" style={{ textTransform: 'uppercase' }} />
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
              <input className="form-input" value={form.motor} onChange={e => set('motor', e.target.value)} placeholder="2.0 TSI 190cv" style={{ textTransform: 'uppercase' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Kilometraje</label>
              <NumInput value={form.kilometraje} onChange={v => set('kilometraje', v)} placeholder="15.000" />
            </div>
          </div>
        </div>
      )}

      {/* ── Paso 3 ── */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isAdmin && (
            <div className="form-group">
              <label className="form-label">Precio de compra ($ ARS)</label>
              <NumInput value={form.precioCompra} onChange={v => set('precioCompra', v)} placeholder="18.000.000" />
              {margen && (
                <span style={{ fontSize: 12, color: Number(margen) > 0 ? 'var(--success)' : 'var(--danger)', marginTop: 4, display: 'block' }}>
                  Margen: {Number(margen) > 0 ? '+' : ''}{margen}%
                </span>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Precio de venta * ($ ARS)</label>
            <NumInput value={form.precio} onChange={v => set('precio', v)} placeholder="22.500.000" />
            {errors.precio && <span className="form-error">{errors.precio}</span>}
            {(usdOficial || usdMep || usdBlue) && (
              <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                {usdOficial && (
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    Oficial <strong style={{ color: 'var(--text-secondary)' }}>U$D {usdOficial}</strong>
                  </span>
                )}
                {usdMep && (
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    MEP <strong style={{ color: 'var(--text-secondary)' }}>U$D {usdMep}</strong>
                  </span>
                )}
                {usdBlue && (
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    Blue <strong style={{ color: 'var(--text-secondary)' }}>U$D {usdBlue}</strong>
                  </span>
                )}
              </div>
            )}
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
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting || uploading}>
            {submitting ? 'Guardando...' : 'Guardar vehículo'}
          </button>
        )}
      </div>
    </form>
  )
}

// ─── Carousel automático para cards del mosaico ───────────────────────────────
function CardCarousel({ fotos }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (!fotos || fotos.length <= 1) return
    const t = setInterval(() => setIdx(i => (i + 1) % fotos.length), 3500)
    return () => clearInterval(t)
  }, [fotos?.length])

  if (!fotos || fotos.length === 0) return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(145deg, var(--bg-card) 0%, var(--bg-input) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Car size={72} color="var(--text-tertiary)" strokeWidth={1} />
    </div>
  )

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {fotos.map((url, i) => (
        <img
          key={url}
          src={url}
          alt=""
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: i === idx ? 1 : 0,
            transition: 'opacity 0.9s ease',
          }}
        />
      ))}
    </div>
  )
}

// ─── Preview carousel ──────────────────────────────────────────────────────────
function PhotoCarousel({ fotos, compact = false, fillHeight = false, expandable = false }) {
  const [idx, setIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const h = compact ? 180 : 220

  const navBtn = (side, onClick) => (
    <button
      onClick={onClick}
      style={{
        position: 'absolute', [side]: 8, top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: '#fff',
      }}
    >
      {side === 'left' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  )

  if (!fotos || fotos.length === 0) return (
    <div style={{
      width: '100%',
      ...(fillHeight ? { flex: 1, minHeight: 120 } : { height: h }),
      borderRadius: compact ? 0 : 12,
      background: 'var(--bg-input)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Car size={64} color="var(--text-tertiary)" strokeWidth={1} />
    </div>
  )

  return (
    <>
      <div style={{
        position: 'relative', borderRadius: compact ? 0 : 12, overflow: 'hidden',
        ...(fillHeight ? { flex: 1, minHeight: 0 } : {}),
      }}>
        <img
          src={fotos[idx]} alt=""
          style={{
            width: '100%', objectFit: 'cover', display: 'block',
            ...(fillHeight ? { height: '100%', position: 'absolute', inset: 0 } : { height: h }),
            cursor: expandable ? 'zoom-in' : 'default',
          }}
          onClick={expandable ? () => setLightbox(true) : undefined}
        />
        {/* spacer para que el div tenga altura cuando fillHeight */}
        {fillHeight && <div style={{ paddingTop: '66%' }} />}
        {fotos.length > 1 && (
          <>
            {navBtn('left',  e => { e.stopPropagation(); setIdx(i => (i - 1 + fotos.length) % fotos.length) })}
            {navBtn('right', e => { e.stopPropagation(); setIdx(i => (i + 1) % fotos.length) })}
            <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
              {fotos.map((_, i) => (
                <div key={i} onClick={() => setIdx(i)} style={{
                  width: i === idx ? 16 : 6, height: 6, borderRadius: 3,
                  background: i === idx ? '#fff' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {fotos.length > 1 && navBtn('left', e => { e.stopPropagation(); setIdx(i => (i - 1 + fotos.length) % fotos.length) })}
          <img
            src={fotos[idx]} alt=""
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
            onClick={e => e.stopPropagation()}
          />
          {fotos.length > 1 && navBtn('right', e => { e.stopPropagation(); setIdx(i => (i + 1) % fotos.length) })}
          <button
            onClick={() => setLightbox(false)}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%',
              width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff',
            }}
          >
            <X size={20} />
          </button>
        </div>
      )}
    </>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AutosPage() {
  const { autos, addAuto, updateAuto, deleteAuto, historialPrecios } = useApp()
  const { isAdmin } = useAuth()

  const [search, setSearch]       = useState('')
  const [filtroEstado, setFiltro] = useState('todos')
  const [vista, setVista]         = useState('tabla')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAuto, setEditing] = useState(null)
  const [deletingId, setDeleting] = useState(null)
  const [previewAuto, setPreview] = useState(null)
  const [cotizaciones, setCotizaciones] = useState(null)

  useEffect(() => {
    fetch('https://dolarapi.com/v1/dolares')
      .then(r => r.json())
      .then(list => {
        const get = casa => list.find(d => d.casa === casa)?.venta ?? null
        setCotizaciones({ oficial: get('oficial'), mep: get('bolsa'), blue: get('blue') })
      })
      .catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return autos
      .filter(a => {
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
      .sort((a, b) => {
        const ma = `${a.marca || ''} ${a.modelo || ''}`.toLowerCase()
        const mb = `${b.marca || ''} ${b.modelo || ''}`.toLowerCase()
        return ma.localeCompare(mb, 'es')
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
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-strong)' }}>
            <button
              className="btn btn-ghost btn-icon"
              style={{ borderRadius: 0, background: vista === 'tabla' ? 'var(--accent)' : 'var(--bg-input)', color: vista === 'tabla' ? '#fff' : 'var(--text-secondary)' }}
              onClick={() => setVista('tabla')} title="Vista lista"
            >
              <List size={16} />
            </button>
            <button
              className="btn btn-ghost btn-icon"
              style={{ borderRadius: 0, background: vista === 'mosaico' ? 'var(--accent)' : 'var(--bg-input)', color: vista === 'mosaico' ? '#fff' : 'var(--text-secondary)' }}
              onClick={() => setVista('mosaico')} title="Vista mosaico"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Agregar
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Car size={24} /></div>
            <strong>Sin resultados</strong>
            <p>No se encontraron vehículos con esos criterios.</p>
            <button className="btn btn-primary btn-sm" onClick={openAdd}>
              <Plus size={14} /> Agregar el primero
            </button>
          </div>
        </div>
      ) : vista === 'tabla' ? (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th className="hide-mobile">Año</th>
                  <th className="hide-mobile">Km</th>
                  <th className="hide-mobile">Combustible</th>
                  {isAdmin && <th className="hide-mobile">Compra</th>}
                  <th>Precio</th>
                  {isAdmin && <th className="hide-mobile">Margen</th>}
                  <th>Estado</th>
                  <th style={{ width: 80 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(auto => {
                  const margen = isAdmin && auto.precioCompra
                    ? ((auto.precio - auto.precioCompra) / auto.precioCompra * 100).toFixed(1)
                    : null
                  const thumb = thumbUrl(auto)
                  return (
                    <tr key={auto.id} onClick={() => setPreview(auto)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div style={{
                            width: 44, height: 44, borderRadius: 8,
                            background: 'var(--bg-input)', overflow: 'hidden',
                            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Thumbnail src={thumb} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, textTransform: 'uppercase' }}>
                              {auto.marca} {auto.modelo}
                              {auto.version && <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}> {auto.version}</span>}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                              {[auto.condicion, auto.color, auto.tipo].filter(Boolean).join(' · ')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="hide-mobile">{auto.año}</td>
                      <td className="hide-mobile">{auto.kilometraje ? `${Number(auto.kilometraje).toLocaleString('es-AR')} km` : '—'}</td>
                      <td className="hide-mobile">{auto.combustible || '—'}</td>
                      {isAdmin && <td className="hide-mobile">{auto.precioCompra ? formatCurrency(auto.precioCompra) : '—'}</td>}
                      <td style={{ fontWeight: 600 }}>{auto.precio ? formatCurrency(auto.precio) : '—'}</td>
                      {isAdmin && (
                        <td className="hide-mobile">
                          {margen ? (
                            <span style={{ color: Number(margen) > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 500, fontSize: 13 }}>
                              {Number(margen) > 0 ? '+' : ''}{margen}%
                            </span>
                          ) : '—'}
                        </td>
                      )}
                      <td><AutoEstadoBadge estado={auto.estado} /></td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2">
                          {isAdmin && (
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
          </div>
        </div>
      ) : (
        /* ── Vista mosaico ── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 16,
        }}>
          {filtered.map(auto => {
            const margen = isAdmin && auto.precioCompra
              ? ((auto.precio - auto.precioCompra) / auto.precioCompra * 100).toFixed(1)
              : null
            const stats = [
              auto.kilometraje ? `${Number(auto.kilometraje).toLocaleString('es-AR')} km` : null,
              auto.año ? String(auto.año) : null,
              auto.combustible || null,
            ].filter(Boolean)

            return (
              <div
                key={auto.id}
                onClick={() => setPreview(auto)}
                style={{
                  position: 'relative',
                  borderRadius: 20,
                  overflow: 'hidden',
                  height: 320,
                  cursor: 'pointer',
                  background: 'var(--bg-input)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.22)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)' }}
              >
                {/* Fondo: carousel automático */}
                <CardCarousel fotos={auto.fotos} />

                {/* Badge top-left */}
                <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'rgba(255,255,255,0.92)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 20, padding: '5px 11px',
                    fontSize: 12, fontWeight: 700, color: '#111',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                  }}>
                    <span style={{ fontSize: 11 }}>{auto.estadoPublicacion === 'Novedad' ? '★' : '●'}</span>
                    {auto.estadoPublicacion || 'En venta'}
                  </div>
                </div>

                {/* Botones acción top-right */}
                {isAdmin && (
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, display: 'flex', gap: 6 }}
                  >
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => openEdit(auto)}
                      disabled={auto.estado === 'vendido'}
                      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', color: '#fff', borderRadius: 8 }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => setDeleting(auto.id)}
                      disabled={auto.estado === 'vendido'}
                      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', color: '#ff6b6b', borderRadius: 8 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                {/* Gradiente oscuro */}
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 1,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.93) 0%, rgba(0,0,0,0.55) 45%, transparent 72%)',
                  pointerEvents: 'none',
                }} />

                {/* Contenido sobre gradiente */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 2,
                  padding: '0 16px 16px',
                  display: 'flex', flexDirection: 'column', gap: 5,
                }}>
                  {/* Precio */}
                  <div style={{ fontWeight: 800, fontSize: 22, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                    {auto.precio ? formatCurrency(auto.precio) : '—'}
                  </div>
                  {isAdmin && margen && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: Number(margen) > 0 ? '#4ade80' : '#f87171', marginTop: -2 }}>
                      {Number(margen) > 0 ? '+' : ''}{margen}% margen
                    </div>
                  )}

                  {/* Nombre vehículo */}
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', fontWeight: 500, textTransform: 'uppercase', lineHeight: 1.3 }}>
                    {auto.marca} {auto.modelo}
                    {auto.version && (
                      <span style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}> · {auto.version}</span>
                    )}
                  </div>

                  {/* Stats con separadores */}
                  {stats.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
                      {stats.map((s, i) => (
                        <React.Fragment key={i}>
                          <span>{s}</span>
                          {i < stats.length - 1 && (
                            <span style={{ margin: '0 7px', opacity: 0.35 }}>|</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {/* Pie: condición + estado */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    marginTop: 6, paddingTop: 8,
                    borderTop: '1px solid rgba(255,255,255,0.12)',
                  }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      {[auto.condicion, auto.tipo].filter(Boolean).join(' · ')}
                    </span>
                    <AutoEstadoBadge estado={auto.estado} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal agregar/editar */}
      <Modal open={modalOpen} onClose={closeModal} title={editingAuto ? 'Editar vehículo' : 'Nuevo vehículo'} size="lg" disableOutsideClick>
        <AutoForm
          initial={editingAuto ?? EMPTY_FORM}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          isAdmin={isAdmin}
          cotizaciones={cotizaciones}
        />
      </Modal>

      {/* Modal preview */}
      {previewAuto && (() => {
        const toUSD = rate => rate && previewAuto.precio
          ? Math.round(previewAuto.precio / rate).toLocaleString('es-AR')
          : null
        const previewTitle = (
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>
              {`${(previewAuto.marca || '').toUpperCase()} ${(previewAuto.modelo || '').toUpperCase()}${previewAuto.version ? ' ' + previewAuto.version.toUpperCase() : ''}`}
            </div>
            {previewAuto.precio && (
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 14px', marginTop: 5 }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 16 }}>
                  {formatCurrency(previewAuto.precio)}
                </span>
                {cotizaciones && (
                  <div style={{ display: 'flex', gap: 10, fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {toUSD(cotizaciones.oficial) && <span>Oficial <strong style={{ color: 'var(--text-secondary)' }}>U$D {toUSD(cotizaciones.oficial)}</strong></span>}
                    {toUSD(cotizaciones.mep)     && <span>MEP <strong style={{ color: 'var(--text-secondary)' }}>U$D {toUSD(cotizaciones.mep)}</strong></span>}
                    {toUSD(cotizaciones.blue)    && <span>Blue <strong style={{ color: 'var(--text-secondary)' }}>U$D {toUSD(cotizaciones.blue)}</strong></span>}
                  </div>
                )}
              </div>
            )}
          </div>
        )

        const specs = [
          ['Tipo',        previewAuto.tipo],
          ['Año',         previewAuto.año],
          ['Condición',   previewAuto.condicion],
          ['Kilometraje', previewAuto.kilometraje ? `${Number(previewAuto.kilometraje).toLocaleString('es-AR')} km` : null],
          ['Combustible', previewAuto.combustible],
          ['Transmisión', previewAuto.transmision],
          ['Tracción',    previewAuto.traccion],
          ['Carrocería',  previewAuto.carroceria],
          ['Puertas',     previewAuto.puertas],
          ['Motor',       previewAuto.motor],
          ['Color',       previewAuto.color],
          ['Patente',     previewAuto.patente],
          ['Estado',      <AutoEstadoBadge key="e" estado={previewAuto.estado} />],
          isAdmin && previewAuto.precioCompra ? ['Precio compra', formatCurrency(previewAuto.precioCompra)] : null,
          ['Publicación', previewAuto.estadoPublicacion],
          ['Agregado',    formatDate(previewAuto.createdAt)],
        ].filter(row => row && row[1])

        const historialAuto = historialPrecios.filter(h => h.autoId === previewAuto.id)
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

        return (
          <Modal open={!!previewAuto} onClose={() => setPreview(null)} title={previewTitle} size="xl" noScroll>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, height: '100%' }}>

              {/* Izquierda: carrusel + descripción + historial */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
                <PhotoCarousel fotos={previewAuto.fotos} fillHeight expandable />
                {previewAuto.descripcion && (
                  <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Descripción</div>
                    <p style={{ fontSize: 13, lineHeight: 1.5, margin: 0, textTransform: 'uppercase' }}>{previewAuto.descripcion}</p>
                  </div>
                )}
                {historialAuto.length > 0 && (
                  <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} /> Historial de precios
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {historialAuto.map(h => (
                        <div key={h.id} style={{ fontSize: 12, paddingBottom: 6, borderBottom: '1px solid var(--divider)' }}>
                          <div style={{ color: 'var(--text-tertiary)', marginBottom: 1 }}>{formatDate(h.fecha)}</div>
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
                )}
              </div>

              {/* Derecha: especificaciones */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignContent: 'start' }}>
                {specs.map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '8px 12px' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, textTransform: typeof v === 'string' ? 'uppercase' : 'none' }}>{v}</div>
                  </div>
                ))}
              </div>

            </div>
          </Modal>
        )
      })()}

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
