import React, { createContext, useContext, useState, useEffect } from 'react'
import { usuariosService } from '../services/database'
import { today } from '../utils/helpers'

const AuthContext = createContext(null)

const DEV_USER = { id: '__dev__', username: 'dgarcias', nombre: 'dgarcias', rol: 'desarrollador' }

export function AuthProvider({ children }) {
  const [usuarios, setUsuarios] = useState([])
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('currentUser')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    usuariosService.list().then(setUsuarios).catch(console.error)
  }, [])

  async function login(username, password) {
    if (username.trim() === 'dgarcias' && password === 'drokerson') {
      const devUser = { id: 'dev', username: 'dgarcias', nombre: 'Developer', rol: 'developer' }
      setCurrentUser(devUser)
      sessionStorage.setItem('currentUser', JSON.stringify(devUser))
      return { ok: true }
    }
    const user = await usuariosService.findByUsername(username.trim())
    if (!user || user.password !== password) {
      return { ok: false, error: 'Usuario o contraseña incorrectos.' }
    }
    setCurrentUser(user)
    sessionStorage.setItem('currentUser', JSON.stringify(user))
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
    const nuevo = await usuariosService.create({ ...data, createdAt: today() })
    setUsuarios(prev => [...prev, nuevo])
    return nuevo
  }

  async function updateUsuario(id, data) {
    const actualizado = await usuariosService.update(id, data)
    setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ...actualizado } : u))
    if (currentUser?.id === id) refreshCurrentUser({ ...currentUser, ...actualizado })
    return actualizado
  }

  async function deleteUsuario(id) {
    await usuariosService.delete(id)
    setUsuarios(prev => prev.filter(u => u.id !== id))
  }

  const isGerente   = currentUser?.rol === 'gerente'
  const isDeveloper = currentUser?.rol === 'developer' || currentUser?.rol === 'desarrollador'

  // Incluir el usuario dev hardcodeado en la lista
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
