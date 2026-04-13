import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Car, Users, ShoppingBag, UserCheck,
  BarChart2, LogOut, Wallet, X, CalendarCheck, FileBarChart,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../utils/helpers'
import { RolBadge } from '../ui/Badge'

const NAV_ITEMS = [
  { to: '/',          label: 'Dashboard',  icon: BarChart2,   roles: ['gerente', 'empleado'] },
  { to: '/autos',     label: 'Autos',      icon: Car,         roles: ['gerente', 'empleado'] },
  { to: '/clientes',  label: 'Clientes',   icon: Users,       roles: ['gerente', 'empleado'] },
  { to: '/ventas',    label: 'Ventas',     icon: ShoppingBag, roles: ['gerente', 'empleado'] },
  { to: '/test-drives', label: 'Test Drive', icon: CalendarCheck, roles: ['gerente', 'empleado'] },
  { to: '/finanzas',  label: 'Finanzas',   icon: Wallet,      roles: ['gerente'] },
  { to: '/reportes',  label: 'Reportes',   icon: FileBarChart, roles: ['gerente'] },
  { to: '/empleados', label: 'Empleados',  icon: UserCheck,   roles: ['gerente'] },
]

/**
 * Sidebar de navegación.
 * En desktop: siempre visible.
 * En mobile: drawer deslizable controlado por isOpen/onClose.
 */
export default function Sidebar({ isOpen, onClose }) {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function handleNavClick() {
    // Cerrar sidebar en mobile al navegar
    onClose?.()
  }

  const visibleItems = NAV_ITEMS.filter(item =>
    item.roles.includes(currentUser?.rol)
  )

  return (
    <aside className={`sidebar${isOpen ? ' sidebar-open' : ''}`}>
      {/* Logo + botón de cierre en mobile */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-inner">
          <div className="sidebar-logo-icon">
            <Car size={22} />
          </div>
          <div className="sidebar-logo-text">
            <h1>AutoGestión</h1>
            <p>Concesionaria</p>
          </div>

          {/* Botón X solo visible en mobile */}
          <button
            className="btn btn-ghost btn-icon hamburger-btn"
            onClick={onClose}
            aria-label="Cerrar menú"
            style={{ marginLeft: 'auto', flexShrink: 0 }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Navegación */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Menú</span>

        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer del sidebar */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {getInitials(currentUser?.nombre)}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{currentUser?.nombre}</div>
            <div className="sidebar-user-role">
              {currentUser?.rol === 'gerente' ? 'Gerente' : 'Empleado'}
            </div>
          </div>
        </div>

        <button className="sidebar-link" onClick={handleLogout}>
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
