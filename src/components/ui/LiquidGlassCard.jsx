import React from 'react'

/**
 * LiquidGlassCard - Componente de tarjeta con efecto liquid glass
 * Diseñado específicamente para móvil con glassmorphism fluido
 */
export function LiquidGlassCard({
  children,
  gradient = 'from-blue',
  interactive = true,
  onClick,
  className = '',
}) {
  const gradients = {
    'from-blue': 'from-blue-400/20 via-blue-300/10 to-transparent',
    'from-green': 'from-green-400/20 via-green-300/10 to-transparent',
    'from-purple': 'from-purple-400/20 via-purple-300/10 to-transparent',
    'from-orange': 'from-orange-400/20 via-orange-300/10 to-transparent',
  }

  return (
    <div
      className={`
        liquid-glass-card
        relative rounded-3xl overflow-hidden
        backdrop-blur-2xl
        border border-white/20 dark:border-white/10
        shadow-lg dark:shadow-2xl
        ${gradients[gradient]}
        bg-gradient-to-br
        transition-all duration-500 ease-out
        ${interactive ? 'hover:shadow-xl dark:hover:shadow-3xl cursor-pointer hover:border-white/30 dark:hover:border-white/20' : ''}
        ${onClick ? 'active:scale-95' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Efecto de brillo animado (glow) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-white/10 blur-3xl rounded-full"></div>
      </div>

      {/* Contenido */}
      <div className="relative z-10 p-4 sm:p-5 md:p-6">
        {children}
      </div>
    </div>
  )
}

export default LiquidGlassCard
