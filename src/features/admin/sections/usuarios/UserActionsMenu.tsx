/**
 * UserActionsMenu.tsx
 * Dropdown reutilizable con las acciones de admin sobre un usuario.
 * Se usa tanto en la fila de la lista (icon-btn ⋯) como en la barra del
 * detalle. Las acciones que generan link (reset / resend) muestran el link
 * en un AlertModal para que el admin lo copie. Las destructivas
 * (ban/delete) pasan por ConfirmModal.
 *
 * El padre maneja el refetch tras la acción.
 */
import { useState, useRef, useEffect } from 'react'
import { MoreVertical, Crown, User, MailCheck, KeyRound, Ban, ShieldCheck, Trash2, Eye } from 'lucide-react'
import { ConfirmModal } from '../../components/ConfirmModal'
import { AdminModal } from '../../components/AdminModal'
import { adminPost } from '../../hooks/useAdminFetch'
import { useAdminDev } from '../../hooks/useAdminDev'
import type { Plan, UserProfile } from './types'

interface Props {
  user: UserProfile
  /** Modo de presentación: 'menu' = dropdown compacto (lista) | 'bar' = botones visibles (detalle). */
  variant?: 'menu' | 'bar'
  /** Si está presente, el menú incluye "Ver detalle" como primera opción. */
  onOpenDetail?: () => void
  /** Llamado después de cualquier acción exitosa (refetch). */
  onChanged: () => void
}

type AsyncAction =
  | { kind: 'set-plan';            plan: Plan }
  | { kind: 'resend-confirmation' }
  | { kind: 'reset-password' }
  | { kind: 'ban' }
  | { kind: 'unban' }
  | { kind: 'delete' }

