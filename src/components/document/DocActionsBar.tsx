/**
 * DocActionsBar
 * Barra de acciones de un documento (factura, presupuesto, albarán, contrato, NDA…).
 *
 * En desktop (>1024px) renderiza los items como botones inline.
 * En móvil/tablet (≤1024px) renderiza un único botón "Opciones ⋯" que abre un
 * dropdown portalizado con la lista completa, así nunca se sale del viewport.
 *
 * Patrón obligatorio para la barra superior de cualquier vista de detalle
 * que tenga 3 o más acciones (ver AGENTS.md → Responsive).
 */
import { createPortal } from 'react-dom'
import { MoreHorizontal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Button } from '../ui/Button'
import { useDropdownPosition } from '../../hooks/useDropdownPosition'

export interface DocAction {
  id: string
  label: string
  Icon?: LucideIcon
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'success' | 'danger'
  disabled?: boolean
  loading?: boolean
  loadingLabel?: string
  hidden?: boolean
  /** Tooltip nativo (HTML title) — útil para explicar por qué está disabled. */
  title?: string
}

interface DocActionsBarProps {
  actions: DocAction[]
  /** Texto del botón colapsado en móvil. Por defecto "Opciones". */
  mobileLabel?: string
}

export function DocActionsBar({ actions, mobileLabel = 'Opciones' }: DocActionsBarProps) {
  const visible = actions.filter(a => !a.hidden)
  const dd = useDropdownPosition()

  if (visible.length === 0) return null

  return (
    <>
      {/* Inline (desktop) */}
      <div className="doc-actions-inline">
        {visible.map(a => (
          <Button
            key={a.id}
            variant={a.variant === 'success' ? 'primary' : (a.variant ?? 'secondary')}
            size="sm"
            type="button"
            onClick={a.onClick}
            disabled={a.disabled || a.loading}
            title={a.title}
            className={a.variant === 'success' ? 'btn-success' : undefined}
          >
            {a.Icon && <a.Icon size={14} />}
            {a.loading && a.loadingLabel ? a.loadingLabel : a.label}
          </Button>
        ))}
      </div>

      {/* Dropdown (móvil/tablet) */}
      <div className="doc-actions-mobile">
        <button
          ref={dd.buttonRef}
          type="button"
          className="btn btn-secondary btn-sm doc-actions-trigger"
          onClick={dd.toggle}
          aria-haspopup="menu"
          aria-expanded={dd.open}
          aria-label={mobileLabel}
        >
          <MoreHorizontal size={14} />
          <span>{mobileLabel}</span>
        </button>
        {dd.open && dd.position && createPortal(
          <div ref={dd.menuRef} className="dropdown-menu" style={dd.menuStyle} role="menu">
            {visible.map(a => (
              <button
                key={a.id}
                type="button"
                role="menuitem"
                className={`dropdown-item${a.variant === 'danger' ? ' dropdown-item--danger' : ''}`}
                disabled={a.disabled || a.loading}
                title={a.title}
                onClick={() => {
                  dd.close()
                  a.onClick()
                }}
              >
                {a.Icon && <a.Icon size={13} />}
                {a.loading && a.loadingLabel ? a.loadingLabel : a.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
      </div>
    </>
  )
}
