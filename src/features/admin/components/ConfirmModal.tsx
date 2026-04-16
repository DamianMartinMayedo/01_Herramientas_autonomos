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

export function ConfirmModal({
  title,
  description,
  confirmLabel,
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    danger: {
      background: 'var(--color-error)',
      borderColor: 'var(--color-error)',
      color: 'white',
      boxShadow: '3px 3px 0 var(--color-error-highlight)',
    },
    success: {
      background: 'var(--color-success)',
      borderColor: 'var(--color-success-active)',
      color: 'white',
      boxShadow: '3px 3px 0 var(--color-success-active)',
    },
    warning: {
      background: 'var(--color-gold)',
      borderColor: 'var(--color-gold-active)',
      color: 'white',
      boxShadow: '3px 3px 0 var(--color-gold-active)',
    },
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
            style={variantStyles[confirmVariant]}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
