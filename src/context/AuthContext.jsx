import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { usernameToEmail } from '../lib/authEmail'
import { usuariosService } from '../services/database'
import { today } from '../utils/helpers'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuarios, setUsuarios] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Carga el perfil (tabla usuarios) a partir del id de Supabase Auth.
  async function loadProfile(authUserId) {
    const profile = await usuariosService.findByAuthId(authUserId)
    setCurrentUser(profile)
    return profile
  }

  // Restaura la sesión al montar y escucha cambios de auth (login/logout/refresh).
  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return
      if (session?.user) {
        try { await loadProfile(session.user.id) } catch (e) { console.error(e) }
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      if (session?.user) {
        loadProfile(session.user.id).catch(console.error)
      } else {
        setCurrentUser(null)
      }
    })

    return () => { active = false; subscription.unsubscribe() }
  }, [])

  // La lista de usuarios (para UsuariosPage) solo tiene sentido con sesión activa.
  useEffect(() => {
    if (!currentUser) { setUsuarios([]); return }
    usuariosService.list().then(setUsuarios).catch(console.error)
  }, [currentUser?.id])

  async function login(username, password) {
    const email = usernameToEmail(username)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data?.user) {
      return { ok: false, error: 'Usuario o contraseña incorrectos.' }
    }

    try {
      const profile = await loadProfile(data.user.id)
      if (!profile) {
        await supabase.auth.signOut()
        return { ok: false, error: 'Tu usuario no tiene un perfil asociado. Contactá al administrador.' }
      }
    } catch (e) {
      console.error('Error al cargar el perfil:', e)
      await supabase.auth.signOut()
      return { ok: false, error: 'No se pudo cargar tu perfil. Intentá de nuevo.' }
    }

    return { ok: true }
  }

  async function logout() {
    await supabase.auth.signOut()
    setCurrentUser(null)
  }

  function refreshCurrentUser(updatedUser) {
    setCurrentUser(updatedUser)
  }

  // Cambio de contraseña propia (self-service vía Supabase Auth).
  // El reset de OTROS usuarios necesita la admin API (server-side) y por ahora
  // se hace desde el panel de Supabase.
  async function changeOwnPassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
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

  const isDeveloper = currentUser?.rol === 'desarrollador'
  const isAdmin     = currentUser?.rol === 'administrador' || isDeveloper

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isAdmin,
        isDeveloper,
        login,
        logout,
        usuarios,
        setUsuarios,
        addUsuario,
        updateUsuario,
        deleteUsuario,
        refreshCurrentUser,
        changeOwnPassword,
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
