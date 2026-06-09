import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Car, Users, ShoppingBag, UserCheck,
  BarChart2, LogOut, Wallet, X, FileBarChart,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { getInitials } from '../../utils/helpers'
import { RolBadge } from '../ui/Badge'

const ALL_ROLES = ['administrador', 'vendedor', 'desarrollador']
const ADMIN_ROLES = ['administrador', 'desarrollador']

const NAV_ITEMS = [
  { to: '/',         id: 'dashboard', label: 'Dashboard',  icon: BarChart2,    roles: ALL_ROLES },
  { to: '/autos',    id: 'autos',     label: 'Vehículos',  icon: Car,          roles: ALL_ROLES },
  { to: '/clientes', id: 'clientes',  label: 'Clientes',   icon: Users,        roles: ALL_ROLES },
  { to: '/ventas',   id: 'ventas',    label: 'Ventas',     icon: ShoppingBag,  roles: ALL_ROLES },
  { to: '/finanzas', id: 'finanzas',  label: 'Finanzas',   icon: Wallet,       roles: ADMIN_ROLES },
  { to: '/reportes', id: 'reportes',  label: 'Reportes',   icon: FileBarChart, roles: ADMIN_ROLES },
  { to: '/usuarios', id: 'usuarios',  label: 'Usuarios',   icon: UserCheck,    roles: ['desarrollador'] },
]

/**
 * Sidebar de navegación.
 * En desktop: siempre visible.
 * En mobile: drawer deslizable controlado por isOpen/onClose.
 */
export default function Sidebar({ isOpen, onClose }) {
  const { currentUser, logout } = useAuth()
  const { theme } = useTheme()
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
          <img
            src={theme === 'dark' ? '/logo.png' : '/dark_logo.webp'}
            alt="Logo"
            style={{ height: 40, width: 'auto', objectFit: 'contain' }}
          />
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

        {visibleItems.map(({ to, id, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            data-nav={id}
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
          {currentUser?.foto_url
            ? <img src={currentUser.foto_url} alt={currentUser.nombre} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div className="sidebar-avatar">{getInitials(currentUser?.nombre)}</div>
          }
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{currentUser?.nombre}</div>
            <div className="sidebar-user-role">
              {currentUser?.rol === 'desarrollador' ? 'Desarrollador' : currentUser?.rol === 'vendedor' ? 'Vendedor' : 'Administrador'}
            </div>
          </div>
        </div>

        <button className="sidebar-link" data-nav="logout" onClick={handleLogout}>
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
