import React from 'react'
import { Sun, Moon, Menu } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useLocation } from 'react-router-dom'

const ROUTE_TITLES = {
  '/':          'Dashboard',
  '/autos':     'Autos',
  '/clientes':  'Clientes',
  '/ventas':    'Ventas',
  '/finanzas':  'Finanzas',
  '/empleados': 'Empleados',
}

/**
 * Header sticky de la app.
 * onToggleSidebar: función para abrir/cerrar el sidebar en mobile.
 */
export default function Header({ onToggleSidebar }) {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const title = ROUTE_TITLES[location.pathname] ?? 'AutoGestión'

  return (
    <header className="header">
      <div className="flex items-center gap-3">
        {/* Botón hamburguesa: solo visible en mobile via CSS */}
        <button
          className="btn btn-ghost btn-icon hamburger-btn"
          onClick={onToggleSidebar}
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        <h2 className="header-title">{title}</h2>
      </div>

      <div className="header-actions">
        <button
          className="btn btn-ghost btn-icon"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}
