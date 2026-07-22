import React from 'react'
import { Check } from 'lucide-react'

export default function StepBar({ step, steps, onStepClick }) {
  return (
    <div className="step-bar">
      {steps.map((label, i) => {
        const n = i + 1
        const done = n < step
        const active = n === step
        const clickable = onStepClick && n < step
        return (
          <React.Fragment key={n}>
            <div
              className="step-bar-item"
              style={{ cursor: clickable ? 'pointer' : 'default' }}
              onClick={() => clickable && onStepClick(n)}
            >
              <div className="step-bar-circle" style={{
                background: done ? 'var(--success)' : active ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: (done || active) ? '#fff' : 'var(--text-tertiary)',
                boxShadow: active ? '0 0 0 4px var(--accent-light)' : 'none',
              }}>
                {done ? <Check size={13} strokeWidth={2.5} /> : n}
              </div>
              <span className="step-bar-label" style={{
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--accent)' : done ? 'var(--text-secondary)' : 'var(--text-tertiary)',
              }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="step-bar-connector" style={{
                background: done ? 'var(--success)' : 'var(--divider)',
              }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
