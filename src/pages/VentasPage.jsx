import React, { useState, useMemo } from 'react'
import { Plus, Trash2, ShoppingBag, DollarSign, FileText } from 'lucide-react'
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
  const { autos, clientes } = useApp()
  const { usuarios, currentUser } = useAuth()

  const autosDisponibles = autos.filter(a => a.estado === 'disponible')
  const empleados = usuarios.filter(u => u.rol === 'empleado')

  const [form, setForm] = useState({
    autoId:    '',
    clienteId: '',
    vendedorId: currentUser?.rol === 'empleado' ? currentUser.id : '',
    tipoPago:  'contado',
    cuotas:    12,
    precioFinal: '',
    fecha: today(),
  })
  const [errors, setErrors] = useState({})

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  // Autocompletar precio de venta al seleccionar auto
  function handleAutoChange(autoId) {
    const auto = autos.find(a => a.id === autoId)
    set('autoId', autoId)
    if (auto) set('precioFinal', auto.precioVenta)
  }

  const autoSeleccionado = autos.find(a => a.id === form.autoId)
  const vendedorSeleccionado = usuarios.find(u => u.id === form.vendedorId)
  const ganancia = autoSeleccionado && form.precioFinal
    ? Number(form.precioFinal) - autoSeleccionado.precioCompra
    : null
  const comision = ganancia && vendedorSeleccionado
    ? (ganancia * vendedorSeleccionado.comision) / 100
    : null

  function validate() {
    const e = {}
    if (!form.autoId)          e.autoId     = 'Seleccioná un auto'
    if (!form.clienteId)       e.clienteId  = 'Seleccioná un cliente'
    if (!form.vendedorId)      e.vendedorId = 'Seleccioná un vendedor'
    if (!form.precioFinal)     e.precioFinal = 'Ingresá el precio final'
    if (!form.fecha)           e.fecha      = 'Ingresá la fecha'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      ...form,
      precioFinal: Number(form.precioFinal),
      cuotas: form.tipoPago === 'financiado' ? Number(form.cuotas) : null,
    }, autoSeleccionado, vendedorSeleccionado?.comision ?? 0)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Auto */}
        <div className="form-group">
          <label className="form-label">Auto *</label>
          <select
            className="form-input form-select"
            value={form.autoId}
            onChange={e => handleAutoChange(e.target.value)}
          >
            <option value="">Seleccionar auto...</option>
            {autosDisponibles.map(a => (
              <option key={a.id} value={a.id}>
                {a.marca} {a.modelo} {a.año} — {formatCurrency(a.precioVenta)}
              </option>
            ))}
          </select>
          {errors.autoId && <span className="form-error">{errors.autoId}</span>}
          {autosDisponibles.length === 0 && (
            <span style={{ fontSize: 12, color: 'var(--warning)' }}>
              No hay autos disponibles. Agregá un auto primero.
            </span>
          )}
        </div>

        <div className="form-grid">
          {/* Cliente */}
          <div className="form-group">
            <label className="form-label">Cliente *</label>
            <select className="form-input form-select" value={form.clienteId} onChange={e => set('clienteId', e.target.value)}>
              <option value="">Seleccionar cliente...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} — {c.dni}</option>
              ))}
            </select>
            {errors.clienteId && <span className="form-error">{errors.clienteId}</span>}
          </div>

          {/* Vendedor */}
          <div className="form-group">
            <label className="form-label">Vendedor *</label>
            <select
              className="form-input form-select"
              value={form.vendedorId}
              onChange={e => set('vendedorId', e.target.value)}
              disabled={currentUser?.rol === 'empleado'}
            >
              <option value="">Seleccionar vendedor...</option>
              {empleados.map(u => (
                <option key={u.id} value={u.id}>{u.nombre} ({u.comision}%)</option>
              ))}
            </select>
            {errors.vendedorId && <span className="form-error">{errors.vendedorId}</span>}
          </div>
        </div>

        <div className="form-grid">
          {/* Tipo de pago */}
          <div className="form-group">
            <label className="form-label">Tipo de pago *</label>
            <select className="form-input form-select" value={form.tipoPago} onChange={e => set('tipoPago', e.target.value)}>
              <option value="contado">Contado</option>
              <option value="financiado">Financiado (cuotas)</option>
            </select>
          </div>

          {/* Cuotas */}
          {form.tipoPago === 'financiado' && (
            <div className="form-group">
              <label className="form-label">Cantidad de cuotas</label>
              <select className="form-input form-select" value={form.cuotas} onChange={e => set('cuotas', e.target.value)}>
                {[6,12,18,24,36,48,60].map(n => (
                  <option key={n} value={n}>{n} cuotas</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="form-grid">
          {/* Precio final */}
          <div className="form-group">
            <label className="form-label">Precio final *</label>
            <input
              type="number" className="form-input" value={form.precioFinal}
              onChange={e => set('precioFinal', e.target.value)}
              placeholder="22500000" min="0"
            />
            {errors.precioFinal && <span className="form-error">{errors.precioFinal}</span>}
          </div>

          {/* Fecha */}
          <div className="form-group">
            <label className="form-label">Fecha *</label>
            <input
              type="date" className="form-input" value={form.fecha}
              onChange={e => set('fecha', e.target.value)}
            />
            {errors.fecha && <span className="form-error">{errors.fecha}</span>}
          </div>
        </div>

        {/* Resumen calculado */}
        {ganancia !== null && (
          <div style={{
            background: ganancia >= 0 ? 'var(--success-light)' : 'var(--danger-light)',
            border: `1px solid ${ganancia >= 0 ? 'rgba(52,199,89,0.2)' : 'rgba(255,59,48,0.2)'}`,
            borderRadius: 10, padding: '12px 16px',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>Ganancia</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: ganancia >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {formatCurrency(ganancia)}
              </div>
            </div>
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
            {form.tipoPago === 'financiado' && form.precioFinal && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                  Valor por cuota
                </div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>
                  {formatCurrency(Number(form.precioFinal) / Number(form.cuotas))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="modal-footer" style={{ paddingInline: 0, paddingBottom: 0, marginTop: 16 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary">Registrar venta</button>
      </div>
    </form>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function VentasPage() {
  const { ventas, addVenta, deleteVenta, getAutoById, getClienteById } = useApp()
  const { isGerente, usuarios } = useAuth()

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
      const auto = getAutoById(v.autoId)
      const cliente = getClienteById(v.clienteId)
      return (
        (auto && `${auto.marca} ${auto.modelo}`.toLowerCase().includes(q))
        || (cliente && cliente.nombre.toLowerCase().includes(q))
        || getVendedorNombre(v.vendedorId).toLowerCase().includes(q)
      )
    })
  }, [ventas, search])

  // Ordenar por fecha más reciente
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
                  {isGerente && <th className="hide-mobile">Ganancia</th>}
                  {isGerente && <th className="hide-mobile">Comisión</th>}
                  <th className="hide-mobile">Fecha</th>
                  {isGerente && <th style={{ width: 60 }}>Acc.</th>}
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
                      <td className="hide-mobile">{cliente?.nombre ?? '—'}</td>
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
                      {isGerente && (
                        <td className="hide-mobile" style={{ color: v.ganancia >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                          {formatCurrency(v.ganancia)}
                        </td>
                      )}
                      {isGerente && (
                        <td className="hide-mobile" style={{ color: 'var(--warning)', fontSize: 13 }}>
                          {formatCurrency(v.comisionVendedor)}
                        </td>
                      )}
                      <td className="hide-mobile" style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{formatDate(v.fecha)}</td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => generateFacturaPDF(v, auto, cliente, getVendedorObj(v.vendedorId))}
                            title="Descargar factura"
                          >
                            <FileText size={15} />
                          </button>
                          {isGerente && (
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={() => setDel(v)}
                              style={{ color: 'var(--danger)' }}
                              title="Anular venta"
                            >
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
