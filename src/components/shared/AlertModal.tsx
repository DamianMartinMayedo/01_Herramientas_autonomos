/**
 * AlertModal.tsx
 * Modal de alerta y confirmación que reemplaza alert() y confirm() del sistema.
 * Usa el mismo estilo visual que el modal de autenticación.
 */
import { useEffect } from 'react'
import { AlertTriangle, Info, X } from 'lucide-react'

interface AlertModalProps {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel?: () => void
  variant?: 'danger' | 'warning' | 'info'
}

const VARIANT_ICON: Record<NonNullable<AlertModalProps['variant']>, React.ReactNode> = {
  danger:  <AlertTriangle size={20} style={{ color: 'var(--color-error)' }} />,
  warning: <AlertTriangle size={20} style={{ color: 'var(--color-gold)' }} />,
  info:    <Info size={20} style={{ color: 'var(--color-primary)' }} />,
}

export function AlertModal({
  title,
  message,
  confirmLabel = 'Aceptar',
  cancelLabel,
  onConfirm,
  onCancel,
  variant = 'info',
}: AlertModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') (onCancel ?? onConfirm)()
      if (e.key === 'Enter') onConfirm()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onConfirm, onCancel])

  return (
    <div className="overlay overlay-dark overlay-z200" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && (onCancel ?? onConfirm)()}>
      <div className="admin-modal-box admin-modal-sm">
        <div className="admin-modal-header">
          {VARIANT_ICON[variant]}
          {title && (
            <h2 className="admin-modal-title">{title}</h2>
          )}
          <button className="modal-close-btn" onClick={onCancel ?? onConfirm} aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        <div className="admin-modal-body">
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            {message}
          </p>
        </div>

        <div className="admin-modal-footer">
          {cancelLabel && onCancel && (
            <button className="btn btn-secondary btn-sm" onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          <button
            className={`btn btn-sm ${variant === 'danger' || variant === 'warning' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
