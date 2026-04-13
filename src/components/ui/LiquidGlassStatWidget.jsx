import React from 'react'

/**
 * LiquidGlassStatWidget - Widget de estadísticas con liquid glass
 * Diseñado para mostrar métricas clave en móvil
 */
export function LiquidGlassStatWidget({
  icon: Icon,
  label,
  value,
  unit = '',
  change,
  color = 'blue',
  compact = false,
}) {
  const colorVariants = {
    blue: {
      glow: 'from-blue-400/30 via-blue-300/15 to-transparent',
      border: 'border-blue-400/30',
      icon: 'text-blue-500 dark:text-blue-400',
    },
    green: {
      glow: 'from-green-400/30 via-green-300/15 to-transparent',
      border: 'border-green-400/30',
      icon: 'text-green-500 dark:text-green-400',
    },
    purple: {
      glow: 'from-purple-400/30 via-purple-300/15 to-transparent',
      border: 'border-purple-400/30',
      icon: 'text-purple-500 dark:text-purple-400',
    },
    orange: {
      glow: 'from-orange-400/30 via-orange-300/15 to-transparent',
      border: 'border-orange-400/30',
      icon: 'text-orange-500 dark:text-orange-400',
    },
  }

  const variant = colorVariants[color] || colorVariants.blue

  return (
    <div
      className={`
        relative rounded-2xl overflow-hidden
        backdrop-blur-2xl
        bg-gradient-to-br ${variant.glow}
        border ${variant.border} border-white/20 dark:border-white/10
        shadow-lg dark:shadow-2xl
        transition-all duration-500 ease-out
        hover:shadow-xl dark:hover:shadow-3xl hover:border-white/30 dark:hover:border-white/20
        ${compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5 md:p-6'}
      `}
    >
      {/* Efecto de brillo de fondo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-0 group-hover:opacity-100 blur-3xl -z-10 transition-opacity duration-500 pointer-events-none" />

      {/* Contenido */}
      <div className="relative z-10 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={`text-text-tertiary dark:text-text-tertiary ${compact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'}`}>
              {label}
            </p>
            <div className={`font-bold tracking-tight ${compact ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'}`}>
              {value}
              <span className={`text-text-tertiary ${compact ? 'text-xs ml-1' : 'text-sm ml-2'}`}>
                {unit}
              </span>
            </div>
          </div>
          {Icon && (
            <div className={`${variant.icon} ${compact ? 'p-2' : 'p-3'} rounded-full backdrop-blur-lg bg-white/10 dark:bg-white/5`}>
              <Icon size={compact ? 20 : 24} />
            </div>
          )}
        </div>

        {change && (
          <div className={`text-xs flex items-center gap-1 ${change.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            <span>{change.positive ? '↑' : '↓'}</span>
            <span>{Math.abs(change.value)}% vs mes anterior</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default LiquidGlassStatWidget
