import React, { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/helpers'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SearchBar from '../components/ui/SearchBar'

const EMPTY_FORM = { nombre: '', apellido: '', telefono: '', dni: '' }

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

function whatsappLink(telefono) {
  const clean = telefono.replace(/[\s\-().+]/g, '')
  const num = clean.startsWith('54') ? clean : `54${clean}`
  return `https://wa.me/${num}`
}

function ClienteForm({ initial = EMPTY_FORM, onSubmit, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial })
  const [errors, setErrors] = useState({})

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.nombre.trim())    e.nombre    = 'Requerido'
    if (!form.apellido.trim())  e.apellido  = 'Requerido'
    if (!form.telefono.trim())  e.telefono  = 'Requerido'
    if (!form.dni.trim())       e.dni       = 'Requerido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    onSubmit({
      ...form,
      nombre:   form.nombre.trim().toUpperCase(),
      apellido: form.apellido.trim().toUpperCase(),
      dni:      form.dni.trim().toUpperCase(),
    })
  }

  return (
    <form onSubmit={e => e.preventDefault()}>
      <div className="form-grid" style={{ gap: 14 }}>

        <div className="form-group">
          <label className="form-label">Nombre *</label>
          <input className="form-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ana" style={{ textTransform: 'uppercase' }} />
          {errors.nombre && <span className="form-error">{errors.nombre}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Apellido *</label>
          <input className="form-input" value={form.apellido} onChange={e => set('apellido', e.target.value)} placeholder="García" style={{ textTransform: 'uppercase' }} />
          {errors.apellido && <span className="form-error">{errors.apellido}</span>}
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

      </div>

      <div className="modal-footer" style={{ paddingInline: 0, paddingBottom: 0, marginTop: 16 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit}>Guardar cliente</button>
      </div>
    </form>
  )
}

export default function ClientesPage() {
  const { clientes, addCliente, updateCliente, deleteCliente, ventas } = useApp()
  const { isAdmin } = useAuth()

  const [search, setSearch]     = useState('')
  const [modalOpen, setModal]   = useState(false)
  const [editing, setEditing]   = useState(null)
  const [deletingId, setDel]    = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return clientes.filter(c =>
      !q
      || (c.nombre || '').toLowerCase().includes(q)
      || (c.apellido || '').toLowerCase().includes(q)
      || c.dni.toLowerCase().includes(q)
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
                  <th>Compras</th>
                  <th className="hide-mobile">Desde</th>
                  <th style={{ width: 100 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{c.apellido} {c.nombre}</span>
                    </td>
                    <td className="hide-mobile">{c.dni}</td>
                    <td>{c.telefono}</td>
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
                        <a
                          href={whatsappLink(c.telefono)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-icon btn-sm"
                          style={{ color: '#25d366' }}
                          title="Enviar WhatsApp"
                        >
                          <WaIcon />
                        </a>
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(c)} title="Editar">
                          <Pencil size={15} />
                        </button>
                        {isAdmin && (
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
