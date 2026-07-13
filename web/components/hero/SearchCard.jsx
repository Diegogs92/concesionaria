'use client'

import { useMemo, useState } from 'react'
import { useStock, FILTRO_INICIAL } from '../stock/StockProvider'
import styles from './SearchCard.module.css'

const CarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <path d="M9 17h6" />
    <circle cx="17" cy="17" r="2" />
  </svg>
)

const BikeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="18.5" cy="17.5" r="3.5" />
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="15" cy="5" r="1" />
    <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
  </svg>
)

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7.5" />
    <path d="M21 21l-5.2-5.2" />
  </svg>
)

function esTipo(auto, tipo) {
  return (auto.tipo || '').toLowerCase().startsWith(tipo)
}

// Buscador del hero: réplica del de icyautomotores.com. Toggle Autos/Motos +
// Marca/Modelo/Año desde poblados con el stock real; "Buscar" comitea el
// filtro compartido y baja al catálogo. La selección local no afecta al
// catálogo hasta que se busca.
export default function SearchCard() {
  const { autos, setFiltro } = useStock()

  const [tipo, setTipo] = useState('auto')
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [anioDesde, setAnioDesde] = useState('')

  const delTipo = useMemo(() => autos.filter((a) => esTipo(a, tipo)), [autos, tipo])

  const marcas = useMemo(
    () => [...new Set(delTipo.map((a) => a.marca).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    [delTipo]
  )

  const modelos = useMemo(() => {
    if (!marca) return []
    return [...new Set(delTipo.filter((a) => a.marca === marca).map((a) => a.modelo).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'es'))
  }, [delTipo, marca])

  const anios = useMemo(
    () => [...new Set(delTipo.map((a) => a.anio).filter(Boolean))].sort((a, b) => b - a),
    [delTipo]
  )

  function cambiarTipo(nuevo) {
    setTipo(nuevo)
    setMarca('')
    setModelo('')
    setAnioDesde('')
  }

  function buscar() {
    setFiltro({ ...FILTRO_INICIAL, tipo, marca, modelo, anioDesde })
    document.getElementById('stock')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={styles.card}>
      <div className={styles.toggleWrap}>
        <div className={styles.toggle} role="tablist" aria-label="Tipo de vehículo">
          <button
            type="button"
            role="tab"
            aria-selected={tipo === 'auto'}
            className={tipo === 'auto' ? styles.toggleActive : styles.toggleBtn}
            onClick={() => cambiarTipo('auto')}
          >
            <CarIcon /> Autos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tipo === 'moto'}
            className={tipo === 'moto' ? styles.toggleActive : styles.toggleBtn}
            onClick={() => cambiarTipo('moto')}
          >
            <BikeIcon /> Motos
          </button>
        </div>
      </div>

      <div className={styles.fields}>
        <label className={styles.field}>
          <span className={styles.label}>Marca</span>
          <div className={styles.selectWrap}>
            <select
              className={styles.select}
              value={marca}
              onChange={(e) => { setMarca(e.target.value); setModelo('') }}
            >
              <option value="">Todas las marcas</option>
              {marcas.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Modelo</span>
          <div className={styles.selectWrap}>
            <select
              className={styles.select}
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              disabled={!marca}
            >
              <option value="">{marca ? 'Todos los modelos' : 'Elegí marca'}</option>
              {modelos.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Año desde</span>
          <div className={styles.selectWrap}>
            <select
              className={styles.select}
              value={anioDesde}
              onChange={(e) => setAnioDesde(e.target.value)}
            >
              <option value="">Cualquier año</option>
              {anios.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </label>

        <button type="button" className={styles.buscar} onClick={buscar}>
          <SearchIcon /> Buscar
        </button>
      </div>
    </div>
  )
}
