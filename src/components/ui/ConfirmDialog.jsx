import React from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'

/**
 * Diálogo de confirmación reutilizable.
 * Props:
 *   open    - boolean
 *   onClose - función
 *   onConfirm - función
 *   title   - string
 *   message - string
 *   danger  - boolean (estilo rojo)
 */
export default function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = true }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title || 'Confirmar acción'}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => { onConfirm(); onClose() }}
          >
            Confirmar
          </button>
        </>
      }
    >
      <div className="flex items-center gap-3">
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: danger ? 'var(--danger-light)' : 'var(--accent-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: danger ? 'var(--danger)' : 'var(--accent)',
        }}>
          <AlertTriangle size={20} />
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {message || '¿Estás seguro de que querés continuar con esta acción?'}
        </p>
      </div>
    </Modal>
  )
}
