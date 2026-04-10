import { useState, useMemo } from 'react'
import { Plus, Trash2, DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatDate, today, sumBy } from '../utils/helpers'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SearchBar from '../components/ui/SearchBar'

// ─── Componente para Badge de Tipo de Egreso ─────────────────────────────────
function EgresoBadge({ tipo }) {
  const config = {
    comision:  { bg: 'var(--warning-light)', color: 'var(--warning)', label: 'Comisión' },
    operativo: { bg: 'var(--info-light)',    color: 'var(--info)',    label: 'Operativo' },
    varios:    { bg: 'var(--bg-tertiary)',   color: 'var(--text-tertiary)', label: 'Varios' },
  }
  const c = config[tipo] || config.varios
  return (
    <span style={{
      background: c.bg, color: c.color,
      padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: 0.5,
      display: 'inline-block'
    }}>
      {c.label}
    </span>
  )
}

// ─── Formulario de Egreso ──────────────────────────────────────────────────
function EgresoForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    tipo: 'operativo',
    descripcion: '',
    monto: '',
    fecha: today(),
  })
  const [errors, setErrors] = useState({})

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.descripcion.trim()) e.descripcion = 'Ingresá una descripción'
    if (!form.monto || Number(form.monto) <= 0) e.monto = 'Ingresá un monto válido'
    if (!form.fecha) e.fecha = 'Ingresá la fecha'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      ...form,
      monto: Number(form.monto),
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        
        <div className="form-group">
          <label className="form-label">Tipo de egreso *</label>
          <select className="form-input form-select" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            <option value="operativo">Operativo (Alquiler, Luz, Sueldos, etc)</option>
            <option value="varios">Varios (Insumos, Mantenimiento, etc)</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Descripción *</label>
          <input
            type="text" className="form-input" value={form.descripcion}
            onChange={e => set('descripcion', e.target.value)}
            placeholder="Ej. Alquiler del local"
          />
          {errors.descripcion && <span className="form-error">{errors.descripcion}</span>}
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Monto ($) *</label>
            <input
              type="number" className="form-input" value={form.monto}
              onChange={e => set('monto', e.target.value)}
              placeholder="50000" min="0" step="0.01"
            />
            {errors.monto && <span className="form-error">{errors.monto}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Fecha *</label>
            <input
              type="date" className="form-input" value={form.fecha}
              onChange={e => set('fecha', e.target.value)}
            />
            {errors.fecha && <span className="form-error">{errors.fecha}</span>}
          </div>
        </div>
      </div>

      <div className="modal-footer" style={{ paddingInline: 0, paddingBottom: 0, marginTop: 16 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn-primary">Registrar egreso</button>
      </div>
    </form>
  )
}

// ─── Página de Finanzas ──────────────────────────────────────────────────────
export default function FinanzasPage() {
  const { egresos, ventas, addEgreso, deleteEgreso, getAutoById } = useApp()
  
  const [search, setSearch] = useState('')
  const [modalOpen, setModal] = useState(false)
  const [deletingEgreso, setDel] = useState(null)

  // 1. Calcular estadísticas
  const gananciaBruta = sumBy(ventas, 'ganancia')
  
  const totalComisiones = sumBy(ventas, 'comisionVendedor')
  const totalOperativos = sumBy(egresos.filter(e => e.tipo === 'operativo'), 'monto')
  const totalVarios = sumBy(egresos.filter(e => e.tipo === 'varios'), 'monto')
  const totalEgresos = totalComisiones + totalOperativos + totalVarios
  
  const beneficioNeto = gananciaBruta - totalEgresos

  // 2. Unificar Egresos (manuales + virtuales por comisiones automáticas)
  const unifiedEgresos = useMemo(() => {
    // Convertir ventas en egresos virtuales de comisión
    const comisionesVirtuales = ventas.filter(v => v.comisionVendedor > 0).map(v => {
      const auto = getAutoById(v.autoId)
      const nombreAuto = auto ? `${auto.marca} ${auto.modelo}` : 'Auto eliminado'
      return {
        id: `com-${v.id}`, // Id virtual
        isVirtual: true,   // Bandera para no permitir borrarlo manualmente desde acá
        tipo: 'comision',
        descripcion: `Comisión por venta de ${nombreAuto}`,
        monto: v.comisionVendedor,
        fecha: v.fecha,
        createdAt: v.createdAt
      }
    })

    const all = [...egresos, ...comisionesVirtuales]
    
    // Filtrar por búsqueda
    const q = search.toLowerCase()
    if (!q) return all
    
    return all.filter(e => e.descripcion.toLowerCase().includes(q) || e.tipo.toLowerCase().includes(q))
  }, [egresos, ventas, search, getAutoById])

  // Ordenar de más reciente a más antiguo
  const sortedEgresos = [...unifiedEgresos].sort((a, b) => b.fecha.localeCompare(a.fecha))

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Finanzas y Egresos</h1>
          <p className="page-subtitle">Gestión de gastos operativos, comisiones y utilidades</p>
        </div>

        <div className="flex items-center gap-2">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar egreso..." />
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <Plus size={16} /> Registrar Egreso
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Ganancia Bruta (Ventas)</div>
              <div className="stat-card-value" style={{ marginTop: 6, color: 'var(--success)' }}>
                {formatCurrency(gananciaBruta)}
              </div>
            </div>
            <div className="stat-card-icon" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label">Egresos Totales</div>
              <div className="stat-card-value" style={{ marginTop: 6, color: 'var(--danger)' }}>
                {formatCurrency(totalEgresos)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                Comisiones: {formatCurrency(totalComisiones)}
              </div>
            </div>
            <div className="stat-card-icon" style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
              <TrendingDown size={20} />
            </div>
          </div>
        </div>

        <div className="card stat-card" style={{ border: '2px solid var(--accent)' }}>
          <div className="stat-card-header">
            <div>
              <div className="stat-card-label" style={{ fontWeight: 700, color: 'var(--accent)' }}>Beneficio Neto</div>
              <div className="stat-card-value" style={{ marginTop: 6 }}>
                {formatCurrency(beneficioNeto)}
              </div>
            </div>
            <div className="stat-card-icon" style={{ background: 'var(--accent)', color: '#fff' }}>
              <Wallet size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Egresos */}
      <div className="card">
        <div className="table-wrapper">
          {sortedEgresos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><DollarSign size={24} /></div>
              <strong>Sin egresos registrados</strong>
              <p>No se encontraron egresos ni comisiones pagadas.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Monto</th>
                  <th style={{ width: 60 }}>Acc.</th>
                </tr>
              </thead>
              <tbody>
                {sortedEgresos.map(e => (
                  <tr key={e.id}>
                    <td style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>{formatDate(e.fecha)}</td>
                    <td>
                      <EgresoBadge tipo={e.tipo} />
                    </td>
                    <td style={{ fontWeight: 500 }}>{e.descripcion}</td>
                    <td style={{ fontWeight: 700, color: 'var(--danger)' }}>
                      - {formatCurrency(e.monto)}
                    </td>
                    <td>
                      {!e.isVirtual ? (
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => setDel(e)}
                          style={{ color: 'var(--danger)' }}
                          title="Eliminar egreso"
                        >
                          <Trash2 size={15} />
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }} title="Generado automáticamente">Auto</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModal(false)} title="Registrar Egreso" size="sm">
        <EgresoForm
          onSubmit={(data) => {
            addEgreso(data)
            setModal(false)
          }}
          onCancel={() => setModal(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deletingEgreso}
        onClose={() => setDel(null)}
        onConfirm={() => {
          deleteEgreso(deletingEgreso.id)
          setDel(null)
        }}
        title="Eliminar Egreso"
        message={`¿Estás seguro de que deseas eliminar este egreso por ${deletingEgreso ? formatCurrency(deletingEgreso.monto) : ''}?`}
      />
    </>
  )
}
