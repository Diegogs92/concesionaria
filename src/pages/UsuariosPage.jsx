import React, { useState, useMemo, useRef } from 'react'
import { Plus, Pencil, Trash2, Shield, Eye, EyeOff, Camera, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usuariosService } from '../services/database'
import { RolBadge } from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SearchBar from '../components/ui/SearchBar'
import { getInitials } from '../utils/helpers'

const EMPTY_FORM = { nombre: '', username: '', password: '', rol: 'administrador', foto_url: '' }

function UsuarioForm({ initial = EMPTY_FORM, isEditing = false, onSubmit, onCancel }) {
  const [form, setForm]         = useState({ ...EMPTY_FORM, ...initial })
  const [errors, setErrors]     = useState({})
  const [showPass, setShowPass] = useState(false)
  const [fotoFile, setFotoFile] = useState(null)
  const [preview, setPreview]   = useState(initial.foto_url || '')
  const fileRef                 = useRef(null)
  const { usuarios }            = useAuth()

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function handleFotoChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setPreview(URL.createObjectURL(file))
  }

  function validate() {
    const e = {}
    if (!form.nombre.trim())   e.nombre   = 'Requerido'
    if (!form.username.trim()) e.username  = 'Requerido'
    if (!isEditing && !form.password.trim()) e.password = 'Requerido'
    const exists = usuarios.find(u => u.username === form.username.trim() && u.id !== initial.id)
    if (exists) e.username = 'Ese nombre de usuario ya existe'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    const data = { ...form }
    if (isEditing && !form.password.trim()) delete data.password
    onSubmit(data, fotoFile)
  }

  return (
    <form onSubmit={e => e.preventDefault()}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
          <div className="usuario-foto-picker" onClick={() => fileRef.current?.click()}>
            {preview
              ? <img src={preview} alt="avatar" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
              : form.nombre.trim()
                ? <div className="avatar" style={{ width: 80, height: 80, fontSize: 22 }}>{getInitials(form.nombre)}</div>
                : <div className="avatar" style={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserRound size={32} style={{ opacity: 0.6 }} /></div>
            }
            <div style={{
              position: 'absolute', bottom: 0, right: 0,
              background: 'var(--accent)', borderRadius: '50%',
              width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Camera size={13} color="white" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFotoChange} />
        </div>

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

        <div className="form-group">
          <label className="form-label">Rol</label>
          <select className="form-input form-select" value={form.rol} onChange={e => set('rol', e.target.value)}>
            <option value="administrador">Administrador</option>
            <option value="desarrollador">Desarrollador</option>
            <option value="vendedor">Vendedor</option>
          </select>
        </div>
      </div>

      <div className="modal-footer" style={{ paddingInline: 0, paddingBottom: 0, marginTop: 16 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit}>
          {isEditing ? 'Guardar cambios' : 'Crear usuario'}
        </button>
      </div>
    </form>
  )
}

export default function UsuariosPage() {
  const { usuarios, addUsuario, updateUsuario, deleteUsuario } = useAuth()

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

  async function handleSubmit(data, fotoFile) {
    if (editing) {
      let foto_url = editing.foto_url ?? ''
      if (fotoFile) foto_url = await usuariosService.uploadFoto(editing.id, fotoFile)
      await updateUsuario(editing.id, { ...data, foto_url })
    } else {
      const nuevo = await addUsuario({ ...data, foto_url: '' })
      if (fotoFile) {
        const foto_url = await usuariosService.uploadFoto(nuevo.id, fotoFile)
        await updateUsuario(nuevo.id, { foto_url })
      }
    }
    closeModal()
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={20} color="var(--accent)" />
            <h1 className="page-title">Gestión de usuarios</h1>
          </div>
          <p className="page-subtitle">{usuarios.length} usuarios registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar usuario..." />
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Nuevo usuario
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Shield size={24} /></div>
              <strong>Sin usuarios</strong>
              <p>Creá el primer usuario.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Username</th>
                  <th>Rol</th>
                  <th style={{ width: 80 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {u.foto_url
                          ? <img src={u.foto_url} alt={u.nombre} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          : <div className="avatar" style={{ fontSize: 13 }}>{getInitials(u.nombre)}</div>
                        }
                        <div style={{ fontWeight: 600 }}>{u.nombre}</div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-tertiary)', fontFamily: 'monospace', fontSize: 13 }}>
                      @{u.username}
                    </td>
                    <td><RolBadge rol={u.rol} /></td>
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

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar usuario' : 'Nuevo usuario'}>
        <UsuarioForm
          initial={editing ?? EMPTY_FORM}
          isEditing={!!editing}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </Modal>

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDel(null)}
        onConfirm={() => { deleteUsuario(deletingId); setDel(null) }}
        title="Eliminar usuario"
        message="¿Eliminar este usuario? No podrá iniciar sesión."
      />
    </>
  )
}
