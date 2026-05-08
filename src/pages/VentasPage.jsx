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

// ─── Formulario de venta ──────────────────────────────────────────────────────
function VentaForm({ onSubmit, onCancel }) {
  const { autos, clientes, addCliente } = useApp()
  const { usuarios, currentUser } = useAuth()

  // Auto combobox
  const [autoSearch, setAutoSearch]   = useState('')
  const [autoOpen,   setAutoOpen]     = useState(false)
  const autoRef = useRef(null)

  // Nuevo cliente inline
  const [showNC,    setShowNC]    = useState(false)
  const [savingNC,  setSavingNC]  = useState(false)
  const [nc, setNC] = useState({ nombre: '', apellido: '', dni: '', telefono: '', email: '' })

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

  const empleados = useMemo(() =>
    usuarios.filter(u => u.rol === 'empleado').sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [usuarios]
  )

  const [form, setForm] = useState({
    autoId:     '',
    clienteId:  '',
    vendedorId: currentUser?.rol === 'empleado' ? currentUser.id : '',
    tipoPago:   'contado',
    cuotas:     12,
    interes:    30,
    precioFinal: '',
    fecha: today(),
  })
  const [errors, setErrors] = useState({})

  // Cerrar dropdown al click fuera
  useEffect(() => {
    function handleClick(e) {
      if (autoRef.current && !autoRef.current.contains(e.target)) {
        setAutoOpen(false)
      }
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

  // Cálculos
  const autoSeleccionado    = autos.find(a => a.id === form.autoId)
  const vendedorSeleccionado = usuarios.find(u => u.id === form.vendedorId)
  const precioBase          = Number(form.precioFinal) || 0
  const interesPct          = form.tipoPago === 'financiado' ? Number(form.interes) || 0 : 0
  const totalConInteres     = precioBase * (1 + interesPct / 100)
  const valorCuota          = form.tipoPago === 'financiado' && form.cuotas
                              ? totalConInteres / Number(form.cuotas) : null
  const ganancia            = autoSeleccionado && precioBase
                              ? precioBase - autoSeleccionado.precioCompra : null
  const comision            = ganancia != null && vendedorSeleccionado
                              ? (ganancia * (vendedorSeleccionado.comision || 0)) / 100 : null

  // Guardar nuevo cliente
  async function handleGuardarCliente() {
    if (!nc.nombre || !nc.apellido || !nc.dni || !nc.telefono) return
    setSavingNC(true)
    const nuevo = await addCliente({
      nombre:   nc.nombre.trim().toUpperCase(),
      apellido: nc.apellido.trim().toUpperCase(),
      dni:      nc.dni.trim().toUpperCase(),
      telefono: nc.telefono.trim(),
      email:    nc.email.trim(),
    })
    setSavingNC(false)
    if (nuevo?.id) set('clienteId', nuevo.id)
    setShowNC(false)
    setNC({ nombre: '', apellido: '', dni: '', telefono: '', email: '' })
  }

  function validate() {
    const e = {}
    if (!form.autoId)      e.autoId      = 'Seleccioná un auto'
    if (!form.clienteId)   e.clienteId   = 'Seleccioná un cliente'
    if (!form.vendedorId)  e.vendedorId  = 'Seleccioná un vendedor'
    if (!form.precioFinal) e.precioFinal = 'Ingresá el precio final'
    if (!form.fecha)       e.fecha       = 'Ingresá la fecha'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    onSubmit({
      ...form,
      precioFinal: precioBase,
      cuotas: form.tipoPago === 'financiado' ? Number(form.cuotas) : null,
    }, autoSeleccionado, vendedorSeleccionado?.comision ?? 0)
  }

  const mostrarResumen = ganancia !== null || (form.tipoPago === 'financiado' && precioBase > 0)

  return (
    <form onSubmit={e => e.preventDefault()}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Auto (buscador) ── */}
        <div className="form-group">
          <label className="form-label">Auto *</label>
          <div ref={autoRef} style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)', pointerEvents: 'none',
              }} />
              <input
                className={`form-input${errors.autoId ? ' input-error' : ''}`}
                style={{ paddingLeft: 36, paddingRight: form.autoId ? 36 : 12 }}
                value={autoSearch}
                placeholder="Buscar por marca, modelo..."
                onChange={e => {
                  setAutoSearch(e.target.value)
                  setAutoOpen(true)
                  if (form.autoId) setForm(prev => ({ ...prev, autoId: '', precioFinal: '' }))
                }}
                onFocus={() => setAutoOpen(true)}
              />
              {form.autoId && (
                <button type="button" onClick={handleAutoClear} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-tertiary)', padding: 2, lineHeight: 0,
                }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Dropdown resultados */}
            {autoOpen && (autosFiltrados.length > 0 || autoSearch.trim()) && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 60,
                background: 'var(--bg-modal)', border: '1px solid var(--border-color)',
                borderRadius: 10, maxHeight: 210, overflowY: 'auto',
                boxShadow: 'var(--shadow-lg)',
              }}>
                {autosFiltrados.length === 0 ? (
                  <div style={{ padding: '10px 14px', color: 'var(--text-tertiary)', fontSize: 13 }}>
                    Sin resultados para "{autoSearch}"
                  </div>
                ) : (
                  autosFiltrados.map((a, i) => (
                    <button key={a.id} type="button" onClick={() => handleAutoSelect(a)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '9px 14px', background: 'none', border: 'none',
                      borderBottom: i < autosFiltrados.length - 1 ? '1px solid var(--divider)' : 'none',
                      cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)', fontSize: 14,
                      transition: 'background 0.1s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <div>
                        <span style={{ fontWeight: 600 }}>{a.marca} {a.modelo}</span>
                        <span style={{ color: 'var(--text-tertiary)', marginLeft: 6, fontSize: 13 }}>
                          {a.año}{a.version ? ` · ${a.version}` : ''}
                        </span>
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: 8 }}>
                        {formatCurrency(a.precio)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {errors.autoId && <span className="form-error">{errors.autoId}</span>}
          {autosDisponibles.length === 0 && (
            <span style={{ fontSize: 12, color: 'var(--warning)' }}>No hay autos disponibles.</span>
          )}
        </div>

        {/* ── Cliente + nuevo ── */}
        <div className="form-grid">
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <label className="form-label" style={{ margin: 0 }}>Cliente *</label>
              <button type="button" className="btn btn-ghost btn-sm"
                onClick={() => setShowNC(v => !v)}
                style={{ fontSize: 11, padding: '2px 8px', gap: 4 }}>
                {showNC ? <><X size={11} /> Cancelar</> : <><UserPlus size={11} /> Nuevo</>}
              </button>
            </div>

            {!showNC ? (
              <select className={`form-input form-select${errors.clienteId ? ' input-error' : ''}`}
                value={form.clienteId} onChange={e => set('clienteId', e.target.value)}>
                <option value="">Seleccionar cliente...</option>
                {clientesOrdenados.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.apellido}, {c.nombre} — {c.dni}
                  </option>
                ))}
              </select>
            ) : (
              <div style={{
                background: 'var(--bg-tertiary)', borderRadius: 10, padding: 12,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input className="form-input" placeholder="Nombre *"
                    style={{ fontSize: 13, textTransform: 'uppercase' }}
                    value={nc.nombre} onChange={e => setNC(prev => ({ ...prev, nombre: e.target.value }))} />
                  <input className="form-input" placeholder="Apellido *"
                    style={{ fontSize: 13, textTransform: 'uppercase' }}
                    value={nc.apellido} onChange={e => setNC(prev => ({ ...prev, apellido: e.target.value }))} />
                  <input className="form-input" placeholder="DNI *"
                    style={{ fontSize: 13 }}
                    value={nc.dni} onChange={e => setNC(prev => ({ ...prev, dni: e.target.value }))} />
                  <input className="form-input" type="tel" placeholder="Teléfono *"
                    style={{ fontSize: 13 }}
                    value={nc.telefono} onChange={e => setNC(prev => ({ ...prev, telefono: e.target.value }))} />
                </div>
                <input className="form-input" type="email" placeholder="Email (opcional)"
                  style={{ fontSize: 13 }}
                  value={nc.email} onChange={e => setNC(prev => ({ ...prev, email: e.target.value }))} />
                <button type="button" className="btn btn-primary btn-sm"
                  onClick={handleGuardarCliente}
                  disabled={savingNC || !nc.nombre || !nc.apellido || !nc.dni || !nc.telefono}
                  style={{ alignSelf: 'flex-end' }}>
                  {savingNC ? 'Guardando...' : 'Guardar cliente'}
                </button>
              </div>
            )}
            {errors.clienteId && <span className="form-error">{errors.clienteId}</span>}
          </div>

          {/* ── Vendedor ── */}
          <div className="form-group">
            <label className="form-label">Vendedor *</label>
            <select className={`form-input form-select${errors.vendedorId ? ' input-error' : ''}`}
              value={form.vendedorId}
              onChange={e => set('vendedorId', e.target.value)}
              disabled={currentUser?.rol === 'empleado'}>
              <option value="">Seleccionar vendedor...</option>
              {empleados.map(u => (
                <option key={u.id} value={u.id}>{u.nombre} ({u.comision}%)</option>
              ))}
            </select>
            {errors.vendedorId && <span className="form-error">{errors.vendedorId}</span>}
          </div>
        </div>

        {/* ── Tipo de pago + cuotas ── */}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Tipo de pago *</label>
            <select className="form-input form-select" value={form.tipoPago} onChange={e => set('tipoPago', e.target.value)}>
              <option value="contado">Contado</option>
              <option value="financiado">Financiado</option>
            </select>
          </div>

          {form.tipoPago === 'financiado' && (
            <div className="form-group">
              <label className="form-label">Cantidad de cuotas</label>
              <select className="form-input form-select" value={form.cuotas} onChange={e => set('cuotas', e.target.value)}>
                {[6, 12, 18, 24, 36, 48, 60].map(n => (
                  <option key={n} value={n}>{n} cuotas</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ── Interés (solo financiado) ── */}
        {form.tipoPago === 'financiado' && (
          <div className="form-group">
            <label className="form-label">Interés total (%)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="range" min="0" max="200" step="5"
                value={form.interes}
                onChange={e => set('interes', e.target.value)}
                style={{ flex: 1, accentColor: 'var(--accent)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="number" className="form-input" min="0" max="999" step="1"
                  value={form.interes}
                  onChange={e => set('interes', e.target.value)}
                  style={{ width: 70, textAlign: 'right' }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>%</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Precio final + Fecha ── */}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Precio final *</label>
            <input type="number" className={`form-input${errors.precioFinal ? ' input-error' : ''}`}
              value={form.precioFinal}
              onChange={e => set('precioFinal', e.target.value)}
              placeholder="0" min="0" />
            {precioBase > 0 && (
              <span style={{ fontSize: 13, color: 'var(--accent)', marginTop: 3, display: 'block', fontWeight: 600 }}>
                {formatCurrency(precioBase)}
              </span>
            )}
            {errors.precioFinal && <span className="form-error">{errors.precioFinal}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Fecha *</label>
            <input type="date" className="form-input" value={form.fecha}
              onChange={e => set('fecha', e.target.value)} />
            {errors.fecha && <span className="form-error">{errors.fecha}</span>}
          </div>
        </div>

        {/* ── Resumen calculado ── */}
        {mostrarResumen && (
          <div style={{
            background: ganancia == null || ganancia >= 0 ? 'var(--success-light)' : 'var(--danger-light)',
            border: `1px solid ${ganancia == null || ganancia >= 0 ? 'rgba(52,199,89,0.2)' : 'rgba(255,59,48,0.2)'}`,
            borderRadius: 10, padding: '12px 16px',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12,
          }}>
            {ganancia !== null && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>Ganancia</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: ganancia >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {formatCurrency(ganancia)}
                </div>
              </div>
            )}
            {comision !== null && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                  Comisión ({vendedorSeleccionado?.comision}%)
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--warning)' }}>
                  {formatCurrency(comision)}
                </div>
              </div>
            )}
            {form.tipoPago === 'financiado' && precioBase > 0 && (
              <>
                {interesPct > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>Total financiado</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{formatCurrency(totalConInteres)}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                    Cuota ({form.cuotas} meses)
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--info)' }}>
                    {formatCurrency(valorCuota)}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="modal-footer" style={{ paddingInline: 0, paddingBottom: 0, marginTop: 16 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit}>Registrar venta</button>
      </div>
    </form>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function VentasPage() {
  const { ventas, addVenta, deleteVenta, getAutoById, getClienteById } = useApp()
  const { isAdmin, usuarios } = useAuth()

  const [search, setSearch]    = useState('')
  const [modalOpen, setModal]  = useState(false)
  const [deletingVenta, setDel]= useState(null)

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
                            onClick={() => generateFacturaPDF(v, auto, cliente, getVendedorObj(v.vendedorId))}
                            title="Descargar factura">
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
          onSubmit={(data, auto, comPct) => {
            addVenta(data, auto, comPct)
            setModal(false)
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
    </>
  )
}
