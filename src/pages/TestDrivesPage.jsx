import React, { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, CalendarCheck, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { generateId, formatDate, today } from '../utils/helpers'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SearchBar from '../components/ui/SearchBar'

const EMPTY_FORM = { autoId: '', clienteId: '', vendedorId: '', fecha: today(), hora: '10:00', estado: 'pendiente', notas: '' }

function TestDriveForm({ initial = EMPTY_FORM, autos, clientes, usuarios, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.autoId.trim()) e.autoId = 'Requerido'
    if (!form.clienteId.trim()) e.clienteId = 'Requerido'
    if (!form.fecha) e.fecha = 'Requerido'
    if (!form.hora) e.hora = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid" style={{ gap: 14 }}>
        <div className="form-group form-full">
          <label className="form-label">Vehículo *</label>
          <select className="form-input form-select" value={form.autoId} onChange={e => set('autoId', e.target.value)}>
            <option value="">Seleccionar auto...</option>
            {autos.filter(a => a.estado === 'disponible').map(a => (
              <option key={a.id} value={a.id}>{a.marca} {a.modelo} ({a.año})</option>
            ))}
          </select>
          {errors.autoId && <span className="form-error">{errors.autoId}</span>}
        </div>

        <div className="form-group form-full">
          <label className="form-label">Cliente *</label>
          <select className="form-input form-select" value={form.clienteId} onChange={e => set('clienteId', e.target.value)}>
            <option value="">Seleccionar cliente...</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          {errors.clienteId && <span className="form-error">{errors.clienteId}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Fecha *</label>
          <input type="date" className="form-input" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
          {errors.fecha && <span className="form-error">{errors.fecha}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Hora *</label>
          <input type="time" className="form-input" value={form.hora} onChange={e => set('hora', e.target.value)} />
          {errors.hora && <span className="form-error">{errors.hora}</span>}
        </div>

        <div className="form-group form-full">
          <label className="form-label">Estado</label>
          <select className="form-input form-select" value={form.estado} onChange={e => set('estado', e.target.value)}>
            <option value="pendiente">Pendiente</option>
            <option value="realizado">Realizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div className="form-group form-full">
          <label className="form-label">Notas</label>
          <textarea className="form-input" value={form.notas} onChange={e => set('notas', e.target.value)} rows={3} placeholder="Observaciones del test drive..." />
        </div>
      </div>

      <div className="modal-footer" style={{ paddingInline: 0, paddingBottom: 0, marginTop: 16 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary">Guardar test drive</button>
      </div>
    </form>
  )
}

function TestDriveStateBadge({ estado }) {
  const colors = {
    pendiente: { bg: 'var(--warning-light)', color: 'var(--warning)' },
    realizado: { bg: 'var(--success-light)', color: 'var(--success)' },
    cancelado: { bg: 'var(--bg-input)', color: 'var(--text-tertiary)' },
  }
  const c = colors[estado] || colors.pendiente
  const labels = { pendiente: 'Pendiente', realizado: 'Realizado', cancelado: 'Cancelado' }

  return (
    <span className="badge" style={{ background: c.bg, color: c.color }}>
      {labels[estado]}
    </span>
  )
}

export default function TestDrivesPage() {
  const { testDrives, addTestDrive, updateTestDrive, deleteTestDrive, autos, clientes } = useApp()
  const { usuarios } = useAuth()

  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [modalOpen, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deletingId, setDel] = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return testDrives.filter(td => {
      const auto = autos.find(a => a.id === td.autoId)
      const cliente = clientes.find(c => c.id === td.clienteId)
      const matchSearch = !q ||
        (auto?.marca || '').toLowerCase().includes(q) ||
        (auto?.modelo || '').toLowerCase().includes(q) ||
        (cliente?.nombre || '').toLowerCase().includes(q)
      const matchEstado = filtroEstado === 'todos' || td.estado === filtroEstado
      return matchSearch && matchEstado
    }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  }, [testDrives, search, filtroEstado, autos, clientes])

  function openAdd() { setEditing(null); setModal(true) }
  function openEdit(td) { setEditing(td); setModal(true) }
  function closeModal() { setModal(false); setEditing(null) }

  function handleSubmit(data) {
    if (editing) updateTestDrive(editing.id, data)
    else addTestDrive(data)
    closeModal()
  }

  function handleDelete() {
    if (deletingId) {
      deleteTestDrive(deletingId)
      setDel(null)
    }
  }

  const deletingItem = testDrives.find(td => td.id === deletingId)
  const auto = deletingItem ? autos.find(a => a.id === deletingItem.autoId) : null
  const cliente = deletingItem ? clientes.find(c => c.id === deletingItem.clienteId) : null

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Test Drive</h1>
          <p className="page-subtitle">{testDrives.length} agendados</p>
        </div>

        <div className="flex items-center gap-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar auto, cliente..." />

          <select
            className="form-input form-select"
            style={{ width: 'auto' }}
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="realizado">Realizados</option>
            <option value="cancelado">Cancelados</option>
          </select>

          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Agendar
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><CalendarCheck size={24} /></div>
              <strong>Sin test drives</strong>
              <p>Agendá el primer test drive para empezar.</p>
              <button className="btn btn-primary btn-sm" onClick={openAdd}>
                <Plus size={14} /> Agendar ahora
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th>Cliente</th>
                  <th className="hide-mobile">Vendedor</th>
                  <th>Fecha / Hora</th>
                  <th className="hide-mobile">Notas</th>
                  <th>Estado</th>
                  <th style={{ width: 100 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(td => {
                  const autoData = autos.find(a => a.id === td.autoId)
                  const clienteData = clientes.find(c => c.id === td.clienteId)
                  const vendedorData = usuarios.find(u => u.id === td.vendedorId)

                  return (
                    <tr key={td.id}>
                      <td>
                        <span style={{ fontWeight: 600 }}>{autoData?.marca || '?'} {autoData?.modelo || '?'}</span>
                      </td>
                      <td>{clienteData?.nombre || '?'}</td>
                      <td className="hide-mobile" style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                        {vendedorData?.nombre || '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                          <Clock size={14} />
                          {formatDate(td.fecha)} {td.hora}
                        </div>
                      </td>
                      <td className="hide-mobile" style={{ fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {td.notas || '—'}
                      </td>
                      <td>
                        <TestDriveStateBadge estado={td.estado} />
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(td)} title="Editar">
                            <Pencil size={15} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => setDel(td.id)}
                            style={{ color: 'var(--danger)' }}
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
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

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar test drive' : 'Agendar test drive'} size="lg">
        <TestDriveForm
          initial={editing ?? EMPTY_FORM}
          autos={autos}
          clientes={clientes}
          usuarios={usuarios}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </Modal>

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDel(null)}
        onConfirm={handleDelete}
        message={`¿Eliminar el test drive de ${cliente?.nombre || '?'} para el ${auto?.marca || '?'} ${auto?.modelo || '?'}?`}
      />
    </>
  )
}
