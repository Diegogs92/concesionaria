'use client'

import { useState } from 'react'
import VehicleCard from './VehicleCard'
import styles from './Catalog.module.css'

// El sistema interno guarda tipo como 'Auto' / 'Moto'.
const LABELS = { Auto: 'Autos', Moto: 'Motos', auto: 'Autos', moto: 'Motos' }

export default function CatalogGrid({ autos }) {
  const tipos = [...new Set(autos.map((a) => a.tipo).filter(Boolean))]
  const [tipo, setTipo] = useState('todos')
  const visibles = tipo === 'todos' ? autos : autos.filter((a) => a.tipo === tipo)

  return (
    <>
      {tipos.length > 1 && (
        <div className={styles.filters} role="group" aria-label="Filtrar por tipo de vehículo">
          <button
            type="button"
            className={tipo === 'todos' ? styles.filterActive : styles.filter}
            aria-pressed={tipo === 'todos'}
            onClick={() => setTipo('todos')}
          >
            Todos
          </button>
          {tipos.map((t) => (
            <button
              key={t}
              type="button"
              className={tipo === t ? styles.filterActive : styles.filter}
              aria-pressed={tipo === t}
              onClick={() => setTipo(t)}
            >
              {LABELS[t] || t}
            </button>
          ))}
        </div>
      )}

      <ul className={styles.grid}>
        {visibles.map((auto) => (
          <VehicleCard key={auto.id} auto={auto} />
        ))}
      </ul>
    </>
  )
}
