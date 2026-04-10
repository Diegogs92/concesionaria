import { useState, useEffect } from 'react'

/**
 * Hook personalizado para sincronizar estado con localStorage.
 * Funciona igual que useState pero persiste el valor automáticamente.
 *
 * @param {string} key     - Clave en localStorage
 * @param {*}      initial - Valor inicial si la clave no existe
 */
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      console.error('Error guardando en localStorage:', key)
    }
  }, [key, value])

  return [value, setValue]
}
