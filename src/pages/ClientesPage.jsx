import React, { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { formatDate, getInitials } from '../utils/helpers'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SearchBar from '../components/ui/SearchBar'

const EMPTY_FORM = { nombre: '', telefono: '', email: '', dni: '' }

function ClienteForm({ initial = EMPTY_FORM, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.nombre.trim())    e.nombre    = 'Requerido'
    if (!form.telefono.trim())  e.telefono  = 'Requerido'
    if (!form.dni.trim())       e.dni       = 'Requerido'
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email inválido'
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
          <label className="form-label">Nombre completo *</label>
          <input className="form-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ana García" />
          {errors.nombre && <span className="form-error">{errors.nombre}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">DNI *</label>
          <input className="form-input" value={form.dni} onChange={e => set('dni', e.target.value)} placeholder="28.456.789" />
          {errors.dni && <span className="form-error">{errors.dni}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Teléfono *</label>
          <input type="tel" className="form-input" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+54 11 4567-8901" />
          {errors.telefono && <span className="form-error">{errors.telefono}</span>}
        </div>

        <div className="form-group form-full">
          <label className="form-label">Email</label>
          <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="ana@email.com" />
          {errors.email && <span className="form-error">{errors.email}</span>}
        </div>
      </div>

      <div className="modal-footer" style={{ paddingInline: 0, paddingBottom: 0, marginTop: 16 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary">Guardar cliente</button>
      </div>
    </form>
  )
}

export default function ClientesPage() {
  const { clientes, addCliente, updateCliente, deleteCliente, ventas } = useApp()
  const { isGerente } = useAuth()

  const [search, setSearch]     = useState('')
  const [modalOpen, setModal]   = useState(false)
  const [editing, setEditing]   = useState(null)
  const [deletingId, setDel]    = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return clientes.filter(c =>
      !q
      || c.nombre.toLowerCase().includes(q)
      || c.dni.toLowerCase().includes(q)
      || c.email.toLowerCase().includes(q)
      || c.telefono.includes(q)
    )
  }, [clientes, search])

  function openAdd()    { setEditing(null); setModal(true) }
  function openEdit(c)  { setEditing(c); setModal(true) }
  function closeModal() { setModal(false); setEditing(null) }

  function handleSubmit(data) {
    if (editing) updateCliente(editing.id, data)
    else         addCliente(data)
    closeModal()
  }

  function countVentas(clienteId) {
    return ventas.filter(v => v.clienteId === clienteId).length
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clientes.length} registrados</p>
        </div>

        <div className="flex items-center gap-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre, DNI..." />
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Nuevo cliente
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Users size={24} /></div>
              <strong>Sin clientes</strong>
              <p>Agregá tu primer cliente para empezar.</p>
              <button className="btn btn-primary btn-sm" onClick={openAdd}>
                <Plus size={14} /> Nuevo cliente
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th className="hide-mobile">DNI</th>
                  <th>Teléfono</th>
                  <th className="hide-mobile">Email</th>
                  <th>Compras</th>
                  <th className="hide-mobile">Desde</th>
                  <th style={{ width: 80 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar" style={{ fontSize: 13 }}>
                          {getInitials(c.nombre)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{c.nombre}</span>
                      </div>
                    </td>
                    <td className="hide-mobile">{c.dni}</td>
                    <td>{c.telefono}</td>
                    <td className="hide-mobile" style={{ color: 'var(--text-secondary)' }}>{c.email || '—'}</td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 24, height: 24, borderRadius: '50%',
                        background: countVentas(c.id) > 0 ? 'var(--accent-light)' : 'var(--bg-input)',
                        color: countVentas(c.id) > 0 ? 'var(--accent)' : 'var(--text-tertiary)',
                        fontSize: 12, fontWeight: 700,
                      }}>
                        {countVentas(c.id)}
                      </span>
                    </td>
                    <td className="hide-mobile" style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{formatDate(c.createdAt)}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(c)} title="Editar">
                          <Pencil size={15} />
                        </button>
                        {isGerente && (
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => setDel(c.id)}
                            style={{ color: 'var(--danger)' }}
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar cliente' : 'Nuevo cliente'}>
        <ClienteForm initial={editing ?? EMPTY_FORM} onSubmit={handleSubmit} onCancel={closeModal} />
      </Modal>

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDel(null)}
        onConfirm={() => deleteCliente(deletingId)}
        title="Eliminar cliente"
        message="¿Eliminar este cliente? Los datos se perderán permanentemente."
      />
    </>
  )
}
