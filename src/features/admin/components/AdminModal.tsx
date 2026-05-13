/**
 * AdminModal.tsx
 * Modal genérico del panel admin. Encapsula el patrón overlay+box+header+body+footer.
 * Cierra con ESC y click en overlay. Tamaños sm/md/lg alineados con .admin-modal-{sm,md,lg}.
 */
import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

type IconAccent = 'primary' | 'gold' | 'copper' | 'success'

export interface AdminModalProps {
  open: boolean
  size?: 'sm' | 'md' | 'lg'
  title: string
  icon?: ReactNode
  iconAccent?: IconAccent
  onClose: () => void
  footer?: ReactNode
  bodyGap?: 'md' | 'lg'
  closeDisabled?: boolean
  children: ReactNode
}

export function AdminModal({
  open,
  size = 'sm',
  title,
  icon,
  iconAccent = 'primary',
  onClose,
  footer,
  bodyGap = 'md',
  closeDisabled = false,
  children,
}: AdminModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !closeDisabled) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, closeDisabled])

  if (!open) return null

  return (
    <div
      className="overlay overlay-dark overlay-z200"
      onClick={() => { if (!closeDisabled) onClose() }}
    >
      <div
        className={`admin-modal-box admin-modal-${size}`}
        onClick={(e) => e.stopPropagation()}
      >

        <div className="admin-modal-header">
          {icon && (
            <span className={`admin-modal-header-icon admin-modal-header-icon--${iconAccent}`}>
              {icon}
            </span>
          )}
          <h2 className="admin-modal-title">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            disabled={closeDisabled}
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <div className={`admin-modal-body${bodyGap === 'lg' ? ' admin-modal-body--gap5' : ''}`}>
          {children}
        </div>

        {footer && <div className="admin-modal-footer">{footer}</div>}

      </div>
    </div>
  )
}
