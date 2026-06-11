'use client'

import { useState, useMemo } from 'react'
import VehicleCard from './VehicleCard'
import styles from './Catalog.module.css'

const LABELS = { Auto: 'Autos', Moto: 'Motos', auto: 'Autos', moto: 'Motos' }

function ordenar(lista, orden) {
  const arr = [...lista]
  if (orden === 'precio-asc') return arr.sort((a, b) => (a.precio ?? Infinity) - (b.precio ?? Infinity))
  if (orden === 'precio-desc') return arr.sort((a, b) => (b.precio ?? -Infinity) - (a.precio ?? -Infinity))
  if (orden === 'anio-desc') return arr.sort((a, b) => (b.anio ?? 0) - (a.anio ?? 0))
  return arr // 'reciente' — orden original del servidor
}

export default function CatalogGrid({ autos }) {
  const tipos = [...new Set(autos.map((a) => a.tipo).filter(Boolean))]
  const [tipo, setTipo] = useState('todos')
  const [orden, setOrden] = useState('reciente')

  const visibles = useMemo(() => {
    const filtrados = tipo === 'todos' ? autos : autos.filter((a) => a.tipo === tipo)
    return ordenar(filtrados, orden)
  }, [autos, tipo, orden])

  return (
    <>
      <div className={styles.toolbar}>
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

        <select
          className={styles.sort}
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          aria-label="Ordenar vehículos"
        >
          <option value="reciente">Más recientes</option>
          <option value="precio-asc">Precio: menor a mayor</option>
          <option value="precio-desc">Precio: mayor a menor</option>
          <option value="anio-desc">Año: más nuevo primero</option>
        </select>
      </div>

      <ul className={styles.grid}>
        {visibles.map((auto) => (
          <VehicleCard key={auto.id} auto={auto} />
        ))}
      </ul>
    </>
  )
}
