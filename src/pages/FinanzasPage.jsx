import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, ChevronDown, CircleDollarSign, Pencil, Plus, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/helpers'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'

const amountFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

const EMPTY_FORM = {
  tipo: 'personal',
  concepto: '',
  observaciones: '',
  monto: '',
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

function TipoBadge({ tipo }) {
  return (
    <span className={`badge ${tipo === 'negocio' ? 'badge-accent' : 'badge-info'}`}>
      {DEUDA_TIPOS[tipo] || tipo}
    </span>
  )
}

function EstadoBadge({ estado, onToggle }) {
  const pagada = estado === 'PAGADA'
  const action = pagada ? 'VOLVER A PENDIENTE' : 'PAGAR DEUDA'

  return (
    <button
      type="button"
      className={`badge deuda-status-badge ${pagada ? 'badge-success' : 'badge-warning'}`}
      onClick={onToggle}
      title={action}
      aria-label={pagada ? 'Marcar deuda como pendiente' : 'Marcar deuda como pagada'}
    >
      {pagada ? <CheckCircle2 size={13} /> : <CircleDollarSign size={13} />}
      <span className="deuda-status-label">{estado}</span>
      <span className="deuda-status-action" aria-hidden="true">{action}</span>
    </button>
  )
}

function DeudaForm({ initial = EMPTY_FORM, conceptos, onSubmit, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial })
  const [errors, setErrors] = useState({})
  const [conceptoOpen, setConceptoOpen] = useState(false)
  const conceptoRef = useRef(null)

  const conceptosPorTipo = useMemo(
    () => conceptos.filter(c => c.tipo === form.tipo),
    [conceptos, form.tipo]
  )
  const conceptosFiltrados = useMemo(() => {
    const q = form.concepto.trim().toLowerCase()
    if (!q) return conceptosPorTipo
    return conceptosPorTipo.filter(c => c.nombre.toLowerCase().includes(q))
  }, [conceptosPorTipo, form.concepto])

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

  function validate() {
    const e = {}
    if (!form.concepto.trim()) e.concepto = 'Ingresá un concepto'
    if (!form.monto || Number(form.monto) <= 0) e.monto = 'Ingresá un monto válido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return

    onSubmit({
      tipo: form.tipo,
      concepto: form.concepto.trim(),
      observaciones: form.observaciones.trim(),
      monto: Number(form.monto),
      estado: form.estado,
    })
  }

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

        <div className="form-group">
          <label className="form-label">Monto (ARS) *</label>
          <input
            type="text"
            inputMode="numeric"
            className="form-input"
            value={formatCurrencyInput(form.monto)}
            onChange={e => set('monto', parseCurrencyInput(e.target.value))}
            placeholder="$ 150.000"
          />
          {errors.monto && <span className="form-error">{errors.monto}</span>}
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

export default function FinanzasPage() {
  const { deudas, deudaConceptos, addDeuda, updateDeuda, deleteDeuda } = useApp()
  const [tipoFiltro, setTipoFiltro] = useState('todas')
  const [conceptoFiltro, setConceptoFiltro] = useState('todos')
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const [modalOpen, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

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
  const totalDeudasFiltradas = useMemo(
    () => deudasFiltradas.reduce((total, deuda) => total + (Number(deuda.monto) || 0), 0),
    [deudasFiltradas]
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

  function toggleEstado(deuda) {
    updateDeuda(deuda.id, {
      estado: deuda.estado === 'PAGADA' ? 'PENDIENTE' : 'PAGADA',
    })
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
            <strong>{formatCurrency(totalDeudasFiltradas)}</strong>
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
            <option value="PAGADA">Pagadas</option>
          </select>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Agregar deuda
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {deudasFiltradas.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><CircleDollarSign size={24} /></div>
              <strong>Sin deudas registradas</strong>
              <p>Agregá la primera deuda para seguir su pago desde esta tabla.</p>
              <button className="btn btn-primary btn-sm" onClick={openAdd}>
                <Plus size={14} /> Agregar deuda
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Concepto</th>
                  <th>Observaciones</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th style={{ width: 100 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {deudasFiltradas.map(deuda => (
                  <tr key={deuda.id}>
                    <td><TipoBadge tipo={deuda.tipo} /></td>
                    <td style={{ fontWeight: 600 }}>{deuda.concepto}</td>
                    <td className="deuda-observaciones">{deuda.observaciones || '—'}</td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(deuda.monto)}</td>
                    <td>
                      <EstadoBadge estado={deuda.estado} onToggle={() => toggleEstado(deuda)} />
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(deuda)} title="Editar deuda">
                          <Pencil size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => setDeleting(deuda)}
                          style={{ color: 'var(--danger)' }}
                          title="Eliminar deuda"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar deuda' : 'Agregar deuda'}>
        <DeudaForm
          initial={editing ?? EMPTY_FORM}
          conceptos={deudaConceptos}
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
    </>
  )
}
