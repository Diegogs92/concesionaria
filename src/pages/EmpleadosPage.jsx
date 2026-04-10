import React, { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, UserCheck, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { formatCurrency, getInitials, sumBy } from '../utils/helpers'
import { RolBadge } from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SearchBar from '../components/ui/SearchBar'
import { generateId } from '../utils/helpers'

const EMPTY_FORM = {
  nombre: '', username: '', password: '', rol: 'empleado', comision: 3,
}

function EmpleadoForm({ initial = EMPTY_FORM, isEditing = false, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)
  const { usuarios } = useAuth()

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.nombre.trim())     e.nombre   = 'Requerido'
    if (!form.username.trim())   e.username  = 'Requerido'
    if (!isEditing && !form.password.trim()) e.password = 'Requerido'
    // Verificar username único
    const exists = usuarios.find(u => u.username === form.username.trim() && u.id !== initial.id)
    if (exists) e.username = 'Ese nombre de usuario ya existe'
    if (form.rol === 'empleado' && (form.comision < 0 || form.comision > 100)) {
      e.comision = 'Entre 0 y 100'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    const data = { ...form, comision: Number(form.comision) }
    if (isEditing && !form.password.trim()) delete data.password
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div className="form-group">
          <label className="form-label">Nombre completo *</label>
          <input className="form-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Juan Pérez" />
          {errors.nombre && <span className="form-error">{errors.nombre}</span>}
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Usuario *</label>
            <input
              className="form-input" value={form.username}
              onChange={e => set('username', e.target.value.toLowerCase().replace(/\s/g, ''))}
              placeholder="juanperez"
              autoComplete="off"
            />
            {errors.username && <span className="form-error">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">{isEditing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder={isEditing ? '(sin cambios)' : '••••••'}
                style={{ paddingRight: 44 }}
                autoComplete="new-password"
              />
              <button type="button" className="btn btn-ghost btn-icon"
                onClick={() => setShowPass(s => !s)}
                style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32 }}
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Rol *</label>
            <select className="form-input form-select" value={form.rol} onChange={e => set('rol', e.target.value)}>
              <option value="empleado">Empleado</option>
              <option value="gerente">Gerente</option>
            </select>
          </div>

          {form.rol === 'empleado' && (
            <div className="form-group">
              <label className="form-label">Comisión sobre ganancia (%)</label>
              <input
                type="number" className="form-input"
                value={form.comision}
                onChange={e => set('comision', e.target.value)}
                min="0" max="100" step="0.5"
              />
              {errors.comision && <span className="form-error">{errors.comision}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="modal-footer" style={{ paddingInline: 0, paddingBottom: 0, marginTop: 16 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary">
          {isEditing ? 'Guardar cambios' : 'Crear empleado'}
        </button>
      </div>
    </form>
  )
}

export default function EmpleadosPage() {
  const { usuarios, setUsuarios, currentUser } = useAuth()
  const { ventas } = useApp()

  const [search, setSearch]   = useState('')
  const [modalOpen, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deletingId, setDel]  = useState(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return usuarios.filter(u =>
      !q || u.nombre.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
    )
  }, [usuarios, search])

  function openAdd()    { setEditing(null); setModal(true) }
  function openEdit(u)  { setEditing(u); setModal(true) }
  function closeModal() { setModal(false); setEditing(null) }

  function handleSubmit(data) {
    if (editing) {
      setUsuarios(prev => prev.map(u =>
        u.id === editing.id ? { ...u, ...data } : u
      ))
    } else {
      setUsuarios(prev => [...prev, { ...data, id: generateId('u'), createdAt: new Date().toISOString().split('T')[0] }])
    }
    closeModal()
  }

  function handleDelete(id) {
    setUsuarios(prev => prev.filter(u => u.id !== id))
  }

  function getStatsEmpleado(userId) {
    const ventasEmp = ventas.filter(v => v.vendedorId === userId)
    return {
      ventas: ventasEmp.length,
      comision: sumBy(ventasEmp, 'comisionVendedor'),
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Empleados</h1>
          <p className="page-subtitle">{usuarios.length} usuarios registrados</p>
        </div>

        <div className="flex items-center gap-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar empleado..." />
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Nuevo empleado
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><UserCheck size={24} /></div>
              <strong>Sin empleados</strong>
              <p>Agregá el primer empleado.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Comisión</th>
                  <th>Ventas</th>
                  <th>Ganado</th>
                  <th style={{ width: 80 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const stats = getStatsEmpleado(u.id)
                  const isMe = u.id === currentUser?.id
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar" style={{ fontSize: 13, background: isMe ? 'var(--accent)' : undefined }}>
                            {getInitials(u.nombre)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.nombre}</div>
                            {isMe && <div style={{ fontSize: 11, color: 'var(--accent)' }}>Tú</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-tertiary)', fontFamily: 'monospace', fontSize: 13 }}>
                        @{u.username}
                      </td>
                      <td><RolBadge rol={u.rol} /></td>
                      <td>
                        {u.rol === 'empleado'
                          ? <span style={{ fontWeight: 600 }}>{u.comision}%</span>
                          : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                        }
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{stats.ventas}</span>
                      </td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                        {u.rol === 'empleado' ? formatCurrency(stats.comision) : '—'}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(u)} title="Editar">
                            <Pencil size={15} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => setDel(u.id)}
                            style={{ color: 'var(--danger)' }}
                            title="Eliminar"
                            disabled={isMe}
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

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar empleado' : 'Nuevo empleado'}>
        <EmpleadoForm
          initial={editing ?? EMPTY_FORM}
          isEditing={!!editing}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </Modal>

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDel(null)}
        onConfirm={() => handleDelete(deletingId)}
        title="Eliminar empleado"
        message="¿Eliminar este empleado? No podrá iniciar sesión. Las ventas no se eliminarán."
      />
    </>
  )
}
