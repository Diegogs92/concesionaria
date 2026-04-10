import React from 'react'

/**
 * Badge de estado.
 * variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'accent'
 */
export default function Badge({ children, variant = 'neutral', dot = false }) {
  return (
    <span className={`badge badge-${variant}`}>
      {dot && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'currentColor', display: 'inline-block',
        }} />
      )}
      {children}
    </span>
  )
}

export function AutoEstadoBadge({ estado }) {
  return estado === 'disponible'
    ? <Badge variant="success" dot>Disponible</Badge>
    : <Badge variant="neutral" dot>Vendido</Badge>
}

export function RolBadge({ rol }) {
  return rol === 'gerente'
    ? <Badge variant="accent">Gerente</Badge>
    : <Badge variant="neutral">Empleado</Badge>
}

export function TipoPagoBadge({ tipo }) {
  return tipo === 'contado'
    ? <Badge variant="success">Contado</Badge>
    : <Badge variant="info">Financiado</Badge>
}