export function UserActionsMenu({ user, variant = 'menu', onOpenDetail, onChanged }: Props) {
  const dev = useAdminDev()
  const [open, setOpen]         = useState(false)
  const [confirm, setConfirm]   = useState<AsyncAction | null>(null)
  const [linkResult, setLinkResult] = useState<{ title: string; link: string } | null>(null)
  const [busy, setBusy]         = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const isPremium = user.plan === 'premium'
  const isBanned  = !!user.banned_until && new Date(user.banned_until).getTime() > Date.now()

  /* Cerrar dropdown al hacer click fuera */
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onDoc)
    return () => window.removeEventListener('mousedown', onDoc)
  }, [open])

  const runAction = async (action: AsyncAction) => {
    setBusy(true)
    const body = action.kind === 'set-plan'
      ? { id: user.id, action: 'set-plan', plan: action.plan }
      : { id: user.id, action: action.kind }
    const res = await adminPost<{ ok: boolean; link?: string | null }>(
      '/functions/v1/admin-user-actions',
      body,
    )
    setBusy(false)
    setConfirm(null)
    if (!res.ok) {
      alert(res.error ?? 'No se pudo completar la acción')
      return
    }
    if (action.kind === 'resend-confirmation' || action.kind === 'reset-password') {
      const link = res.data?.link ?? ''
      setLinkResult({
        title: action.kind === 'resend-confirmation' ? 'Enlace de confirmación' : 'Enlace de recuperación',
        link,
      })
    }
    onChanged()
  }

  const confirmTexts: Record<AsyncAction['kind'], { title: string; description: string; confirmLabel: string; variant: 'danger' | 'warning' | 'success' }> = {
    'set-plan': {
      title: 'Cambiar plan',
      description: '¿Confirmas el cambio de plan?',
      confirmLabel: 'Sí, cambiar',
      variant: 'warning',
    },
    'resend-confirmation': {
      title: 'Reenviar confirmación',
      description: 'Se generará un nuevo enlace para que el usuario confirme su cuenta. Cópialo y envíaselo.',
      confirmLabel: 'Generar enlace',
      variant: 'warning',
    },
    'reset-password': {
      title: 'Resetear contraseña',
      description: 'Se generará un enlace de recuperación para que el usuario establezca una contraseña nueva.',
      confirmLabel: 'Generar enlace',
      variant: 'warning',
    },
    'ban': {
      title: 'Suspender usuario',
      description: 'El usuario no podrá iniciar sesión hasta que lo reactives. Puede mantenerse 1 año por defecto.',
      confirmLabel: 'Sí, suspender',
      variant: 'danger',
    },
    'unban': {
      title: 'Reactivar usuario',
      description: '¿Reactivar el acceso del usuario? Volverá a poder iniciar sesión.',
      confirmLabel: 'Sí, reactivar',
      variant: 'success',
    },
    'delete': {
      title: `Eliminar ${user.email}`,
      description: 'Borra al usuario y TODOS sus datos (facturas, presupuestos, contratos, NDAs, reclamaciones, empresa…). Esta acción no se puede deshacer.',
      confirmLabel: 'Sí, eliminar',
      variant: 'danger',
    },
  }

  /* Items del menú */
  const items = [
    onOpenDetail && { id: 'detail',  label: 'Ver detalle',                    Icon: Eye,         onClick: () => { onOpenDetail(); setOpen(false) } },
    {
      id: 'set-plan',
      label: isPremium ? 'Cambiar a Free' : 'Cambiar a Premium',
      Icon: isPremium ? User : Crown,
      onClick: () => { setOpen(false); setConfirm({ kind: 'set-plan', plan: isPremium ? 'free' : 'premium' }) },
    },
    { id: 'resend',  label: 'Reenviar confirmación',  Icon: MailCheck, onClick: () => { setOpen(false); setConfirm({ kind: 'resend-confirmation' }) } },
    { id: 'reset',   label: 'Resetear contraseña',    Icon: KeyRound,  onClick: () => { setOpen(false); setConfirm({ kind: 'reset-password' }) } },
    isBanned
      ? { id: 'unban', label: 'Reactivar usuario',  Icon: ShieldCheck, onClick: () => { setOpen(false); setConfirm({ kind: 'unban' }) } }
      : { id: 'ban',   label: 'Suspender usuario',  Icon: Ban,         onClick: () => { setOpen(false); setConfirm({ kind: 'ban' }) } },
    dev && { id: 'delete', label: 'Eliminar usuario', Icon: Trash2, danger: true, onClick: () => { setOpen(false); setConfirm({ kind: 'delete' }) } },
  ].filter(Boolean) as Array<{ id: string; label: string; Icon: React.ElementType; onClick: () => void; danger?: boolean }>

  /* Render */
  return (
    <>
      {variant === 'bar' ? (
        <div className="user-actions-bar">
          {items.map(it => (
            <button
              key={it.id}
              onClick={it.onClick}
              className={`btn btn-sm ${it.danger ? 'btn-danger' : 'btn-secondary'}`}
              disabled={busy}
            >
              <it.Icon size={13} /> {it.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="user-actions-menu-wrap" ref={wrapRef} onClick={e => e.stopPropagation()}>
          <button
            className="icon-btn"
            onClick={() => setOpen(o => !o)}
            aria-label="Acciones de usuario"
            disabled={busy}
          >
            <MoreVertical size={14} />
          </button>
          {open && (
            <div className="user-actions-menu">
              {items.map(it => (
                <button
                  key={it.id}
                  onClick={it.onClick}
                  className={`user-actions-menu-item${it.danger ? ' user-actions-menu-item--danger' : ''}`}
                >
                  <it.Icon size={13} /> {it.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {confirm && (() => {
        const t = confirmTexts[confirm.kind]
        return (
          <ConfirmModal
            title={t.title}
            description={t.description}
            confirmLabel={t.confirmLabel}
            confirmVariant={t.variant}
            onConfirm={() => { void runAction(confirm) }}
            onCancel={() => setConfirm(null)}
          />
        )
      })()}

      {linkResult && (
        <AdminModal
          open
          size="lg"
          title={linkResult.title}
          onClose={() => setLinkResult(null)}
          footer={
            <button className="btn btn-primary btn-sm" onClick={() => setLinkResult(null)}>Cerrar</button>
          }
        >
          <p className="modal-body-text">Copia este enlace y envíaselo al usuario:</p>
          <div className="code-box">
            <pre style={{ wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>{linkResult.link}</pre>
            <button
              onClick={() => { void navigator.clipboard.writeText(linkResult.link) }}
              className="code-box-copy"
            >
              Copiar
            </button>
          </div>
        </AdminModal>
      )}
    </>
  )
}
