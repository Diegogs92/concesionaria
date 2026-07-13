'use client'

import { createContext, useContext, useMemo, useState } from 'react'

// Estado de stock compartido entre el buscador del hero y el catálogo.
// El hero mantiene su propia selección local (sin efecto hasta "Buscar");
// al buscar, comitea esa selección acá y el catálogo la refleja. El catálogo
// también puede escribir el filtro (toggle de tipo, orden).
const StockContext = createContext(null)

export const FILTRO_INICIAL = {
  tipo: 'todos',
  marca: '',
  modelo: '',
  anioDesde: '',
  precioMax: '',
  kmMax: '',
  transmision: 'todas',
}

export function StockProvider({ autos = [], fallo = false, children }) {
  const [filtro, setFiltro] = useState(FILTRO_INICIAL)
  const [orden, setOrden] = useState('reciente')

  const value = useMemo(
    () => ({ autos, fallo, filtro, setFiltro, orden, setOrden }),
    [autos, fallo, filtro, orden]
  )

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>
}

export function useStock() {
  const ctx = useContext(StockContext)
  if (!ctx) throw new Error('useStock debe usarse dentro de <StockProvider>')
  return ctx
}
