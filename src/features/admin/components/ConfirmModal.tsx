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

// Estilos base por variante (estado reposo: shadow visible)
const VARIANT_BASE: Record<string, React.CSSProperties> = {
  danger: {
    background:  'var(--color-error)',
    border:      '2px solid var(--color-error)',
    color:       'white',
    boxShadow:   '3px 3px 0 var(--color-error-highlight)',
    transform:   'translate(0, 0)',
    transition:  'transform 120ms ease, box-shadow 120ms ease',
  },
  success: {
    background:  'var(--color-success)',
    border:      '2px solid var(--color-success-active)',
    color:       'white',
    boxShadow:   '3px 3px 0 var(--color-success-active)',
    transform:   'translate(0, 0)',
    transition:  'transform 120ms ease, box-shadow 120ms ease',
  },
  warning: {
    background:  'var(--color-gold)',
    border:      '2px solid var(--color-gold-active)',
    color:       'white',
    boxShadow:   '3px 3px 0 var(--color-gold-active)',
    transform:   'translate(0, 0)',
    transition:  'transform 120ms ease, box-shadow 120ms ease',
  },
}

// Hover: sube 3px y elimina el shadow (mismo efecto que btn-secondary)
const VARIANT_HOVER: Record<string, React.CSSProperties> = {
  danger:  { boxShadow: 'none', transform: 'translate(-1px, -2px)' },
  success: { boxShadow: 'none', transform: 'translate(-1px, -2px)' },
  warning: { boxShadow: 'none', transform: 'translate(-1px, -2px)' },
}

export function ConfirmModal({
  title,
  description,
  confirmLabel,
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const baseStyle  = VARIANT_BASE[confirmVariant]
  const hoverStyle = VARIANT_HOVER[confirmVariant]

  const applyHover   = (e: React.MouseEvent<HTMLButtonElement>) =>
    Object.assign(e.currentTarget.style, hoverStyle)
  const removeHover  = (e: React.MouseEvent<HTMLButtonElement>) =>
    Object.assign(e.currentTarget.style, { boxShadow: baseStyle.boxShadow as string, transform: 'translate(0, 0)' })

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
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
