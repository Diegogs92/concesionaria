import React from 'react'
import { Sun, Moon, Bell } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useLocation } from 'react-router-dom'

const ROUTE_TITLES = {
  '/':          'Dashboard',
  '/autos':     'Autos',
  '/clientes':  'Clientes',
  '/ventas':    'Ventas',
  '/empleados': 'Empleados',
}

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const title = ROUTE_TITLES[location.pathname] ?? 'AutoGestión'

  return (
    <header className="header">
      <h2 className="header-title">{title}</h2>

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
