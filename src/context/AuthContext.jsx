import React, { createContext, useContext, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { INITIAL_USERS } from '../data/initialData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Usuarios persistidos (gerentes y empleados)
  const [usuarios, setUsuarios] = useLocalStorage('usuarios', INITIAL_USERS)

  // Sesión activa (no se persiste entre recargas para mayor seguridad)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('currentUser')
    return saved ? JSON.parse(saved) : null
  })

  /**
   * Login simulado: verifica usuario y contraseña contra localStorage.
   * Retorna { ok: true } o { ok: false, error: '...' }
   */
  function login(username, password) {
    const user = usuarios.find(
      u => u.username === username.trim() && u.password === password
    )
    if (!user) {
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

  /**
   * Refresca el currentUser desde los usuarios actuales
   * (útil si se edita el empleado logueado).
   */
  function refreshCurrentUser(updatedUser) {
    setCurrentUser(updatedUser)
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUser))
  }

  const isGerente = currentUser?.rol === 'gerente'

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isGerente,
        login,
        logout,
        usuarios,
        setUsuarios,
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
