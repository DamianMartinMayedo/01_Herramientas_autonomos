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

const VARIANT_CLASS: Record<'danger' | 'success' | 'warning', string> = {
  danger:  'btn-danger',
  success: 'btn-success',
  warning: 'btn-warning',
}

export function ConfirmModal({
  title,
  description,
  confirmLabel,
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="overlay overlay-dark overlay-z200">
      <div className="admin-modal-box admin-modal-sm">

        <div className="admin-modal-header">
          <AlertTriangle size={18} className="admin-modal-header-icon admin-modal-header-icon--gold" />
          <h2 className="admin-modal-title">{title}</h2>
          <button onClick={onCancel} className="modal-close-btn" aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        <div className="admin-modal-body">
          <p className="modal-body-text">{description}</p>
        </div>

        <div className="admin-modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className={`btn btn-sm ${VARIANT_CLASS[confirmVariant]}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>

      </div>
    </div>
  )
}
