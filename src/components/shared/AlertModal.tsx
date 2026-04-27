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
    <div className="auth-modal-overlay" role="dialog" aria-modal="true">
      <div className="auth-modal" style={{ maxWidth: 420 }}>
        <button className="auth-modal__close" onClick={onCancel ?? onConfirm} aria-label="Cerrar">
          <X size={18} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {(title || variant) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              {VARIANT_ICON[variant]}
              {title && (
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)' }}>
                  {title}
                </h3>
              )}
            </div>
          )}

          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            {message}
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            {cancelLabel && onCancel && (
              <button className="btn btn-secondary btn-sm" onClick={onCancel}>
                {cancelLabel}
              </button>
            )}
            <button
              className={`btn btn-sm ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
