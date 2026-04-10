import React from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import {
  Car, ShoppingBag, DollarSign, TrendingUp,
  Users, Award, ArrowUpRight,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import {
  formatCurrency, getVentasPorMes, getRankingVendedores,
  sumBy, getInitials,
} from '../utils/helpers'

// ─── Componente de tarjeta de estadística ───────────────────────────────────
function StatCard({ icon: Icon, label, value, color, subLabel }) {
  const colorMap = {
    blue:   { bg: 'var(--accent-light)',   fg: 'var(--accent)'   },
    green:  { bg: 'var(--success-light)',  fg: 'var(--success)'  },
    orange: { bg: 'var(--warning-light)',  fg: 'var(--warning)'  },
    purple: { bg: 'var(--info-light)',     fg: 'var(--info)'     },
  }
  const c = colorMap[color] ?? colorMap.blue

  return (
    <div className="card stat-card">
      <div className="stat-card-header">
        <div>
          <div className="stat-card-label">{label}</div>
          <div className="stat-card-value" style={{ marginTop: 6 }}>{value}</div>
          {subLabel && (
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
              {subLabel}
            </div>
          )}
        </div>
        <div className="stat-card-icon" style={{ background: c.bg, color: c.fg }}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

// ─── Tooltip personalizado para los gráficos ────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-modal)',
      border: '1px solid var(--border-color)',
      borderRadius: 10,
      padding: '10px 14px',
      boxShadow: 'var(--shadow-md)',
      fontSize: 13,
    }}>
      <p style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.name === 'Ventas' ? p.value : formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { autos, ventas } = useApp()
  const { isGerente, usuarios } = useAuth()

  const autosDisponibles = autos.filter(a => a.estado === 'disponible').length
  const autosVendidos    = autos.filter(a => a.estado === 'vendido').length
  const totalVentas      = ventas.length
  const gananciaTotal    = sumBy(ventas, 'ganancia')
  const ingresoTotal     = sumBy(ventas, 'precioFinal')

  const ventasPorMes   = getVentasPorMes(ventas, 6)
  const rankingVendedores = getRankingVendedores(ventas, usuarios)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── KPIs ── */}
      <div className="stats-grid">
        <StatCard icon={ShoppingBag} label="Total de ventas"       value={totalVentas}                  color="blue" />
        <StatCard icon={Car}         label="Autos disponibles"     value={autosDisponibles}              color="green"
          subLabel={`${autosVendidos} vendidos`}
        />
        {isGerente && (
          <>
            <StatCard icon={DollarSign}  label="Ganancias totales"   value={formatCurrency(gananciaTotal)} color="orange" />
            <StatCard icon={TrendingUp}  label="Ingresos totales"    value={formatCurrency(ingresoTotal)}  color="purple" />
          </>
        )}
      </div>

      {/* ── Gráficos ── */}
      <div className={isGerente ? 'grid-2' : ''}>

        {/* Ventas por mes */}
        <div className="card card-padding">
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              Ventas por mes
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
              Últimos 6 meses
            </p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={ventasPorMes}>
              <defs>
                <linearGradient id="ventasGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="ventas"
                name="Ventas"
                stroke="var(--accent)"
                strokeWidth={2.5}
                fill="url(#ventasGrad)"
                dot={{ r: 4, fill: 'var(--accent)', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Ganancias por mes - solo gerente */}
        {isGerente && (
          <div className="card card-padding">
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                Ganancias por mes
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
                Últimos 6 meses
              </p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ventasPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="ganancias"
                  name="Ganancia"
                  fill="var(--success)"
                  radius={[6, 6, 0, 0]}
                  opacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Ranking de vendedores ── */}
      <div className="card card-padding">
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            Ranking de vendedores
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            Ordenado por cantidad de ventas
          </p>
        </div>

        {rankingVendedores.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>
            Sin ventas registradas
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rankingVendedores.map((v, i) => (
              <div key={v.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px',
                background: 'var(--bg-input)',
                borderRadius: 10,
              }}>
                {/* Posición */}
                <span style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: i === 0 ? 'var(--warning)' : i === 1 ? 'var(--text-tertiary)' : 'var(--bg-tertiary)',
                  color: i < 2 ? 'white' : 'var(--text-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, flexShrink: 0,
                }}>
                  {i + 1}
                </span>

                {/* Avatar */}
                <div className="avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
                  {getInitials(v.nombre)}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {v.nombre}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                    {v.ventas} {v.ventas === 1 ? 'venta' : 'ventas'}
                  </div>
                </div>

                {/* Comisiones - solo gerente */}
                {isGerente && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>
                      {formatCurrency(v.comision)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>comisión</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
