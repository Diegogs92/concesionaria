'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './SortSelect.module.css'

const OPCIONES = [
  ['reciente', 'Más recientes'],
  ['precio-asc', 'Precio: menor a mayor'],
  ['precio-desc', 'Precio: mayor a menor'],
  ['anio-desc', 'Año: más nuevo primero'],
]

// Dropdown de orden con panel propio (no un <select> nativo): así se puede
// resaltar la opción activa igual que en la referencia. Cierra al elegir una
// opción o al tocar afuera.
export default function SortSelect({ value, onChange }) {
  const [abierto, setAbierto] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!abierto) return
    function onClickFuera(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setAbierto(false)
    }
    function onEscape(e) {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('pointerdown', onClickFuera)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('pointerdown', onClickFuera)
      document.removeEventListener('keydown', onEscape)
    }
  }, [abierto])

  const actual = OPCIONES.find(([v]) => v === value)

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
      >
        {actual ? actual[1] : 'Seleccionar'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" data-abierto={abierto} aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {abierto && (
        <ul className={styles.panel} role="listbox">
          {OPCIONES.map(([v, label]) => (
            <li key={v}>
              <button
                type="button"
                role="option"
                aria-selected={v === value}
                className={v === value ? styles.optionActive : styles.option}
                onClick={() => { onChange(v); setAbierto(false) }}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
