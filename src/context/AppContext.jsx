import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { today } from '../utils/helpers'
import {
  autosService,
  clientesService,
  ventasService,
  egresosService,
  deudasService,
  deudaConceptosService,
  deudaPagosService,
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
  const [deudaPagos,      setDeudaPagos]      = useState([])
  const [historialPrecios, setHistorialPrecios] = useState([])
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState(null)

  // Cargar todos los datos al iniciar
  useEffect(() => {
    async function cargarDatos() {
      try {
        const [a, c, v, e, d, dc, dp, hp] = await Promise.all([
          autosService.list(),
          clientesService.list(),
          ventasService.list(),
          egresosService.list(),
          deudasService.list(),
          deudaConceptosService.list(),
          deudaPagosService.list(),
          historialService.list(),
        ])
        setAutos(a)
        setClientes(c)
        setVentas(v)
        setEgresos(e)
        setDeudas(d)
        setDeudaConceptos(dc)
        setDeudaPagos(dp)
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

  async function addVenta(data, autoInfo) {
    const ganancia = data.precioFinal - autoInfo.precioCompra
    const { comisionVendedorMonto, pagosTerceros: pagosArray, utilidad: utilData, autoUsado: autoUsadoData, interes, ...rest } = data
    const nueva = await ventasService.create({
      ...rest,
      ganancia,
      comisionVendedor: comisionVendedorMonto ?? 0,
      pagosTerceros: JSON.stringify(pagosArray || []),
      utilidad: utilData ?? ganancia,
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
    setDeudaPagos(prev => prev.filter(p => p.deuda_id !== id))

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

  async function addDeudaPago(deudaId, monto, fecha) {
    const deuda = deudas.find(d => d.id === deudaId)
    const nuevo = await deudaPagosService.create({ deuda_id: deudaId, monto, fecha: fecha || today(), createdAt: today() })
    const pagosActualizados = [...deudaPagos.filter(p => p.deuda_id === deudaId), nuevo]
    const totalPagado = pagosActualizados.reduce((sum, p) => sum + Number(p.monto), 0)
    const nuevoEstado = totalPagado >= Number(deuda.monto) ? 'PAGADA' : 'PAGO_PARCIAL'
    await deudasService.update(deudaId, { estado: nuevoEstado })
    setDeudaPagos(prev => [...prev, nuevo])
    setDeudas(prev => prev.map(d => d.id === deudaId ? { ...d, estado: nuevoEstado } : d))
  }

  async function updateDeudaPago(pagoId, deudaId, monto, fecha) {
    const actualizado = await deudaPagosService.update(pagoId, { monto, fecha })
    const pagosActualizados = deudaPagos.map(p => p.id === pagoId ? { ...p, ...actualizado } : p)
    const totalPagado = pagosActualizados.filter(p => p.deuda_id === deudaId).reduce((s, p) => s + Number(p.monto), 0)
    const deuda = deudas.find(d => d.id === deudaId)
    const nuevoEstado = totalPagado >= Number(deuda.monto) ? 'PAGADA' : totalPagado > 0 ? 'PAGO_PARCIAL' : 'PENDIENTE'
    await deudasService.update(deudaId, { estado: nuevoEstado })
    setDeudaPagos(pagosActualizados)
    setDeudas(prev => prev.map(d => d.id === deudaId ? { ...d, estado: nuevoEstado } : d))
  }

  async function deleteDeudaPago(pagoId, deudaId) {
    await deudaPagosService.deleteOne(pagoId)
    const pagosRestantes = deudaPagos.filter(p => p.id !== pagoId && p.deuda_id === deudaId)
    const totalPagado = pagosRestantes.reduce((s, p) => s + Number(p.monto), 0)
    const deuda = deudas.find(d => d.id === deudaId)
    const nuevoEstado = totalPagado >= Number(deuda.monto) ? 'PAGADA' : totalPagado > 0 ? 'PAGO_PARCIAL' : 'PENDIENTE'
    await deudasService.update(deudaId, { estado: nuevoEstado })
    setDeudaPagos(prev => prev.filter(p => p.id !== pagoId))
    setDeudas(prev => prev.map(d => d.id === deudaId ? { ...d, estado: nuevoEstado } : d))
  }

  async function revertirDeuda(id) {
    await deudaPagosService.deleteByDeuda(id)
    await deudasService.update(id, { estado: 'PENDIENTE' })
    setDeudaPagos(prev => prev.filter(p => p.deuda_id !== id))
    setDeudas(prev => prev.map(d => d.id === id ? { ...d, estado: 'PENDIENTE' } : d))
  }

function getAutoById(id)    { return autos.find(a => a.id === id) }
  function getClienteById(id) { return clientes.find(c => c.id === id) }

  return (
    <AppContext.Provider
      value={{
        autos, clientes, ventas, egresos, deudas, deudaConceptos, deudaPagos, historialPrecios,
        loading, error,
        addAuto, updateAuto, deleteAuto, marcarVendido,
        addCliente, updateCliente, deleteCliente,
        addVenta, deleteVenta,
        addEgreso, deleteEgreso,
        addDeuda, updateDeuda, deleteDeuda, addDeudaPago, updateDeudaPago, deleteDeudaPago, revertirDeuda,
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
