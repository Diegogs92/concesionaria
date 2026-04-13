import React, { useState } from 'react'
import { Car, TrendingUp, Users, DollarSign, AlertCircle } from 'lucide-react'
import { LiquidGlassCard } from './ui/LiquidGlassCard'
import { LiquidGlassStatWidget } from './ui/LiquidGlassStatWidget'
import { LiquidGlassMobileMenu } from './ui/LiquidGlassMobileMenu'

/**
 * MobileLiquidGlassDemo - Demostración del diseño liquid glass para móvil
 * Muestra cómo se ve la interfaz con glassmorphism fluido y animaciones suaves
 */
export function MobileLiquidGlassDemo() {
  const [menuOpen, setMenuOpen] = useState(false)

  const menuItems = [
    { id: 'dashboard', label: '📊 Dashboard', onClick: () => {} },
    { id: 'autos', label: '🚗 Autos', onClick: () => {} },
    { id: 'ventas', label: '💰 Ventas', onClick: () => {} },
    { id: 'clientes', label: '👥 Clientes', onClick: () => {} },
    { id: 'empleados', label: '👔 Empleados', onClick: () => {} },
    { id: 'reportes', label: '📋 Reportes', onClick: () => {} },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 pb-8">
      {/* Menú móvil con liquid glass */}
      <LiquidGlassMobileMenu
        items={menuItems}
        isOpen={menuOpen}
        onToggle={() => setMenuOpen(!menuOpen)}
      />

      {/* Header */}
      <div className="pt-20 px-4 pb-6 space-y-2">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
          Dashboard
        </h1>
        <p className="text-text-tertiary text-sm">Bienvenido al diseño Liquid Glass</p>
      </div>

      {/* Stats Grid con Liquid Glass */}
      <div className="liquid-glass-grid px-4">
        <LiquidGlassStatWidget
          icon={Car}
          label="Vehículos disponibles"
          value="24"
          color="blue"
          change={{ positive: true, value: 12 }}
        />
        <LiquidGlassStatWidget
          icon={DollarSign}
          label="Ingresos totales"
          value="$125.4K"
          color="green"
          change={{ positive: true, value: 8 }}
        />
        <LiquidGlassStatWidget
          icon={Users}
          label="Clientes registrados"
          value="428"
          color="purple"
          change={{ positive: false, value: 3 }}
        />
        <LiquidGlassStatWidget
          icon={TrendingUp}
          label="Margen de ganancia"
          value="32.5%"
          color="orange"
          change={{ positive: true, value: 5 }}
        />
      </div>

      {/* Cards de contenido */}
      <div className="space-y-4 px-4 mt-6">
        <LiquidGlassCard gradient="from-blue" interactive>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
                <Car size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Últimas ventas</h3>
                <p className="text-sm text-text-tertiary">Actualizado hace 2 horas</p>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              {[
                { name: 'Honda Civic 2024', price: '$28,500', seller: 'Juan M.' },
                { name: 'Toyota Corolla 2023', price: '$22,900', seller: 'María G.' },
                { name: 'Mazda 3 2024', price: '$24,800', seller: 'Carlos L.' },
              ].map((venta, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
                  <div>
                    <p className="font-medium text-text-primary">{venta.name}</p>
                    <p className="text-xs text-text-tertiary">Vendedor: {venta.seller}</p>
                  </div>
                  <p className="font-semibold text-green-600 dark:text-green-400">{venta.price}</p>
                </div>
              ))}
            </div>
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard gradient="from-purple" interactive>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Alertas importantes</h3>
                <p className="text-sm text-text-tertiary">2 acciones requeridas</p>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-200">⚠️ Servicio pendiente</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">3 vehículos requieren mantenimiento</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm">
                <p className="font-medium text-red-900 dark:text-red-200">🔴 Documentación vencida</p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">2 contratos próximos a vencer</p>
              </div>
            </div>
          </div>
        </LiquidGlassCard>

        <LiquidGlassCard gradient="from-green" interactive>
          <div className="space-y-3">
            <h3 className="font-semibold text-text-primary">Próximas acciones</h3>
            <div className="space-y-2">
              {[
                { task: 'Llamar a cliente - Toyota comprada', time: '11:30 AM' },
                { task: 'Revisar papelería de venta', time: '2:00 PM' },
                { task: 'Reunión con gerencia', time: '4:00 PM' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors">
                  <input type="checkbox" className="rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{item.task}</p>
                  </div>
                  <span className="text-xs text-text-tertiary whitespace-nowrap ml-2">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </LiquidGlassCard>
      </div>

      {/* CTA Button */}
      <div className="px-4 mt-8">
        <button className="w-full py-4 rounded-2xl font-semibold backdrop-blur-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all active:scale-95">
          Ver dashboard completo →
        </button>
      </div>

      {/* Footer info */}
      <div className="px-4 mt-8 text-center text-sm text-text-tertiary">
        <p>✨ Diseño optimizado para dispositivos móviles</p>
        <p className="text-xs mt-2">Touch targets: 44x44px | Glassmorphism fluido | Animaciones suaves</p>
      </div>
    </div>
  )
}

export default MobileLiquidGlassDemo
