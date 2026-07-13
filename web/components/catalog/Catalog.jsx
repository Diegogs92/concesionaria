'use client'

import { useMemo, useState } from 'react'
import { useStock, FILTRO_INICIAL } from '../stock/StockProvider'
import { waLink } from '../../lib/site'
import WhatsAppIcon from '../icons/WhatsAppIcon'
import FilterSidebar from './FilterSidebar'
import SortSelect from './SortSelect'
import VehicleCard from './VehicleCard'
import styles from './Catalog.module.css'

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)

const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8 6h13M8 12h13M8 18h13" />
    <path d="M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
)

function esTipo(auto, tipo) {
  return (auto.tipo || '').toLowerCase().startsWith(tipo)
}

function esTransmision(auto, valor) {
  const t = (auto.transmision || '').toLowerCase()
  if (valor === 'manual') return t.startsWith('manual')
  if (valor === 'automatica') return t.startsWith('autom')
  return true
}

function ordenar(lista, orden) {
  const arr = [...lista]
  if (orden === 'precio-asc') return arr.sort((a, b) => (a.precio ?? Infinity) - (b.precio ?? Infinity))
  if (orden === 'precio-desc') return arr.sort((a, b) => (b.precio ?? -Infinity) - (a.precio ?? -Infinity))
  if (orden === 'anio-desc') return arr.sort((a, b) => (b.anio ?? 0) - (a.anio ?? 0))
  return arr // 'reciente' — orden original del servidor
}

export default function Catalog() {
  const { autos, fallo, filtro, setFiltro, orden, setOrden } = useStock()
  const [vista, setVista] = useState('grid')

  const visibles = useMemo(() => {
    let list = autos
    if (filtro.tipo !== 'todos') list = list.filter((a) => esTipo(a, filtro.tipo))
    if (filtro.marca) {
      const marca = filtro.marca.toLowerCase()
      list = list.filter((a) => (a.marca || '').toLowerCase() === marca)
    }
    if (filtro.modelo) list = list.filter((a) => a.modelo === filtro.modelo)
    if (filtro.anioDesde) list = list.filter((a) => (a.anio ?? 0) >= Number(filtro.anioDesde))
    if (filtro.precioMax) list = list.filter((a) => (a.precio ?? 0) <= Number(filtro.precioMax))
    if (filtro.kmMax) list = list.filter((a) => (a.kilometraje ?? 0) <= Number(filtro.kmMax))
    if (filtro.transmision !== 'todas') list = list.filter((a) => esTransmision(a, filtro.transmision))
    return ordenar(list, orden)
  }, [autos, filtro, orden])

  const hayFiltro =
    filtro.tipo !== 'todos' ||
    filtro.marca ||
    filtro.modelo ||
    filtro.anioDesde ||
    filtro.precioMax ||
    filtro.kmMax ||
    filtro.transmision !== 'todas'

  const chips = [
    filtro.marca,
    filtro.modelo,
    filtro.anioDesde && `Desde ${filtro.anioDesde}`,
    filtro.precioMax && `Hasta $${Number(filtro.precioMax).toLocaleString('es-AR')}`,
    filtro.kmMax && `Hasta ${Number(filtro.kmMax).toLocaleString('es-AR')} km`,
    filtro.transmision !== 'todas' && (filtro.transmision === 'manual' ? 'Manual' : 'Automática'),
  ].filter(Boolean)

  function limpiar() {
    setFiltro(FILTRO_INICIAL)
  }

  return (
    <section id="stock">
      <div className={styles.section}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>En stock</p>
          <h2 className={styles.title}>Stock disponible</h2>
        </header>

        {autos.length > 0 ? (
          <div className={styles.layout}>
            <div className={styles.sidebarSticky}>
              <FilterSidebar />
            </div>

            <div>
              <div className={styles.resultsHeader}>
                <p className={styles.resultsCount}>
                  Mostrando <strong>{visibles.length}</strong> {visibles.length === 1 ? 'resultado' : 'resultados'}
                </p>
                <div className={styles.resultsActions}>
                  <SortSelect value={orden} onChange={setOrden} />
                  <div className={styles.viewToggle} role="group" aria-label="Tipo de vista">
                    <button
                      type="button"
                      className={vista === 'grid' ? styles.viewBtnActive : styles.viewBtn}
                      aria-pressed={vista === 'grid'}
                      aria-label="Vista en grilla"
                      onClick={() => setVista('grid')}
                    >
                      <GridIcon />
                    </button>
                    <button
                      type="button"
                      className={vista === 'list' ? styles.viewBtnActive : styles.viewBtn}
                      aria-pressed={vista === 'list'}
                      aria-label="Vista en lista"
                      onClick={() => setVista('list')}
                    >
                      <ListIcon />
                    </button>
                  </div>
                </div>
              </div>

              {(chips.length > 0 || hayFiltro) && (
                <div className={styles.chips}>
                  {chips.map((c) => (
                    <span key={c} className={styles.chip}>{c}</span>
                  ))}
                  <button type="button" className={styles.clear} onClick={limpiar}>
                    Limpiar filtros
                  </button>
                </div>
              )}

              {visibles.length > 0 ? (
                <ul className={styles.grid} data-vista={vista}>
                  {visibles.map((auto) => (
                    <VehicleCard key={auto.id} auto={auto} />
                  ))}
                </ul>
              ) : (
                <div className={styles.empty}>
                  <h3 className={styles.emptyTitle}>No hay vehículos que coincidan con tu búsqueda.</h3>
                  <p className={styles.emptyText}>
                    Probá ampliar los filtros o escribinos y te pasamos lo disponible por WhatsApp.
                  </p>
                  <button type="button" className={styles.emptyReset} onClick={limpiar}>
                    Ver todo el stock
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.empty}>
            {fallo ? (
              <>
                <h3 className={styles.emptyTitle}>No pudimos cargar el stock.</h3>
                <p className={styles.emptyText}>
                  Probá recargar la página en unos segundos. Si seguís sin verlo,
                  escribinos y te pasamos lo disponible por WhatsApp.
                </p>
              </>
            ) : (
              <>
                <h3 className={styles.emptyTitle}>El catálogo se publica en breve.</h3>
                <p className={styles.emptyText}>
                  Estamos cargando el stock. Mientras tanto, escribinos por WhatsApp
                  y te contamos qué hay disponible hoy.
                </p>
              </>
            )}
            <a href={waLink('Hola, quiero saber qué vehículos tienen disponibles.')} className={styles.emptyCta}>
              <WhatsAppIcon />
              Escribinos por WhatsApp
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
