import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Car, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Sun, Moon } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.username || !form.password) {
      setError('Completá usuario y contraseña.')
      return
    }
    setLoading(true)
    // Simular latencia de red
    await new Promise(r => setTimeout(r, 400))
    const result = login(form.username, form.password)
    setLoading(false)

    if (result.ok) {
      navigate('/')
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="login-page">
      {/* Fondo decorativo */}
      <div className="login-bg">
        <div
          className="login-bg-blob"
          style={{
            width: 500, height: 500,
            background: 'var(--accent)',
            top: -100, left: -100,
          }}
        />
        <div
          className="login-bg-blob"
          style={{
            width: 400, height: 400,
            background: 'var(--success)',
            bottom: -80, right: -80,
          }}
        />
      </div>

      {/* Botón de tema en esquina */}
      <button
        className="btn btn-ghost btn-icon"
        onClick={toggleTheme}
        style={{ position: 'fixed', top: 20, right: 20 }}
        title="Cambiar tema"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Card de login */}
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">
            <Car size={32} />
          </div>
          <h1>AutoGestión</h1>
          <p>Sistema de administración de concesionaria</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input
              type="text"
              name="username"
              className="form-input"
              placeholder="Ingresá tu usuario"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setShowPass(s => !s)}
                style={{
                  position: 'absolute', right: 4, top: '50%',
                  transform: 'translateY(-50%)', width: 32, height: 32,
                }}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 4 }}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        {/* Credenciales de demo */}
        <div className="login-demo">
          <strong>Accesos de prueba:</strong><br />
          <strong>Gerente:</strong> gerente / 1234<br />
          <strong>Empleado:</strong> martina / 1234 &nbsp;|&nbsp; rodrigo / 1234
        </div>
      </div>
    </div>
  )
}
