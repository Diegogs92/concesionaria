import React, { createContext, useContext } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { INITIAL_AUTOS, INITIAL_CLIENTES, INITIAL_VENTAS, INITIAL_EGRESOS } from '../data/initialData'
import { generateId, today } from '../utils/helpers'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [autos, setAutos]       = useLocalStorage('autos', INITIAL_AUTOS)
  const [clientes, setClientes] = useLocalStorage('clientes', INITIAL_CLIENTES)
  const [ventas, setVentas]     = useLocalStorage('ventas', INITIAL_VENTAS)
  const [egresos, setEgresos]   = useLocalStorage('egresos', INITIAL_EGRESOS)

  // ===================== AUTOS =====================

  function addAuto(data) {
    const nuevo = { ...data, id: generateId('a'), estado: 'disponible', createdAt: today() }
    setAutos(prev => [...prev, nuevo])
    return nuevo
  }

  function updateAuto(id, data) {
    setAutos(prev => prev.map(a => (a.id === id ? { ...a, ...data } : a)))
  }

  function deleteAuto(id) {
    setAutos(prev => prev.filter(a => a.id !== id))
  }

  function marcarVendido(id) {
    setAutos(prev => prev.map(a => (a.id === id ? { ...a, estado: 'vendido' } : a)))
  }

  // ===================== CLIENTES =====================

  function addCliente(data) {
    const nuevo = { ...data, id: generateId('c'), createdAt: today() }
    setClientes(prev => [...prev, nuevo])
    return nuevo
  }

  function updateCliente(id, data) {
    setClientes(prev => prev.map(c => (c.id === id ? { ...c, ...data } : c)))
  }

  function deleteCliente(id) {
    setClientes(prev => prev.filter(c => c.id !== id))
  }

  // ===================== VENTAS =====================

  function addVenta(data, autoInfo, vendedorComision) {
    const ganancia = data.precioFinal - autoInfo.precioCompra
    const comisionVendedor = (ganancia * vendedorComision) / 100

    const nueva = {
      ...data,
      id: generateId('v'),
      ganancia,
      comisionVendedor,
      fecha: data.fecha || today(),
      createdAt: today(),
    }
    setVentas(prev => [...prev, nueva])
    marcarVendido(data.autoId)
    return nueva
  }

  function deleteVenta(id, autoId) {
    setVentas(prev => prev.filter(v => v.id !== id))
    // Devolver el auto a disponible
    updateAuto(autoId, { estado: 'disponible' })
  }

  // ===================== EGRESOS =====================

  function addEgreso(data) {
    const nuevo = { ...data, id: generateId('e'), createdAt: today() }
    setEgresos(prev => [...prev, nuevo])
    return nuevo
  }

  function deleteEgreso(id) {
    setEgresos(prev => prev.filter(e => e.id !== id))
  }

  // Helpers de lookup
  function getAutoById(id)     { return autos.find(a => a.id === id) }
  function getClienteById(id) { return clientes.find(c => c.id === id) }

  return (
    <AppContext.Provider
      value={{
        // Estado
        autos,
        clientes,
        ventas,
        // Autos
        addAuto, updateAuto, deleteAuto, marcarVendido,
        // Clientes
        addCliente, updateCliente, deleteCliente,
        // Ventas
        addVenta, deleteVenta,
        // Egresos
        egresos, addEgreso, deleteEgreso,
        // Lookups
        getAutoById, getClienteById,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider')
  return ctx
}
