'use client'

import { useMemo, useState } from 'react'
import { useStock, FILTRO_INICIAL } from '../stock/StockProvider'
import styles from './FilterSidebar.module.css'

const KM_OPCIONES = [
  ['', 'Sin límite'],
  ['50000', 'Hasta 50.000 km'],
  ['100000', 'Hasta 100.000 km'],
  ['150000', 'Hasta 150.000 km'],
  ['200000', 'Hasta 200.000 km'],
]

const TRANSMISIONES = [
  ['todas', 'Todas'],
  ['manual', 'Manual'],
  ['automatica', 'Automática'],
]

function esTipo(auto, tipo) {
  return (auto.tipo || '').toLowerCase().startsWith(tipo)
}

// Panel de filtros del catálogo: marca, tipo, precio máximo, km máximo, año
// desde y transmisión. Las opciones de marca/año se recalculan según el tipo
// elegido (los autos y las motos no comparten marcas). En mobile arranca
// colapsado (la prioridad es ver el stock, no el formulario).
export default function FilterSidebar() {
  const { autos, filtro, setFiltro } = useStock()
  const [abierto, setAbierto] = useState(false)

  const delTipo = useMemo(
    () => (filtro.tipo === 'todos' ? autos : autos.filter((a) => esTipo(a, filtro.tipo))),
    [autos, filtro.tipo]
  )

  const marcas = useMemo(
    () => [...new Set(delTipo.map((a) => a.marca).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    [delTipo]
  )

  const anios = useMemo(
    () => [...new Set(delTipo.map((a) => a.anio).filter(Boolean))].sort((a, b) => b - a),
    [delTipo]
  )

  function set(campo, valor) {
    setFiltro((prev) => ({ ...prev, [campo]: valor }))
  }

  function setTipo(tipo) {
    // Autos y motos no comparten marca/modelo: cambiar tipo los descarta.
    setFiltro((prev) => ({ ...prev, tipo, marca: '', modelo: '' }))
  }

  function setPrecioMax(e) {
    set('precioMax', e.target.value.replace(/\D/g, ''))
  }

  function limpiar() {
    setFiltro(FILTRO_INICIAL)
  }

  return (
    <aside className={styles.sidebar}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
      >
        Filtros
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" data-abierto={abierto} aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <div className={styles.body} data-abierto={abierto}>
        <p className={styles.heading}>Filtros</p>

        <label className={styles.field}>
          <span className={styles.label}>Marca</span>
          <select className={styles.select} value={filtro.marca} onChange={(e) => set('marca', e.target.value)}>
            <option value="">Todas</option>
            {marcas.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Tipo de vehículo</span>
          <select className={styles.select} value={filtro.tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="auto">Autos</option>
            <option value="moto">Motos</option>
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Precio máximo (ARS)</span>
          <input
            type="text"
            inputMode="numeric"
            className={styles.input}
            placeholder="Ej: 40.000.000"
            value={filtro.precioMax ? Number(filtro.precioMax).toLocaleString('es-AR') : ''}
            onChange={setPrecioMax}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Kilómetros máximo</span>
          <select className={styles.select} value={filtro.kmMax} onChange={(e) => set('kmMax', e.target.value)}>
            {KM_OPCIONES.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Año desde</span>
          <select className={styles.select} value={filtro.anioDesde} onChange={(e) => set('anioDesde', e.target.value)}>
            <option value="">Todos</option>
            {anios.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>

        <div className={styles.field}>
          <span className={styles.label}>Transmisión</span>
          <div className={styles.segmented} role="group" aria-label="Transmisión">
            {TRANSMISIONES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={filtro.transmision === value ? styles.segActive : styles.seg}
                aria-pressed={filtro.transmision === value}
                onClick={() => set('transmision', value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button type="button" className={styles.limpiar} onClick={limpiar}>
          Limpiar filtros
        </button>
      </div>
    </aside>
  )
}
