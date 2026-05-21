import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { today } from '../utils/helpers'
import {
  autosService,
  clientesService,
  ventasService,
  egresosService,
  deudasService,
  deudaConceptosService,
  testDrivesService,
  historialService,
} from '../services/database'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [autos,           setAutos]           = useState([])
  const [clientes,        setClientes]        = useState([])
  const [ventas,          setVentas]          = useState([])
  const [egresos,         setEgresos]         = useState([])
  const [deudas,          setDeudas]          = useState([])
  const [deudaConceptos,  setDeudaConceptos]  = useState([])
  const [testDrives,      setTestDrives]      = useState([])
  const [historialPrecios, setHistorialPrecios] = useState([])
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState(null)

  // Cargar todos los datos al iniciar
  useEffect(() => {
    async function cargarDatos() {
      try {
        const [a, c, v, e, d, dc, td, hp] = await Promise.all([
          autosService.list(),
          clientesService.list(),
          ventasService.list(),
          egresosService.list(),
          deudasService.list(),
          deudaConceptosService.list(),
          testDrivesService.list(),
          historialService.list(),
        ])
        setAutos(a)
        setClientes(c)
        setVentas(v)
        setEgresos(e)
        setDeudas(d)
        setDeudaConceptos(dc)
        setTestDrives(td)
        setHistorialPrecios(hp)
      } catch (err) {
        setError('Error al conectar con la base de datos.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    cargarDatos()
  }, [])

  // ===================== AUTOS =====================

  async function addAuto(data) {
    const nuevo = await autosService.create({ ...data, estado: 'disponible', createdAt: today() })
    setAutos(prev => [nuevo, ...prev])
    return nuevo
  }

  async function updateAuto(id, data) {
    const autoActual = autos.find(a => a.id === id)
    if (autoActual) {
      if (data.precio && data.precio !== autoActual.precio) {
        const hp = await historialService.create({
          autoId: id, campo: 'precio',
          valorAnterior: autoActual.precio, valorNuevo: data.precio,
          fecha: today(), createdAt: today(),
        })
        setHistorialPrecios(prev => [hp, ...prev])
      }
      if (data.precioCompra && data.precioCompra !== autoActual.precioCompra) {
        const hp = await historialService.create({
          autoId: id, campo: 'precioCompra',
          valorAnterior: autoActual.precioCompra, valorNuevo: data.precioCompra,
          fecha: today(), createdAt: today(),
        })
        setHistorialPrecios(prev => [hp, ...prev])
      }
    }
    const actualizado = await autosService.update(id, data)
    setAutos(prev => prev.map(a => a.id === id ? { ...a, ...actualizado } : a))
  }

  async function deleteAuto(id) {
    await autosService.delete(id)
    setAutos(prev => prev.filter(a => a.id !== id))
  }

  async function marcarVendido(id) {
    await autosService.update(id, { estado: 'vendido' })
    setAutos(prev => prev.map(a => a.id === id ? { ...a, estado: 'vendido' } : a))
  }

  // ===================== CLIENTES =====================

  async function addCliente(data) {
    const nuevo = await clientesService.create({ ...data, createdAt: today() })
    setClientes(prev => [nuevo, ...prev])
    return nuevo
  }

  async function updateCliente(id, data) {
    const actualizado = await clientesService.update(id, data)
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...actualizado } : c))
  }

  async function deleteCliente(id) {
    await clientesService.delete(id)
    setClientes(prev => prev.filter(c => c.id !== id))
  }

  // ===================== VENTAS =====================

  async function addVenta(data, autoInfo, vendedorComision) {
    const ganancia = data.precioFinal - autoInfo.precioCompra
    const comisionVendedor = Math.round((ganancia * vendedorComision) / 100)
    const nueva = await ventasService.create({
      ...data,
      ganancia,
      comisionVendedor,
      fecha: data.fecha || today(),
      createdAt: today(),
    })
    setVentas(prev => [nueva, ...prev])
    await marcarVendido(data.autoId)
    return nueva
  }

  async function deleteVenta(id, autoId) {
    await ventasService.delete(id)
    setVentas(prev => prev.filter(v => v.id !== id))
    await updateAuto(autoId, { estado: 'disponible' })
  }

  // ===================== EGRESOS =====================

  async function addEgreso(data) {
    const nuevo = await egresosService.create({ ...data, createdAt: today() })
    setEgresos(prev => [nuevo, ...prev])
    return nuevo
  }

  async function deleteEgreso(id) {
    await egresosService.delete(id)
    setEgresos(prev => prev.filter(e => e.id !== id))
  }

  // ===================== DEUDAS =====================

  async function saveDeudaConcepto(tipo, concepto) {
    const nombre = concepto.trim()
    const existe = deudaConceptos.some(c =>
      c.tipo === tipo && c.nombre.toLowerCase() === nombre.toLowerCase()
    )
    if (existe) return

    const nuevo = await deudaConceptosService.save({
      tipo,
      nombre,
      createdAt: today(),
    })
    setDeudaConceptos(prev => [...prev, nuevo].sort((a, b) => a.nombre.localeCompare(b.nombre)))
  }

  async function addDeuda(data) {
    await saveDeudaConcepto(data.tipo, data.concepto)
    const nueva = await deudasService.create({ ...data, createdAt: today() })
    setDeudas(prev => [nueva, ...prev])
    return nueva
  }

  async function updateDeuda(id, data) {
    if (data.tipo && data.concepto) {
      await saveDeudaConcepto(data.tipo, data.concepto)
    }
    const actualizada = await deudasService.update(id, data)
    setDeudas(prev => prev.map(d => d.id === id ? { ...d, ...actualizada } : d))
  }

  async function deleteDeuda(id) {
    const deudaEliminada = deudas.find(d => d.id === id)
    await deudasService.delete(id)
    setDeudas(prev => prev.filter(d => d.id !== id))

    if (!deudaEliminada) return

    const quedanDeudasDelConcepto = deudas.some(d =>
      d.id !== id
      && d.tipo === deudaEliminada.tipo
      && d.concepto === deudaEliminada.concepto
    )

    if (!quedanDeudasDelConcepto) {
      setDeudaConceptos(prev => prev.filter(c =>
        c.tipo !== deudaEliminada.tipo || c.nombre !== deudaEliminada.concepto
      ))
    }
  }

  // ===================== TEST DRIVES =====================

  async function addTestDrive(data) {
    const nuevo = await testDrivesService.create({ ...data, createdAt: today() })
    setTestDrives(prev => [nuevo, ...prev])
    return nuevo
  }

  async function updateTestDrive(id, data) {
    const actualizado = await testDrivesService.update(id, data)
    setTestDrives(prev => prev.map(td => td.id === id ? { ...td, ...actualizado } : td))
  }

  async function deleteTestDrive(id) {
    await testDrivesService.delete(id)
    setTestDrives(prev => prev.filter(td => td.id !== id))
  }

  function getAutoById(id)    { return autos.find(a => a.id === id) }
  function getClienteById(id) { return clientes.find(c => c.id === id) }

  return (
    <AppContext.Provider
      value={{
        autos, clientes, ventas, egresos, deudas, deudaConceptos, testDrives, historialPrecios,
        loading, error,
        addAuto, updateAuto, deleteAuto, marcarVendido,
        addCliente, updateCliente, deleteCliente,
        addVenta, deleteVenta,
        addEgreso, deleteEgreso,
        addDeuda, updateDeuda, deleteDeuda,
        addTestDrive, updateTestDrive, deleteTestDrive,
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
