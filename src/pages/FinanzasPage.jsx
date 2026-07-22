import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, ChevronDown, CircleDollarSign, Clock, Pencil, Plus, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatCurrency, today } from '../utils/helpers'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const amountFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

const usdFormatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// Para conversiones ARS→USD: sin redondeo artificial
const usdExactFormatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
})

// Para conversiones: muestra centavos solo cuando los hay
const arsConversionFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const EMPTY_FORM = {
  tipo: 'personal',
  concepto: '',
  observaciones: '',
  monto: '',
  moneda: 'ARS',
  estado: 'PENDIENTE',
}

const DEUDA_TIPOS = {
  personal: 'Personal',
  negocio: 'Negocio',
}

function parseCurrencyInput(value) {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : ''
}


function formatCurrencyInput(value) {
  if (value === '' || value == null) return ''
  return amountFormatter.format(Number(value) || 0)
}

function parseUsdValue(value) {
  const n = parseFloat(String(value).replace(',', '.'))
  return isNaN(n) ? 0 : n
}

async function fetchDolarBlue() {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/blue')
    const data = await res.json()
    return data.venta ?? null
  } catch {
    return null
  }
}

function TipoBadge({ tipo }) {
  return (
    <span className={`badge ${tipo === 'negocio' ? 'badge-accent' : 'badge-info'}`}>
      {DEUDA_TIPOS[tipo] || tipo}
    </span>
  )
}

const ESTADO_CONFIG = {
  PENDIENTE:    { cls: 'badge-warning', icon: CircleDollarSign, action: 'PAGAR DEUDA' },
  PAGO_PARCIAL: { cls: 'badge-info',    icon: Clock,            action: 'CONTINUAR PAGO' },
  PAGADA:       { cls: 'badge-success', icon: CheckCircle2,     action: 'VOLVER A PENDIENTE' },
}

function EstadoBadge({ estado, onToggle }) {
  const cfg = ESTADO_CONFIG[estado] ?? ESTADO_CONFIG.PENDIENTE
  const Icon = cfg.icon

  return (
    <button
      type="button"
      className={`badge deuda-status-badge ${cfg.cls}`}
      onClick={onToggle}
      title={cfg.action}
      aria-label={cfg.action}
    >
      <Icon size={13} />
      <span className="deuda-status-label">{estado === 'PAGO_PARCIAL' ? 'PARCIAL' : estado}</span>
      <span className="deuda-status-action" aria-hidden="true">{cfg.action}</span>
    </button>
  )
}

