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
    hoverBg:     'var(--color-success)',
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

  return (
    <div className="overlay overlay-dark overlay-z200">
      <div className="admin-modal-box admin-modal-sm">

        <div className="admin-modal-header">
          <AlertTriangle size={18} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
          <h2 className="admin-modal-title">{title}</h2>
          <button onClick={onCancel} className="modal-close-btn">
            <X size={16} />
          </button>
        </div>

        <div className="admin-modal-body">
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            {description}
          </p>
        </div>

        <div className="admin-modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className="btn btn-sm btn-confirm"
            style={{
              '--confirm-bg':       v.background,
              '--confirm-hover-bg': v.hoverBg,
              '--confirm-border':   v.borderColor,
              '--confirm-shadow':   v.shadowColor,
              '--confirm-color':    v.color,
            } as React.CSSProperties}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  )
}
