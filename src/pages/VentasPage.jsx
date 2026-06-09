import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Plus, Trash2, ShoppingBag, FileText, Search, X, UserPlus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDate, today } from '../utils/helpers'
import { TipoPagoBadge } from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SearchBar from '../components/ui/SearchBar'
import { generateFacturaPDF } from '../utils/pdfGenerator'

// ─── Helper: fila de resumen ─────────────────────────────────────────────────
function SummaryRow({ label, value, valueColor, bold }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 16px',
      background: bold ? 'var(--bg-tertiary)' : 'var(--bg-modal)',
      borderTop: bold ? '1px solid var(--border-color)' : 'none',
    }}>
      <span style={{ fontSize: 13, color: bold ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ fontSize: bold ? 16 : 13, fontWeight: bold ? 700 : 500, color: valueColor || 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

// ─── Helper: avatar de usuario ───────────────────────────────────────────────
function UserAvatar({ user, size = 44 }) {
  if (!user) return null
  return user.foto_url
    ? <img src={user.foto_url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
        {user.nombre?.[0]?.toUpperCase()}
      </div>
}

// ─── Formulario de venta (wizard 6 pasos) ────────────────────────────────────
function VentaForm({ onSubmit, onCancel }) {
  const { autos, clientes, addCliente } = useApp()
  const { usuarios, currentUser } = useAuth()

  const [step, setStep] = useState(1)

  // Auto combobox
  const [autoSearch, setAutoSearch] = useState('')
  const [autoOpen,   setAutoOpen]   = useState(false)
  const autoRef = useRef(null)

  // Nuevo cliente inline
  const [showNC,   setShowNC]   = useState(false)
  const [savingNC, setSavingNC] = useState(false)
  const [nc, setNC] = useState({ nombre: '', apellido: '', dni: '', telefono: '' })

  // Autos disponibles ordenados por marca
  const autosDisponibles = useMemo(() =>
    [...autos.filter(a => a.estado === 'disponible')]
      .sort((a, b) => a.marca.localeCompare(b.marca, 'es')),
    [autos]
  )

  const autosFiltrados = useMemo(() => {
    const q = autoSearch.trim().toLowerCase()
    if (!q) return autosDisponibles
    return autosDisponibles.filter(a =>
      `${a.marca} ${a.modelo} ${a.año} ${a.version || ''}`.toLowerCase().includes(q)
    )
  }, [autosDisponibles, autoSearch])

  // Clientes ordenados por apellido
  const clientesOrdenados = useMemo(() =>
    [...clientes].sort((a, b) => (a.apellido || '').localeCompare(b.apellido || '', 'es')),
    [clientes]
  )

  const vendedores = useMemo(() =>
    usuarios.filter(u => ['vendedor', 'administrador'].includes(u.rol)).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [usuarios]
  )

  const [form, setForm] = useState({
    autoId:      '',
    clienteId:   '',
    vendedorId:  currentUser?.rol === 'vendedor' ? currentUser.id : '',
    tipoPago:    'contado',
    cuotas:      12,
    interes:     30,
    precioFinal: '',
    fecha:       today(),
  })
  const [errors, setErrors]                 = useState({})
  const [comisionPct,   setComisionPct]     = useState('')
  const [comisionMonto, setComisionMonto]   = useState('')
  const [pagosATerceros, setPagosATerceros] = useState([])
  const [transferencia, setTransferencia] = useState({ cargo: 'icy', monto: '' })
  const [autoUsado, setAutoUsado] = useState({ activo: false, marca: '', modelo: '', año: '', km: '', valor: '' })

  // Cerrar auto-dropdown al click fuera
  useEffect(() => {
    function handleClick(e) {
      if (autoRef.current && !autoRef.current.contains(e.target)) setAutoOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function handleAutoSelect(auto) {
    setForm(prev => ({ ...prev, autoId: auto.id, precioFinal: auto.precio }))
    setAutoSearch(`${auto.marca} ${auto.modelo} ${auto.año}`)
    setAutoOpen(false)
    setErrors(prev => ({ ...prev, autoId: '' }))
  }

  function handleAutoClear() {
    setForm(prev => ({ ...prev, autoId: '', precioFinal: '' }))
    setAutoSearch('')
    setAutoOpen(true)
  }

  async function handleGuardarCliente() {
    if (!nc.nombre || !nc.apellido || !nc.dni || !nc.telefono) return
    setSavingNC(true)
    const nuevo = await addCliente({
      nombre:   nc.nombre.trim().toUpperCase(),
      apellido: nc.apellido.trim().toUpperCase(),
      dni:      nc.dni.trim().toUpperCase(),
      telefono: nc.telefono.trim(),
    })
    setSavingNC(false)
    if (nuevo?.id) set('clienteId', nuevo.id)
    setShowNC(false)
    setNC({ nombre: '', apellido: '', dni: '', telefono: '' })
  }

  function addPagoTercero() {
    setPagosATerceros(prev => [...prev, { id: Date.now(), descripcion: '', monto: '' }])
  }
  function updatePagoTercero(id, field, value) {
    setPagosATerceros(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }
  function removePagoTercero(id) {
    setPagosATerceros(prev => prev.filter(p => p.id !== id))
  }

  // Cálculos
  const autoSeleccionado     = autos.find(a => a.id === form.autoId)
  const vendedorSeleccionado = usuarios.find(u => u.id === form.vendedorId)
  const precioBase           = Number(form.precioFinal) || 0
  const interesPct           = form.tipoPago === 'financiado' ? Number(form.interes) || 0 : 0
  const totalConInteres      = precioBase * (1 + interesPct / 100)
  const valorCuota           = form.tipoPago === 'financiado' && form.cuotas
                               ? totalConInteres / Number(form.cuotas) : null
  const gananciaPretendidaAuto = autoSeleccionado?.gananciaPretendida || 0
  const ganancia             = autoSeleccionado && precioBase
                               ? precioBase - gananciaPretendidaAuto : null
  const comisionCalculada    = ganancia != null && vendedorSeleccionado
                               ? Math.round((ganancia * (vendedorSeleccionado.comision || 0)) / 100) : 0
  const totalTerceros        = pagosATerceros.reduce((s, p) => s + (Number(p.monto) || 0), 0)
  const transferenciaNum     = transferencia.cargo === 'icy' ? Number(transferencia.monto) || 0 : 0
  const utilidad             = precioBase - gananciaPretendidaAuto - (Number(comisionMonto) || 0) - totalTerceros - transferenciaNum

  // Navegación entre pasos
  function nextStep() {
    const e = {}
    if (step === 1 && !form.vendedorId)  e.vendedorId  = 'Seleccioná un vendedor'
    if (step === 2 && !form.clienteId)   e.clienteId   = 'Seleccioná un cliente'
    if (step === 3) {
      if (!form.autoId) e.autoId = 'Seleccioná un vehículo'
      if (!form.fecha)  e.fecha  = 'Ingresá la fecha'
    }
    if (step === 4 && !form.precioFinal) e.precioFinal = 'Ingresá el precio de venta'
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setErrors({})
    // Pre-fill comisión al entrar al paso 5 solo si tiene comisión configurada
    if (step === 4 && comisionMonto === '') {
      const pct = vendedorSeleccionado?.comision ?? 0
      if (pct > 0) {
        setComisionPct(String(pct))
        setComisionMonto(String(comisionCalculada))
      }
    }
    setStep(s => s + 1)
  }

  function prevStep() {
    setErrors({})
    setStep(s => s - 1)
  }

  function handleSubmit() {
    const pagosLimpios = pagosATerceros
      .filter(p => p.descripcion.trim() && p.monto)
      .map(p => ({ descripcion: p.descripcion.trim(), monto: Number(p.monto) }))
    onSubmit({
      ...form,
      precioFinal: precioBase,
      cuotas: form.tipoPago === 'financiado' ? Number(form.cuotas) : null,
      comisionVendedorMonto: Number(comisionMonto) || 0,
      pagosTerceros: pagosLimpios,
      transferencia: transferenciaNum > 0 ? transferenciaNum : null,
      utilidad,
      autoUsado: autoUsado.activo ? { ...autoUsado, valor: Number(autoUsado.valor) || 0 } : null,
    }, autoSeleccionado)
  }

  // Labels de pasos
  const STEPS = ['Vendedor', 'Cliente', 'Vehículo', 'Precio', 'Comisión', 'Terceros', 'Utilidad']

  // ── Indicador de pasos ────────────────────────────────────────────────────────
  const stepIndicator = (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 24 }}>
      {STEPS.map((label, i) => {
        const n = i + 1
        const done   = n < step
        const active = n === step
        return (
          <React.Fragment key={n}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: done ? 'var(--success)' : active ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: done || active ? '#fff' : 'var(--text-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
                boxShadow: active ? '0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent)' : 'none',
              }}>
                {done ? '✓' : n}
              </div>
              <span style={{ fontSize: 11, color: active ? 'var(--accent)' : 'var(--text-tertiary)', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? 'var(--success)' : 'var(--divider)', marginTop: 15, transition: 'background 0.3s', maxWidth: 32 }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )

  // ── Botones de navegación ─────────────────────────────────────────────────────
  const nav = (
    <div className="modal-footer" style={{ paddingInline: 0, paddingBottom: 0, marginTop: 20 }}>
      {step > 1
        ? <button type="button" className="btn btn-secondary" onClick={prevStep}>← Atrás</button>
        : <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
      }
      {step < 7
        ? <button type="button" className="btn btn-primary" onClick={nextStep}>Continuar →</button>
        : <button type="button" className="btn btn-primary" onClick={handleSubmit}>Registrar venta</button>
      }
    </div>
  )

  return (
    <div>
      {stepIndicator}

      {/* ═══════════════════════════════════════════════════════════════════════
          PASO 1 — Vendedor
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16, marginTop: 0 }}>
            ¿Quién realiza esta venta?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
            {vendedores.map(u => {
              const selected = form.vendedorId === u.id
              const locked   = currentUser?.rol === 'vendedor'
              return (
                <button key={u.id} type="button"
                  onClick={() => !locked && set('vendedorId', u.id)}
                  className={`venta-vendedor-btn${selected ? ' is-selected' : ''}${locked ? ' is-locked' : ''}`}
                  style={{
                    border: `2px solid ${selected ? 'var(--accent)' : 'var(--border-color)'}`,
                    background: selected ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'var(--bg-tertiary)',
                  }}>
                  <UserAvatar user={u} size={48} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{u.nombre}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'capitalize', marginTop: 2 }}>{u.rol}</div>
                  </div>
                  {selected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />}
                </button>
              )
            })}
          </div>
          {errors.vendedorId && <span className="form-error" style={{ display: 'block', marginTop: 10 }}>{errors.vendedorId}</span>}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PASO 2 — Cliente
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            ¿A quién le vendemos este vehículo?
          </p>
          {!showNC ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <select className={`form-input form-select${errors.clienteId ? ' input-error' : ''}`} value={form.clienteId} onChange={e => set('clienteId', e.target.value)}>
                <option value="">Seleccionar cliente existente...</option>
                {clientesOrdenados.map(c => <option key={c.id} value={c.id}>{c.apellido}, {c.nombre} — {c.dni}</option>)}
              </select>
              <button type="button" className="btn btn-secondary" onClick={() => setShowNC(true)}
                style={{ alignSelf: 'stretch', gap: 8, justifyContent: 'center', border: '2px dashed var(--accent)', color: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 6%, transparent)' }}>
                <UserPlus size={16} /> Nuevo cliente
              </button>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Nuevo cliente</span>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowNC(false)} style={{ padding: '2px 8px', gap: 4, fontSize: 12 }}>
                  <X size={12} /> Cancelar
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input className="form-input" placeholder="Nombre *" style={{ fontSize: 13, textTransform: 'uppercase', background: 'var(--bg-modal)' }} value={nc.nombre} onChange={e => setNC(p => ({ ...p, nombre: e.target.value }))} />
                <input className="form-input" placeholder="Apellido *" style={{ fontSize: 13, textTransform: 'uppercase', background: 'var(--bg-modal)' }} value={nc.apellido} onChange={e => setNC(p => ({ ...p, apellido: e.target.value }))} />
                <input className="form-input" placeholder="DNI *" style={{ fontSize: 13, background: 'var(--bg-modal)' }} value={nc.dni} onChange={e => setNC(p => ({ ...p, dni: e.target.value }))} />
                <input className="form-input" type="tel" placeholder="Teléfono *" style={{ fontSize: 13, background: 'var(--bg-modal)' }} value={nc.telefono} onChange={e => setNC(p => ({ ...p, telefono: e.target.value }))} />
              </div>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleGuardarCliente}
                disabled={savingNC || !nc.nombre || !nc.apellido || !nc.dni || !nc.telefono}
                style={{ alignSelf: 'flex-end' }}>
                {savingNC ? 'Guardando...' : 'Guardar cliente'}
              </button>
            </div>
          )}
          {errors.clienteId && <span className="form-error">{errors.clienteId}</span>}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PASO 3 — Vehículo + Fecha
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Buscador de autos */}
          <div className="form-group">
            <label className="form-label">Vehículo *</label>
            <div ref={autoRef} style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
                <input className={`form-input${errors.autoId ? ' input-error' : ''}`}
                  style={{ paddingLeft: 36, paddingRight: form.autoId ? 36 : 12 }}
                  value={autoSearch}
                  placeholder="Buscar por marca, modelo..."
                  onChange={e => {
                    setAutoSearch(e.target.value)
                    setAutoOpen(true)
                    if (form.autoId) setForm(prev => ({ ...prev, autoId: '', precioFinal: '' }))
                  }}
                  onFocus={() => setAutoOpen(true)} />
                {form.autoId && (
                  <button type="button" onClick={handleAutoClear} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 2, lineHeight: 0 }}>
                    <X size={14} />
                  </button>
                )}
              </div>
              {autoOpen && (autosFiltrados.length > 0 || autoSearch.trim()) && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 60, background: 'var(--bg-modal)', border: '1px solid var(--border-color)', borderRadius: 10, maxHeight: 180, overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
                  {autosFiltrados.length === 0 ? (
                    <div style={{ padding: '10px 14px', color: 'var(--text-tertiary)', fontSize: 13 }}>Sin resultados para "{autoSearch}"</div>
                  ) : autosFiltrados.map((a, i) => (
                    <button key={a.id} type="button" onClick={() => handleAutoSelect(a)}
                      className="venta-auto-option"
                      style={{ borderBottom: i < autosFiltrados.length - 1 ? '1px solid var(--divider)' : 'none' }}>
                      {a.fotos?.[0] && <img src={a.fotos[0]} alt="" style={{ width: 44, height: 32, objectFit: 'cover', borderRadius: 5, marginRight: 10, flexShrink: 0 }} />}
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600 }}>{a.marca} {a.modelo}</span>
                        <span style={{ color: 'var(--text-tertiary)', marginLeft: 6, fontSize: 12 }}>{a.año}{a.version ? ` · ${a.version}` : ''}</span>
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8 }}>{formatCurrency(a.precio)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.autoId && <span className="form-error">{errors.autoId}</span>}
            {autosDisponibles.length === 0 && <span style={{ fontSize: 12, color: 'var(--warning)' }}>No hay autos disponibles.</span>}
          </div>

          {/* Preview del auto seleccionado */}
          {autoSeleccionado && (
            <div style={{ display: 'flex', gap: 12, padding: 12, background: 'var(--bg-tertiary)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
              {autoSeleccionado.fotos?.[0]
                ? <img src={autoSeleccionado.fotos[0]} alt="" style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                : <div style={{ width: 80, height: 56, background: 'var(--bg-secondary)', borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 11 }}>Sin foto</div>
              }
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, justifyContent: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{autoSeleccionado.marca} {autoSeleccionado.modelo}</span>
                <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                  {autoSeleccionado.año}{autoSeleccionado.version ? ` · ${autoSeleccionado.version}` : ''}{autoSeleccionado.km ? ` · ${autoSeleccionado.km.toLocaleString('es-AR')} km` : ''}
                </span>
                <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{formatCurrency(autoSeleccionado.precio)}</span>
              </div>
            </div>
          )}

          {/* Fecha */}
          <div className="form-group">
            <label className="form-label">Fecha *</label>
            <input type="date" className={`form-input${errors.fecha ? ' input-error' : ''}`} value={form.fecha} onChange={e => set('fecha', e.target.value)} />
            {errors.fecha && <span className="form-error">{errors.fecha}</span>}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PASO 4 — Precio + forma de pago
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Precio de venta *</label>
              <input type="text" inputMode="numeric"
                className={`form-input${errors.precioFinal ? ' input-error' : ''}`}
                value={form.precioFinal !== '' ? formatCurrency(Number(form.precioFinal)) : ''}
                onChange={e => set('precioFinal', e.target.value.replace(/\D/g, ''))}
                placeholder="$ 0" autoFocus />
              {errors.precioFinal && <span className="form-error">{errors.precioFinal}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Forma de pago *</label>
              <select className="form-input form-select" value={form.tipoPago} onChange={e => set('tipoPago', e.target.value)}>
                <option value="contado">Contado</option>
                <option value="financiado">Financiado</option>
              </select>
            </div>
          </div>

          {form.tipoPago === 'financiado' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Cuotas</label>
                  <select className="form-input form-select" value={form.cuotas} onChange={e => set('cuotas', e.target.value)}>
                    {[6, 12, 18, 24, 36, 48, 60].map(n => <option key={n} value={n}>{n} cuotas</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Interés total (%)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="range" min="0" max="200" step="5" value={form.interes} onChange={e => set('interes', e.target.value)} style={{ flex: 1, accentColor: 'var(--accent)' }} />
                    <input type="number" className="form-input" min="0" max="999" step="1" value={form.interes} onChange={e => set('interes', e.target.value)} style={{ width: 62, textAlign: 'right', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13, flexShrink: 0 }}>%</span>
                  </div>
                </div>
              </div>
              {precioBase > 0 && interesPct > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>Total financiado</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{formatCurrency(totalConInteres)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>Cuota ({form.cuotas}m)</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--info)' }}>{formatCurrency(valorCuota)}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Auto usado como parte de pago */}
          <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 12 }}>
            <div
              onClick={() => setAutoUsado(p => ({ ...p, activo: !p.activo }))}
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
              <div style={{
                width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                background: autoUsado.activo ? 'var(--accent)' : 'var(--bg-input)',
                border: '1px solid var(--border-color)', position: 'relative', transition: 'background 0.2s',
              }}>
                <div style={{
                  position: 'absolute', top: 2, left: autoUsado.activo ? 18 : 2,
                  width: 16, height: 16, borderRadius: '50%', background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 0.2s',
                }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>El cliente entrega un vehículo como parte de pago</span>
            </div>
            {autoUsado.activo && (
              <div style={{ marginTop: 10, borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input className="form-input" placeholder="Marca" style={{ fontSize: 13 }} value={autoUsado.marca} onChange={e => setAutoUsado(p => ({ ...p, marca: e.target.value }))} />
                  <input className="form-input" placeholder="Modelo" style={{ fontSize: 13 }} value={autoUsado.modelo} onChange={e => setAutoUsado(p => ({ ...p, modelo: e.target.value }))} />
                  <input className="form-input" placeholder="Año" style={{ fontSize: 13 }} value={autoUsado.año} onChange={e => setAutoUsado(p => ({ ...p, año: e.target.value }))} />
                  <input type="text" inputMode="numeric" className="form-input" placeholder="Kilometraje"
                    style={{ fontSize: 13 }}
                    value={autoUsado.km !== '' ? Number(autoUsado.km).toLocaleString('es-AR') : ''}
                    onChange={e => setAutoUsado(p => ({ ...p, km: e.target.value.replace(/\D/g, '') }))} />
                </div>
                <input type="text" inputMode="numeric" className="form-input" placeholder="Valor acordado $ 0"
                  style={{ fontSize: 13 }}
                  value={autoUsado.valor !== '' ? formatCurrency(Number(autoUsado.valor)) : ''}
                  onChange={e => setAutoUsado(p => ({ ...p, valor: e.target.value.replace(/\D/g, '') }))} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PASO 5 — Comisión del vendedor
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 5 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {vendedorSeleccionado && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg-tertiary)', borderRadius: 10 }}>
              <UserAvatar user={vendedorSeleccionado} size={40} />
              <div>
                <div style={{ fontWeight: 600 }}>{vendedorSeleccionado.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Comisión base: {vendedorSeleccionado.comision ?? 0}%</div>
              </div>
              {ganancia !== null && (
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Ganancia bruta</div>
                  <div style={{ fontWeight: 700, color: ganancia >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatCurrency(ganancia)}</div>
                </div>
              )}
            </div>
          )}

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Porcentaje (%)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="text" inputMode="decimal" className="form-input" value={comisionPct}
                  onChange={e => {
                    const pct = e.target.value.replace(/[^0-9.]/g, '')
                    setComisionPct(pct)
                    const calc = ganancia != null ? Math.round(ganancia * (Number(pct) || 0) / 100) : 0
                    setComisionMonto(String(calc))
                  }}
                  placeholder="0" />
                <span style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, flexShrink: 0 }}>%</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Monto</label>
              <input type="text" inputMode="numeric" className="form-input"
                value={comisionMonto !== '' ? formatCurrency(Number(comisionMonto)) : ''}
                onChange={e => {
                  const raw = e.target.value.replace(/\D/g, '')
                  setComisionMonto(raw)
                  const pct = ganancia && ganancia !== 0 ? ((Number(raw) || 0) / ganancia * 100).toFixed(2) : '0'
                  setComisionPct(pct)
                }}
                placeholder="$ 0" />
            </div>
          </div>

          <button type="button"
            style={{ alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-tertiary)', padding: 0 }}
            onClick={() => {
              const pct = vendedorSeleccionado?.comision ?? 0
              setComisionPct(String(pct))
              setComisionMonto(String(comisionCalculada))
            }}>
            ↩ Restablecer ({vendedorSeleccionado?.comision ?? 0}% → {formatCurrency(comisionCalculada)})
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PASO 6 — Pagos a terceros
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 6 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            Agregá los pagos a terceros involucrados en esta venta (opcional).
          </p>

          {pagosATerceros.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-tertiary)', fontSize: 13 }}>
              Sin pagos a terceros registrados.
            </div>
          )}

          {pagosATerceros.map(p => (
            <div key={p.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="form-input" placeholder="Descripción (ej: Gestoría)"
                style={{ flex: 2 }}
                value={p.descripcion}
                onChange={e => updatePagoTercero(p.id, 'descripcion', e.target.value)} />
              <input type="text" inputMode="numeric" className="form-input" placeholder="$ 0"
                style={{ flex: 1, minWidth: 110 }}
                value={p.monto !== '' ? formatCurrency(Number(p.monto)) : ''}
                onChange={e => updatePagoTercero(p.id, 'monto', e.target.value.replace(/\D/g, ''))} />
              <button type="button" className="btn btn-ghost btn-icon btn-sm"
                style={{ color: 'var(--danger)', flexShrink: 0 }}
                onClick={() => removePagoTercero(p.id)}>
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          <button type="button" className="btn btn-secondary btn-sm" onClick={addPagoTercero}
            style={{ alignSelf: 'flex-start', gap: 6 }}>
            <Plus size={14} /> Agregar pago
          </button>

          {totalTerceros > 0 && (
            <div style={{ textAlign: 'right', fontSize: 13, color: 'var(--text-secondary)', paddingTop: 4 }}>
              Total terceros: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalTerceros)}</strong>
            </div>
          )}

          {/* Transferencia */}
          <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Transferencia</div>
            <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-strong)', marginBottom: 10 }}>
              {[['icy', 'A cargo de ICY'], ['comprador', 'A cargo del comprador']].map(([val, label], i) => {
                const active = transferencia.cargo === val
                return (
                  <button key={val} type="button"
                    onClick={() => setTransferencia(t => ({ ...t, cargo: val }))}
                    style={{
                      flex: 1, padding: '10px 8px', fontSize: 13,
                      fontWeight: active ? 700 : 400,
                      background: active ? 'var(--accent)' : 'var(--bg-input)',
                      color: active ? '#fff' : 'var(--text-secondary)',
                      border: 'none',
                      borderRight: i === 0 ? '1px solid var(--border-strong)' : 'none',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                    {label}
                  </button>
                )
              })}
            </div>
            {transferencia.cargo === 'icy' && (
              <input
                type="text" inputMode="numeric" className="form-input"
                placeholder="Monto transferencia $ 0"
                value={transferencia.monto !== '' ? formatCurrency(Number(transferencia.monto)) : ''}
                onChange={e => setTransferencia(t => ({ ...t, monto: e.target.value.replace(/\D/g, '') }))}
              />
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          PASO 7 — Utilidad ICY (resumen final)
      ════════════════════════════════════════════════════════════════════════ */}
      {step === 7 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Recap vehículo + vendedor */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>Vehículo</div>
              {autoSeleccionado?.fotos?.[0] && (
                <img src={autoSeleccionado.fotos[0]} alt="" style={{ width: '100%', height: 56, objectFit: 'cover', borderRadius: 6, marginBottom: 6 }} />
              )}
              <div style={{ fontSize: 13, fontWeight: 700 }}>{autoSeleccionado?.marca} {autoSeleccionado?.modelo}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{autoSeleccionado?.año}</div>
            </div>
            <div style={{ padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>Vendedor</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserAvatar user={vendedorSeleccionado} size={32} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{vendedorSeleccionado?.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{vendedorSeleccionado?.rol}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Auto usado entregado */}
          {autoUsado.activo && (
            <div style={{ padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Auto entregado como parte de pago</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{[autoUsado.marca, autoUsado.modelo, autoUsado.año].filter(Boolean).join(' ')}</div>
              {autoUsado.km && <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{Number(autoUsado.km).toLocaleString('es-AR')} km</div>}
              {autoUsado.valor > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Valor acordado</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--info)' }}>{formatCurrency(Number(autoUsado.valor))}</span>
                </div>
              )}
            </div>
          )}

          {/* Desglose financiero */}
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
            <SummaryRow label="Precio de venta" value={formatCurrency(precioBase)} />
            {autoUsado.activo && autoUsado.valor > 0 && (
              <SummaryRow label={`Auto usado (${[autoUsado.marca, autoUsado.modelo].filter(Boolean).join(' ')})`} value={`− ${formatCurrency(Number(autoUsado.valor))}`} valueColor="var(--info)" />
            )}
            {gananciaPretendidaAuto > 0 && (
              <SummaryRow
                label={`Ganancia propietario`}
                value={`− ${formatCurrency(gananciaPretendidaAuto)}`}
                valueColor="var(--info)" />
            )}
            <SummaryRow
              label={`Comisión ${vendedorSeleccionado?.nombre ?? ''}`}
              value={`− ${formatCurrency(Number(comisionMonto) || 0)}`}
              valueColor="var(--warning)" />
            {pagosATerceros.filter(p => p.descripcion.trim() && p.monto).map(p => (
              <SummaryRow key={p.id}
                label={p.descripcion}
                value={`− ${formatCurrency(Number(p.monto))}`}
                valueColor="var(--text-secondary)" />
            ))}
            {transferenciaNum > 0 && (
              <SummaryRow
                label="Transferencia (ICY)"
                value={`− ${formatCurrency(transferenciaNum)}`}
                valueColor="var(--text-secondary)" />
            )}
            <SummaryRow
              label="Utilidad ICY"
              value={formatCurrency(utilidad)}
              valueColor={utilidad >= 0 ? 'var(--success)' : 'var(--danger)'}
              bold />
          </div>
        </div>
      )}

      {nav}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function VentasPage() {
  const { ventas, addVenta, deleteVenta, getAutoById, getClienteById, getVehiculoEntregadoByVentaId } = useApp()
  const { isAdmin, usuarios } = useAuth()

  const [search, setSearch]      = useState('')
  const [modalOpen, setModal]    = useState(false)
  const [deletingVenta, setDel]  = useState(null)
  const [ventaExitosa, setVentaExitosa] = useState(false)

  function getVendedorNombre(id) {
    return usuarios.find(u => u.id === id)?.nombre ?? '—'
  }

  function getVendedorObj(id) {
    return usuarios.find(u => u.id === id) || { id, nombre: '—' }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return ventas
    return ventas.filter(v => {
      const auto    = getAutoById(v.autoId)
      const cliente = getClienteById(v.clienteId)
      return (
        (auto && `${auto.marca} ${auto.modelo}`.toLowerCase().includes(q))
        || (cliente && `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(q))
        || getVendedorNombre(v.vendedorId).toLowerCase().includes(q)
      )
    })
  }, [ventas, search])

  const sorted = [...filtered].sort((a, b) => b.fecha.localeCompare(a.fecha))

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ventas</h1>
          <p className="page-subtitle">{ventas.length} ventas registradas</p>
        </div>

        <div className="flex items-center gap-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar auto, cliente..." />
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <Plus size={16} /> Registrar venta
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {sorted.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><ShoppingBag size={24} /></div>
              <strong>Sin ventas</strong>
              <p>Registrá tu primera venta cuando vendas un auto.</p>
              <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>
                <Plus size={14} /> Nueva venta
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Auto</th>
                  <th className="hide-mobile">Cliente</th>
                  <th className="hide-mobile">Vendedor</th>
                  <th>Pago</th>
                  <th>Precio final</th>
                  {isAdmin && <th className="hide-mobile">Ganancia</th>}
                  {isAdmin && <th className="hide-mobile">Comisión</th>}
                  <th className="hide-mobile">Fecha</th>
                  <th style={{ width: 60 }}>Acc.</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(v => {
                  const auto    = getAutoById(v.autoId)
                  const cliente = getClienteById(v.clienteId)
                  return (
                    <tr key={v.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {auto ? `${auto.marca} ${auto.modelo}` : 'Auto eliminado'}
                        </div>
                        {auto && (
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{auto.año}</div>
                        )}
                      </td>
                      <td className="hide-mobile">
                        {cliente ? `${cliente.apellido}, ${cliente.nombre}` : '—'}
                      </td>
                      <td className="hide-mobile">{getVendedorNombre(v.vendedorId)}</td>
                      <td>
                        <TipoPagoBadge tipo={v.tipoPago} />
                        {v.tipoPago === 'financiado' && v.cuotas && (
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                            {v.cuotas} cuotas · {formatCurrency(v.precioFinal / v.cuotas)}/mes
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(v.precioFinal)}</td>
                      {isAdmin && (
                        <td className="hide-mobile"
                          style={{ color: v.ganancia >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                          {formatCurrency(v.ganancia)}
                        </td>
                      )}
                      {isAdmin && (
                        <td className="hide-mobile" style={{ color: 'var(--warning)', fontSize: 13 }}>
                          {formatCurrency(v.comisionVendedor)}
                        </td>
                      )}
                      <td className="hide-mobile" style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                        {formatDate(v.fecha)}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => generateFacturaPDF(v, auto, cliente, getVendedorObj(v.vendedorId), getVehiculoEntregadoByVentaId(v.id)).catch(console.error)}
                            title="Descargar boleto de compraventa">
                            <FileText size={15} />
                          </button>
                          {isAdmin && (
                            <button className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => setDel(v)}
                              style={{ color: 'var(--danger)' }}
                              title="Anular venta">
                              <Trash2 size={15} />
                            </button>
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

      <Modal open={modalOpen} onClose={() => setModal(false)} title="Registrar venta" size="lg">
        <VentaForm
          onSubmit={async (data, auto) => {
            await addVenta(data, auto)
            setModal(false)
            setVentaExitosa(true)
            setTimeout(() => setVentaExitosa(false), 3500)
            const cliente = getClienteById(data.clienteId)
            if (cliente?.telefono) {
              const nombre = `${cliente.nombre} ${cliente.apellido}`.trim()
              const vehiculo = `${auto.marca} ${auto.modelo}`
              const msg = `Gracias ${nombre} por haber elegido ICY Automotores, para la compra de su ${vehiculo}. Que lo disfrutes! Cualquier consulta estamos a tu disposición`
              const clean = cliente.telefono.replace(/[\s\-().+]/g, '')
              const num = clean.startsWith('54') ? clean : `54${clean}`
              setTimeout(() => window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank'), 400)
            }
          }}
          onCancel={() => setModal(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deletingVenta}
        onClose={() => setDel(null)}
        onConfirm={() => {
          deleteVenta(deletingVenta.id, deletingVenta.autoId)
          setDel(null)
        }}
        title="Anular venta"
        message="¿Anular esta venta? El auto volverá a estar disponible en el stock."
      />

      {ventaExitosa && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: '#16a34a', color: '#fff',
          padding: '16px 32px', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: 12,
          fontSize: 16, fontWeight: 600, zIndex: 9999,
          animation: 'fadeInUp 0.3s ease',
        }}>
          <span style={{ fontSize: 22 }}>✓</span>
          Venta realizada con éxito
        </div>
      )}
    </>
  )
}