function DeudaForm({ initial = EMPTY_FORM, conceptos, deudas, onSubmit, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial })
  const [errors, setErrors] = useState({})
  const [conceptoOpen, setConceptoOpen] = useState(false)
  const [dolarBlue, setDolarBlue] = useState(initial.cotizacion_blue ?? null)
  const [loadingBlue, setLoadingBlue] = useState(false)
  const conceptoRef = useRef(null)

  const conceptosPorTipo = useMemo(() => {
    const conceptosConDeudas = new Set(
      deudas
        .filter(deuda => deuda.tipo === form.tipo)
        .map(deuda => deuda.concepto)
    )

    return conceptos.filter(c =>
      c.tipo === form.tipo && conceptosConDeudas.has(c.nombre)
    )
  }, [conceptos, deudas, form.tipo])
  const conceptosFiltrados = useMemo(() => {
    const q = form.concepto.trim().toLowerCase()
    if (!q) return conceptosPorTipo
    return conceptosPorTipo.filter(c => c.nombre.toLowerCase().includes(q))
  }, [conceptosPorTipo, form.concepto])

  useEffect(() => {
    setLoadingBlue(true)
    fetchDolarBlue().then(rate => {
      setDolarBlue(rate)
      setLoadingBlue(false)
    })
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (conceptoRef.current && !conceptoRef.current.contains(event.target)) {
        setConceptoOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function parsedMonto() {
    return form.moneda === 'USD' ? parseUsdValue(form.monto) : Number(form.monto)
  }

  function validate() {
    const e = {}
    if (!form.concepto.trim()) e.concepto = 'Ingresá un concepto'
    if (!parsedMonto() || parsedMonto() <= 0) e.monto = 'Ingresá un monto válido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return

    onSubmit({
      tipo: form.tipo,
      concepto: form.concepto.trim(),
      observaciones: form.observaciones.trim(),
      monto: parsedMonto(),
      moneda: form.moneda,
      cotizacion_blue: dolarBlue,
      estado: form.estado,
    })
  }

  const conversionPreview = useMemo(() => {
    const monto = form.moneda === 'USD' ? parseUsdValue(form.monto) : Number(form.monto)
    if (!monto || !dolarBlue) return null
    if (form.moneda === 'USD') {
      return `≈ ${arsConversionFormatter.format(monto * dolarBlue)}`
    }
    return `≈ U$D ${usdExactFormatter.format(monto / dolarBlue)}`
  }, [form.monto, form.moneda, dolarBlue])

  return (
    <form onSubmit={e => e.preventDefault()}>
      <div className="form-grid" style={{ gap: 14 }}>
        <div className="form-group">
          <label className="form-label">Tipo *</label>
          <select className="form-input form-select" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            <option value="personal">Personal</option>
            <option value="negocio">Negocio</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Estado *</label>
          <select className="form-input form-select" value={form.estado} onChange={e => set('estado', e.target.value)}>
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="PAGADA">PAGADA</option>
          </select>
        </div>

        <div className="form-group form-full">
          <label className="form-label">Concepto *</label>
          <div ref={conceptoRef} className="deuda-concept-picker">
            <input
              className="form-input"
              value={form.concepto}
              onChange={e => {
                set('concepto', e.target.value)
                setConceptoOpen(true)
              }}
              onFocus={() => setConceptoOpen(true)}
              placeholder={form.tipo === 'personal' ? 'Ej. Préstamo familiar' : 'Ej. Repuesto pendiente'}
              aria-autocomplete="list"
              aria-expanded={conceptoOpen}
            />
            <button
              type="button"
              className="deuda-concept-trigger"
              onClick={() => setConceptoOpen(prev => !prev)}
              aria-label="Mostrar conceptos guardados"
            >
              <ChevronDown size={16} />
            </button>

            {conceptoOpen && conceptosPorTipo.length > 0 && (
              <div className="deuda-concept-dropdown" role="listbox">
                {conceptosFiltrados.length === 0 ? (
                  <div className="deuda-concept-empty">Sin conceptos guardados que coincidan.</div>
                ) : (
                  conceptosFiltrados.map((concepto, index) => (
                    <button
                      key={concepto.id}
                      type="button"
                      className={`deuda-concept-option${index === conceptosFiltrados.length - 1 ? ' is-last' : ''}`}
                      onClick={() => {
                        set('concepto', concepto.nombre)
                        setConceptoOpen(false)
                      }}
                    >
                      {concepto.nombre}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {errors.concepto && <span className="form-error">{errors.concepto}</span>}
        </div>

        <div className="form-group form-full">
          <label className="form-label">Monto *</label>
          <div className="deuda-monto-row">
            <div className="deuda-moneda-toggle">
              <button
                type="button"
                className={`deuda-moneda-btn${form.moneda === 'ARS' ? ' is-active' : ''}`}
                onClick={() => { set('moneda', 'ARS'); set('monto', '') }}
              >
                $ ARS
              </button>
              <button
                type="button"
                className={`deuda-moneda-btn${form.moneda === 'USD' ? ' is-active' : ''}`}
                onClick={() => { set('moneda', 'USD'); set('monto', '') }}
              >
                U$D USD
              </button>
            </div>
            <input
              type="text"
              inputMode="numeric"
              className="form-input"
              value={form.moneda === 'ARS' ? formatCurrencyInput(form.monto) : form.monto}
              onChange={e => {
                set('monto', form.moneda === 'ARS' ? parseCurrencyInput(e.target.value) : e.target.value)
              }}
              inputMode={form.moneda === 'ARS' ? 'numeric' : 'decimal'}
              placeholder={form.moneda === 'ARS' ? '$ 150.000' : '1200,50'}
            />
          </div>
          {errors.monto && <span className="form-error">{errors.monto}</span>}
          {conversionPreview && (
            <span className="deuda-conversion-preview">
              {conversionPreview}
              {dolarBlue && (
                <span className="deuda-conversion-rate">
                  {' '}· blue {amountFormatter.format(dolarBlue)}
                </span>
              )}
            </span>
          )}
          {loadingBlue && !dolarBlue && (
            <span className="deuda-conversion-preview">Obteniendo cotización blue…</span>
          )}
        </div>

        <div className="form-group form-full">
          <label className="form-label">Observaciones</label>
          <textarea
            className="form-input"
            value={form.observaciones || ''}
            onChange={e => set('observaciones', e.target.value)}
            placeholder="Detalle libre de la deuda"
          />
        </div>
      </div>

      <div className="modal-footer" style={{ paddingInline: 0, paddingBottom: 0, marginTop: 16 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit}>
          Guardar deuda
        </button>
      </div>
    </form>
  )
}

function PagoModal({ deuda, pagos, onPagar, onClose }) {
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(today())
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const totalPagado = pagos.reduce((sum, p) => sum + Number(p.monto), 0)
  const restante = Number(deuda.monto) - totalPagado
  const esUSD = deuda.moneda === 'USD'

  const montoNum = Number(esUSD ? parseFloat(monto.replace(',', '.')) : parseCurrencyInput(monto)) || 0
  const progresoActual = Math.min(100, (totalPagado / Number(deuda.monto)) * 100)
  const progresoProyectado = Math.min(100, ((totalPagado + montoNum) / Number(deuda.monto)) * 100)
  const completo = progresoProyectado >= 99.999

async function handleSubmit() {
    const n = esUSD ? parseFloat(monto.replace(',', '.')) : Number(parseCurrencyInput(monto))
    if (!n || n <= 0) { setError('Ingresá un monto válido'); return }
    if (n > restante + 0.001) { setError(`El máximo es ${formatMontoPago(restante, deuda)}`); return }
    setSubmitting(true)
    await onPagar(n, fecha)
    setSubmitting(false)
  }

  function formatMontoPago(valor, d) {
    return d.moneda === 'USD'
      ? `U$D ${usdFormatter.format(valor)}`
      : arsConversionFormatter.format(valor)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="pago-deuda-info">
        <div className="pago-deuda-concepto">{deuda.concepto}</div>
        <div className="pago-deuda-montos">
          <span>Total: <strong>{formatMontoPago(Number(deuda.monto), deuda)}</strong></span>
          <span>Pagado: <strong>{formatMontoPago(totalPagado, deuda)}</strong></span>
          <span className="pago-restante">Restante: <strong>{formatMontoPago(restante, deuda)}</strong></span>
        </div>
        <div className="pago-progreso-bar">
          <div
            className={`pago-progreso-fill pago-progreso-proyectado${completo ? ' is-completo' : ''}`}
            style={{ width: `${progresoProyectado}%` }}
          />
          <div
            className={`pago-progreso-fill${progresoActual >= 99.999 ? ' is-completo' : ''}`}
            style={{ width: `${progresoActual}%` }}
          />
        </div>
        <span className="pago-progreso-label">
          {montoNum > 0
            ? `${progresoActual.toFixed(0)}% pagado → ${progresoProyectado.toFixed(0)}% con este pago`
            : `${progresoActual.toFixed(0)}% pagado`}
        </span>
      </div>

      <div className="form-grid" style={{ gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Monto a pagar *</label>
          <input
            type="text"
            inputMode="numeric"
            className="form-input"
            value={esUSD ? monto : formatCurrencyInput(monto)}
            onChange={e => {
              setMonto(esUSD ? e.target.value : e.target.value.replace(/\D/g, ''))
              setError('')
            }}
            placeholder={esUSD ? `U$D ${usdFormatter.format(restante)}` : arsConversionFormatter.format(restante)}
            autoFocus
          />
          {error && <span className="form-error">{error}</span>}
          {montoNum > 0 && montoNum < restante - 0.001 && (
            <span className="deuda-conversion-preview">
              Quedará un saldo de {formatMontoPago(restante - montoNum, deuda)}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Fecha de pago</label>
          <input
            type="date"
            className="form-input"
            value={fecha}
            max={today()}
            onChange={e => setFecha(e.target.value)}
          />
        </div>
      </div>

      {pagos.length > 0 && (
        <div className="pago-historial">
          <div className="pago-historial-titulo">Pagos anteriores</div>
          {pagos.map(p => (
            <div key={p.id} className="pago-historial-row">
              <span>{formatMontoPago(Number(p.monto), deuda)}</span>
              <span className="pago-historial-fecha">
                {new Date((p.fecha || p.createdAt) + 'T12:00:00').toLocaleDateString('es-AR')}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="modal-footer" style={{ paddingInline: 0, paddingBottom: 0, marginTop: 0 }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Registrando…' : 'Registrar pago'}
        </button>
      </div>
    </div>
  )
}

export default function FinanzasPage() {
  const { deudas, deudaConceptos, deudaPagos, addDeuda, updateDeuda, deleteDeuda, addDeudaPago, updateDeudaPago, deleteDeudaPago, revertirDeuda } = useApp()
  const [dolarBlue, setDolarBlue] = useState(null)
  const [tipoFiltro, setTipoFiltro] = useState('todas')
  const [conceptoFiltro, setConceptoFiltro] = useState('todos')
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const [modalOpen, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [pagoDeuda, setPagoDeuda] = useState(null)
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [editingPago, setEditingPago] = useState(null) // { id, deudaId, monto, fecha }

  useEffect(() => {
    fetchDolarBlue().then(setDolarBlue)
    const interval = setInterval(() => fetchDolarBlue().then(setDolarBlue), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  function toggleExpand(id) {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const conceptosDisponibles = useMemo(() => {
    const nombres = new Set()
    deudas.forEach(deuda => {
      if (tipoFiltro === 'todas' || deuda.tipo === tipoFiltro) {
        nombres.add(deuda.concepto)
      }
    })
    return [...nombres].sort((a, b) => a.localeCompare(b))
  }, [deudas, tipoFiltro])

  const deudasFiltradas = useMemo(() => (
    deudas.filter(deuda =>
      (tipoFiltro === 'todas' || deuda.tipo === tipoFiltro)
      && (conceptoFiltro === 'todos' || deuda.concepto === conceptoFiltro)
      && (estadoFiltro === 'todos' || deuda.estado === estadoFiltro)
    )
  ), [conceptoFiltro, deudas, estadoFiltro, tipoFiltro])
  const totalesFiltrados = useMemo(
    () => deudasFiltradas.reduce((acc, deuda) => {
      const pagosDeuda = deudaPagos.filter(p => p.deuda_id === deuda.id)
      const totalPagado = pagosDeuda.reduce((s, p) => s + Number(p.monto), 0)
      const restante = Math.max(0, Number(deuda.monto) - totalPagado)
      if (deuda.moneda === 'USD') {
        acc.usd += restante
        if (deuda.cotizacion_blue) acc.ars += restante * deuda.cotizacion_blue
      } else {
        acc.ars += restante
        if (deuda.cotizacion_blue) acc.usd += restante / deuda.cotizacion_blue
      }
      return acc
    }, { ars: 0, usd: 0 }),
    [deudasFiltradas, deudaPagos]
  )

  function openAdd() {
    setEditing(null)
    setModal(true)
  }

  function openEdit(deuda) {
    setEditing(deuda)
    setModal(true)
  }

  function closeModal() {
    setModal(false)
    setEditing(null)
  }

  async function handleSubmit(data) {
    if (editing) await updateDeuda(editing.id, data)
    else await addDeuda(data)
    closeModal()
  }

  function handleEstadoBadge(deuda) {
    if (deuda.estado === 'PAGADA') {
      revertirDeuda(deuda.id)
    } else {
      setPagoDeuda(deuda)
    }
  }

  async function handlePago(monto, fecha) {
    await addDeudaPago(pagoDeuda.id, monto, fecha)
    setPagoDeuda(null)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Deudas</h1>
          <p className="page-subtitle">Seguimiento de deudas personales y del negocio</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="deuda-total-summary" aria-live="polite">
            <span>Total</span>
            <strong>{arsConversionFormatter.format(totalesFiltrados.ars)}</strong>
            <span className="deuda-total-usd">U$D {usdFormatter.format(totalesFiltrados.usd)}</span>
          </div>
          <select
            className="form-input form-select deuda-type-filter"
            value={tipoFiltro}
            onChange={e => {
              setTipoFiltro(e.target.value)
              setConceptoFiltro('todos')
            }}
            aria-label="Filtrar deudas por tipo"
          >
            <option value="todas">Todas</option>
            <option value="personal">Personales</option>
            <option value="negocio">Del negocio</option>
          </select>
          <select
            className="form-input form-select deuda-concept-filter"
            value={conceptoFiltro}
            onChange={e => setConceptoFiltro(e.target.value)}
            aria-label="Filtrar deudas por concepto"
          >
            <option value="todos">Todos los conceptos</option>
            {conceptosDisponibles.map(concepto => (
              <option key={concepto} value={concepto}>{concepto}</option>
            ))}
          </select>
          <select
            className="form-input form-select deuda-status-filter"
            value={estadoFiltro}
            onChange={e => setEstadoFiltro(e.target.value)}
            aria-label="Filtrar deudas por estado"
          >
            <option value="todos">Todos los estados</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="PAGO_PARCIAL">Pago parcial</option>
            <option value="PAGADA">Pagadas</option>
          </select>
          <button className="btn btn-primary btn--icon-spin" onClick={openAdd}>
            <Plus size={16} /> Agregar deuda
          </button>
          {dolarBlue && (
            <div style={{
              height: 40, padding: '0 14px',
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--success-light)',
              border: '1px solid rgba(52, 199, 89, 0.25)',
              borderRadius: 'var(--radius-md)',
              whiteSpace: 'nowrap',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Dólar Blue
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--success)', paddingLeft: 4, borderLeft: '1px solid rgba(52,199,89,0.3)' }}>
                {amountFormatter.format(dolarBlue)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {deudasFiltradas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><CircleDollarSign size={24} /></div>
              <strong>Sin deudas registradas</strong>
              <p>Agregá la primera deuda para seguir su pago desde esta tabla.</p>
              <button className="btn btn-primary btn-sm btn--icon-spin" onClick={openAdd}>
                <Plus size={14} /> Agregar deuda
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: 32 }} />
                  <th>Tipo</th>
                  <th>Concepto</th>
                  <th className="hide-mobile">Observaciones</th>
                  <th>Monto</th>
                  <th className="hide-mobile" style={{ minWidth: 130 }}>Progreso</th>
                  <th>Estado</th>
                  <th style={{ width: 100 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {deudasFiltradas.map(deuda => {
                  const pagosDeuda = deudaPagos.filter(p => p.deuda_id === deuda.id)
                  const expanded = expandedRows.has(deuda.id)
                  const totalPagado = pagosDeuda.reduce((s, p) => s + Number(p.monto), 0)
                  const restante = Math.max(0, Number(deuda.monto) - totalPagado)

                  return (
                    <>
                      <tr key={deuda.id}>
                        <td>
                          {pagosDeuda.length > 0 && (
                            <button
                              className={`deuda-expand-btn${expanded ? ' is-open' : ''}`}
                              onClick={() => toggleExpand(deuda.id)}
                              title={expanded ? 'Ocultar pagos' : 'Ver pagos'}
                              aria-expanded={expanded}
                            >
                              <ChevronDown size={18} />
                            </button>
                          )}
                        </td>
                        <td><TipoBadge tipo={deuda.tipo} /></td>
                        <td style={{ fontWeight: 600 }}>{deuda.concepto}</td>
                        <td className="deuda-observaciones hide-mobile">{deuda.observaciones || '—'}</td>
                        <td className="deuda-col-nativa">
                          {deuda.moneda === 'USD'
                            ? `U$D ${usdFormatter.format(restante)}`
                            : arsConversionFormatter.format(restante)}
                        </td>
                        <td className="hide-mobile">
                          {(() => {
                            const pct = Number(deuda.monto) > 0
                              ? Math.min(100, Math.round((totalPagado / Number(deuda.monto)) * 100))
                              : 0
                            const isComplete = pct >= 100
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ height: 6, borderRadius: 99, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${pct}%`,
                                    borderRadius: 99,
                                    background: isComplete ? 'var(--success)' : 'var(--accent)',
                                    transition: 'width 0.4s var(--ease-smooth)',
                                  }} />
                                </div>
                                <span style={{ fontSize: 11, color: isComplete ? 'var(--success)' : 'var(--text-tertiary)', fontWeight: 600 }}>
                                  {pct}%
                                </span>
                              </div>
                            )
                          })()}
                        </td>
                        <td>
                          <EstadoBadge estado={deuda.estado} onToggle={() => handleEstadoBadge(deuda)} />
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-ghost btn-icon btn-sm btn--icon-wiggle" onClick={() => openEdit(deuda)} title="Editar deuda">
                              <Pencil size={15} />
                            </button>
                            <button
                              className="btn btn-ghost btn-icon btn-sm btn--icon-shake"
                              onClick={() => setDeleting(deuda)}
                              style={{ color: 'var(--danger)' }}
                              title="Eliminar deuda"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expanded && (
                        <tr key={`${deuda.id}-pagos`} className="deuda-pagos-row">
                          <td />
                          <td colSpan={7}>
                            <div className="deuda-pagos-list">
                              {pagosDeuda.map(p => {
                                const isEditing = editingPago?.id === p.id
                                return isEditing ? (
                                  <div key={p.id} className="deuda-pago-item" style={{ gap: 8, flexWrap: 'wrap' }}>
                                    <input
                                      type="text" inputMode="numeric"
                                      className="form-input"
                                      style={{ width: 140, padding: '4px 10px', fontSize: 13 }}
                                      value={deuda.moneda === 'ARS' ? formatCurrencyInput(editingPago.monto) : editingPago.monto}
                                      onChange={e => setEditingPago(prev => ({
                                        ...prev,
                                        monto: deuda.moneda === 'ARS' ? e.target.value.replace(/\D/g, '') : e.target.value,
                                      }))}
                                    />
                                    <input
                                      type="date"
                                      className="form-input"
                                      style={{ width: 150, padding: '4px 10px', fontSize: 13 }}
                                      value={editingPago.fecha}
                                      onChange={e => setEditingPago(prev => ({ ...prev, fecha: e.target.value }))}
                                    />
                                    <div className="flex gap-2" style={{ marginLeft: 'auto' }}>
                                      <button className="btn btn-primary btn-sm" onClick={async () => {
                                        const monto = deuda.moneda === 'ARS' ? Number(editingPago.monto) : parseFloat(editingPago.monto.replace(',', '.'))
                                        if (!monto || monto <= 0) return
                                        await updateDeudaPago(p.id, deuda.id, monto, editingPago.fecha)
                                        setEditingPago(null)
                                      }}>Guardar</button>
                                      <button className="btn btn-secondary btn-sm" onClick={() => setEditingPago(null)}>Cancelar</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div key={p.id} className="deuda-pago-item">
                                    <span className="deuda-pago-fecha">
                                      {new Date((p.fecha || p.createdAt) + 'T12:00:00').toLocaleDateString('es-AR')}
                                    </span>
                                    <span className="deuda-pago-monto">
                                      {deuda.moneda === 'USD'
                                        ? `U$D ${usdFormatter.format(p.monto)}`
                                        : arsConversionFormatter.format(p.monto)}
                                    </span>
                                    <div className="flex gap-2" style={{ marginLeft: 'auto' }}>
                                      <button className="btn btn-ghost btn-icon btn-sm btn--icon-wiggle" title="Editar pago"
                                        onClick={() => setEditingPago({ id: p.id, deudaId: deuda.id, monto: String(p.monto), fecha: p.fecha || p.createdAt?.slice(0,10) })}>
                                        <Pencil size={13} />
                                      </button>
                                      <button className="btn btn-ghost btn-icon btn-sm btn--icon-shake" title="Eliminar pago"
                                        style={{ color: 'var(--danger)' }}
                                        onClick={() => deleteDeudaPago(p.id, deuda.id)}>
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>
                                )
                              })}
                              <div className="deuda-pago-total">
                                <span>Total pagado</span>
                                <span>
                                  {deuda.moneda === 'USD'
                                    ? `U$D ${usdFormatter.format(totalPagado)}`
                                    : arsConversionFormatter.format(totalPagado)}
                                  {' · '}
                                  {Math.min(100, Math.round((totalPagado / Number(deuda.monto)) * 100))}%
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar deuda' : 'Agregar deuda'}>
        <DeudaForm
          initial={editing ?? EMPTY_FORM}
          conceptos={deudaConceptos}
          deudas={deudas}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleteDeuda(deleting.id)}
        title="Eliminar deuda"
        message="¿Eliminar esta deuda? Los datos se perderán permanentemente."
      />

      <Modal
        open={!!pagoDeuda}
        onClose={() => setPagoDeuda(null)}
        title="Registrar pago"
      >
        {pagoDeuda && (
          <PagoModal
            deuda={pagoDeuda}
            pagos={deudaPagos.filter(p => p.deuda_id === pagoDeuda.id)}
            onPagar={handlePago}
            onClose={() => setPagoDeuda(null)}
          />
        )}
      </Modal>
    </>
  )
}
