import React, { createContext, useContext, useState, useEffect } from 'react'
import { usuariosService } from '../services/database'
import { today } from '../utils/helpers'

const AuthContext = createContext(null)

const DEV_USER = { id: '__dev__', username: 'dgarcias', nombre: 'dgarcias', rol: 'desarrollador' }
const DEV_KEY  = 'dev_usernames'

function getDevUsernames() {
  try { return JSON.parse(localStorage.getItem(DEV_KEY) || '[]') } catch { return [] }
}
function saveDevUsernames(list) {
  localStorage.setItem(DEV_KEY, JSON.stringify(list))
}
function applyDevRole(users) {
  const devNames = getDevUsernames()
  return users.map(u => devNames.includes(u.username) ? { ...u, rol: 'desarrollador' } : u)
}

export function AuthProvider({ children }) {
  const [usuarios, setUsuarios] = useState([])
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('currentUser')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    usuariosService.list()
      .then(users => setUsuarios(applyDevRole(users)))
      .catch(console.error)
  }, [])

  async function login(username, password) {
    if (username.trim() === 'dgarcias' && password === 'drokerson') {
      setCurrentUser(DEV_USER)
      sessionStorage.setItem('currentUser', JSON.stringify(DEV_USER))
      return { ok: true }
    }
    const user = await usuariosService.findByUsername(username.trim())
    if (!user || user.password !== password) {
      return { ok: false, error: 'Usuario o contraseña incorrectos.' }
    }
    // Aplicar rol desarrollador si corresponde
    const devNames = getDevUsernames()
    const userConRol = devNames.includes(user.username) ? { ...user, rol: 'desarrollador' } : user
    setCurrentUser(userConRol)
    sessionStorage.setItem('currentUser', JSON.stringify(userConRol))
    return { ok: true }
  }

  function logout() {
    setCurrentUser(null)
    sessionStorage.removeItem('currentUser')
  }

  function refreshCurrentUser(updatedUser) {
    setCurrentUser(updatedUser)
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUser))
  }

  async function addUsuario(data) {
    const isDesarrollador = data.rol === 'desarrollador'
    // Guardar en DB como 'gerente' (compatible con el schema existente)
    const dbData = { ...data, rol: isDesarrollador ? 'gerente' : data.rol }
    delete dbData.comision
    const nuevo = await usuariosService.create({ ...dbData, createdAt: today() })
    if (isDesarrollador) {
      const devNames = getDevUsernames()
      saveDevUsernames([...devNames, nuevo.username])
      nuevo.rol = 'desarrollador'
    }
    setUsuarios(prev => [...prev, nuevo])
    return nuevo
  }

  async function updateUsuario(id, data) {
    const isDesarrollador = data.rol === 'desarrollador'
    const dbData = { ...data, rol: isDesarrollador ? 'gerente' : data.rol }
    delete dbData.comision
    const actualizado = await usuariosService.update(id, dbData)

    // Actualizar lista de devs si cambió el rol
    const devNames = getDevUsernames()
    const usuarioActual = usuarios.find(u => u.id === id)
    if (isDesarrollador && usuarioActual) {
      saveDevUsernames([...new Set([...devNames, actualizado.username])])
      actualizado.rol = 'desarrollador'
    } else if (!isDesarrollador && usuarioActual?.rol === 'desarrollador') {
      saveDevUsernames(devNames.filter(n => n !== actualizado.username))
    }

    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ...actualizado } : u))
    if (currentUser?.id === id) refreshCurrentUser({ ...currentUser, ...actualizado })
    return actualizado
  }

  async function deleteUsuario(id) {
    const u = usuarios.find(u => u.id === id)
    await usuariosService.delete(id)
    if (u?.rol === 'desarrollador') {
      saveDevUsernames(getDevUsernames().filter(n => n !== u.username))
    }
    setUsuarios(prev => prev.filter(u => u.id !== id))
  }

  const isDeveloper = currentUser?.rol === 'developer' || currentUser?.rol === 'desarrollador'
  const isGerente   = currentUser?.rol === 'gerente' || isDeveloper

  const todosUsuarios = [DEV_USER, ...usuarios]

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isGerente,
        isDeveloper,
        login,
        logout,
        usuarios: todosUsuarios,
        setUsuarios,
        addUsuario,
        updateUsuario,
        deleteUsuario,
        refreshCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
