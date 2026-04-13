import React, { useState } from 'react'
import { Menu, X } from 'lucide-react'

/**
 * LiquidGlassMobileMenu - Menú móvil con diseño liquid glass
 * Menú deslizable con fondo de vidrio y animaciones fluidas
 */
export function LiquidGlassMobileMenu({ items, isOpen, onToggle }) {
  return (
    <>
      {/* Botón de menú */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-full backdrop-blur-lg bg-white/20 dark:bg-white/10 border border-white/30 dark:border-white/20 hover:bg-white/30 dark:hover:bg-white/20 transition-all active:scale-95"
        onClick={onToggle}
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-40 transition-all"
          onClick={onToggle}
        />
      )}

      {/* Menú */}
      <div
        className={`
          fixed left-0 top-0 h-full w-64 z-40
          bg-gradient-to-br from-white/30 dark:from-white/5 via-white/20 dark:via-white/2 to-white/10 dark:to-black/20
          backdrop-blur-3xl
          border-r border-white/20 dark:border-white/10
          transform transition-transform duration-500 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          shadow-2xl
          pt-16 px-4
          space-y-2
        `}
      >
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              item.onClick?.()
              onToggle()
            }}
            className="w-full text-left px-4 py-3 rounded-2xl backdrop-blur-lg bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-all active:scale-95 font-medium text-sm sm:text-base"
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  )
}

export default LiquidGlassMobileMenu
