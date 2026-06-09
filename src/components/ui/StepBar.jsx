import React from 'react'
import { Check } from 'lucide-react'

export default function StepBar({ step, steps, onStepClick }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 24 }}>
      {steps.map((label, i) => {
        const n = i + 1
        const done = n < step
        const active = n === step
        const clickable = onStepClick && n < step
        return (
          <React.Fragment key={n}>
            <div
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, flex: 1,
                cursor: clickable ? 'pointer' : 'default',
              }}
              onClick={() => clickable && onStepClick(n)}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? 'var(--success)' : active ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: (done || active) ? '#fff' : 'var(--text-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                boxShadow: active ? '0 0 0 4px var(--accent-light)' : 'none',
                transition: 'all 0.2s ease',
              }}>
                {done ? <Check size={13} strokeWidth={2.5} /> : n}
              </div>
              <span style={{
                fontSize: 10, fontWeight: active ? 600 : 400,
                color: active ? 'var(--accent)' : done ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                whiteSpace: 'nowrap', letterSpacing: '0.2px',
              }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginTop: 13, maxWidth: 40,
                background: done ? 'var(--success)' : 'var(--divider)',
                transition: 'background 0.3s ease',
              }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
