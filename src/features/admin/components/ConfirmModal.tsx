/**
 * ConfirmModal.tsx
 * Modal de confirmación genérico reutilizable en todo el panel admin.
 */
import { X, AlertTriangle } from 'lucide-react'

export interface ConfirmModalProps {
  title: string
  description: string
  confirmLabel: string
  confirmVariant?: 'danger' | 'success' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Cada variante define:
 *   borderColor  → el borde del botón
 *   shadowColor  → el color del box-shadow (mismo que el borde, igual que btn-primary usa primary-active)
 *   background   → fondo del botón
 *   hoverBg      → fondo en hover (tono ligeramente más oscuro, como btn-primary-hover)
 */
const VARIANTS: Record<
  'danger' | 'success' | 'warning',
  { background: string; hoverBg: string; borderColor: string; shadowColor: string; color: string }
> = {
  danger: {
    background:  'var(--color-error)',
    hoverBg:     'var(--color-error)',
    borderColor: 'var(--color-error-highlight)',
    shadowColor: 'var(--color-error-highlight)',
    color:       'white',
  },
  success: {
    background:  'var(--color-success)',
    hoverBg:     'var(--color-success-hover)',
    borderColor: 'var(--color-success-active)',
    shadowColor: 'var(--color-success-active)',
    color:       'white',
  },
  warning: {
    background:  'var(--color-gold)',
    hoverBg:     'var(--color-gold-hover)',
    borderColor: 'var(--color-gold-active)',
    shadowColor: 'var(--color-gold-active)',
    color:       'white',
  },
}

export function ConfirmModal({
  title,
  description,
  confirmLabel,
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const v = VARIANTS[confirmVariant]

  const baseStyle: React.CSSProperties = {
    background:  v.background,
    border:      `2px solid ${v.borderColor}`,
    color:       v.color,
    boxShadow:   `3px 3px 0px 0px ${v.shadowColor}`,
    transform:   'translate(0, 0)',
    transition:  'transform 90ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 90ms cubic-bezier(0.34, 1.56, 0.64, 1), background 100ms ease',
  }

  const applyHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform  = 'translate(-2px, -2px)'
    e.currentTarget.style.boxShadow  = `5px 5px 0px 0px ${v.shadowColor}`
    e.currentTarget.style.background = v.hoverBg
  }

  const removeHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform  = 'translate(0, 0)'
    e.currentTarget.style.boxShadow  = `3px 3px 0px 0px ${v.shadowColor}`
    e.currentTarget.style.background = v.background
  }

  const applyActive = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'translate(2px, 2px)'
    e.currentTarget.style.boxShadow = `1px 1px 0px 0px ${v.shadowColor}`
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--color-bg)',
          border: '2px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '6px 6px 0 var(--color-border)',
          width: '100%', maxWidth: '400px',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          padding: 'var(--space-5) var(--space-6)',
          borderBottom: '1px solid var(--color-divider)',
        }}>
          <AlertTriangle size={18} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 'var(--text-base)', color: 'var(--color-text)', flex: 1,
          }}>
            {title}
          </h2>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 'var(--space-6)' }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            {description}
          </p>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)',
          padding: 'var(--space-4) var(--space-6)',
          borderTop: '1px solid var(--color-divider)',
        }}>
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className="btn btn-sm"
            style={baseStyle}
            onMouseEnter={applyHover}
            onMouseLeave={removeHover}
            onMouseDown={applyActive}
            onMouseUp={applyHover}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
