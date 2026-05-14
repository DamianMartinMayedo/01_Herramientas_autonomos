/**
 * UsuarioDetail.tsx
 * Vista detallada de un usuario: KPIs, datos de cuenta y empresa, acciones
 * admin y tabs con todos los tipos de documento. Lee de admin-user-detail.
 */
import { useState } from 'react'
import { ArrowLeft, Calendar, Crown, FileText, LogIn, Euro, Clock, Copy, Check, MailCheck, MailX, ShieldOff } from 'lucide-react'
import { useAdminFetch } from '../../hooks/useAdminFetch'
import { UserActionsMenu } from './UserActionsMenu'
import { EmpresaInfo } from './EmpresaInfo'
import { DocumentosTabs } from './DocumentosTabs'
import type { UserDetailPayload, UserProfile } from './types'

interface Props {
  user: UserProfile
  onBack: () => void
  onUserChanged: () => void
}

function relative(iso: string | null | undefined) {
  if (!iso) return 'Nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Ahora'
  if (m < 60) return `Hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `Hace ${d}d`
  return new Date(iso).toLocaleDateString('es-ES')
}

function fmtEuros(n: number) {
  return `${n.toLocaleString('es-ES', { maximumFractionDigits: 0 })}€`
}

function CopyableId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    void navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} className="user-data-id" title="Copiar ID">
      <code className="font-mono">{id.slice(0, 8)}…{id.slice(-4)}</code>
      {copied ? <Check size={11} className="text-success" /> : <Copy size={11} />}
    </button>
  )
}

export function UsuarioDetail({ user, onBack, onUserChanged }: Props) {
  const { data, loading, error, refetch } = useAdminFetch<UserDetailPayload>(
    `/functions/v1/admin-user-detail?id=${encodeURIComponent(user.id)}`,
    { transform: (raw) => raw as UserDetailPayload },
  )

  const handleChanged = () => {
    void refetch()
    onUserChanged()
  }

  const handleDeleted = () => {
    onUserChanged()
    onBack()
  }

  if (loading) {
    return (
      <div className="section-stack">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="icon-btn" aria-label="Volver"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="section-title">Detalle de usuario</h1>
            <p className="section-sub">{user.email}</p>
          </div>
        </div>
        <div className="empty-state"><p className="empty-state-text">Cargando…</p></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="section-stack">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="icon-btn" aria-label="Volver"><ArrowLeft size={18} /></button>
          <h1 className="section-title">Detalle de usuario</h1>
        </div>
        <div className="error-box"><span>{error ?? 'No se pudo cargar el usuario'}</span></div>
      </div>
    )
  }

  const { profile, auth, empresa, counts, totales_facturas } = data
  const isPremium = profile.plan === 'premium'
  // eslint-disable-next-line react-hooks/purity
  const isBanned  = !!auth.banned_until && new Date(auth.banned_until).getTime() > Date.now()

  return (
    <div className="section-stack">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="icon-btn" aria-label="Volver">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="section-title">{profile.email}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge ${isPremium ? 'badge-gold' : 'badge-muted'}`}>
              {isPremium ? <><Crown size={9} /> Premium</> : 'Free'}
            </span>
            {isBanned && <span className="badge badge-error"><ShieldOff size={9} /> Suspendido</span>}
            <CopyableId id={profile.id} />
          </div>
        </div>
      </div>

      {/* Barra de acciones */}
      <UserActionsMenu
        user={{ ...user, plan: profile.plan, banned_until: auth.banned_until }}
        variant="bar"
        onChanged={handleChanged}
        onDeleted={handleDeleted}
      />

      {/* KPIs */}
      <div className="kpi-fit-grid card">
        <KpiItem Icon={Crown}    color="gold"    label="Plan"              value={isPremium ? 'Premium' : 'Free'} />
        <KpiItem Icon={Calendar} color="primary" label="Registro"          value={new Date(profile.created_at).toLocaleDateString('es-ES')} />
        <KpiItem Icon={LogIn}    color="primary" label="Último login"      value={relative(auth.last_sign_in_at)} />
        <KpiItem Icon={FileText} color="copper"  label="Total documentos"  value={counts.total} />
        <KpiItem Icon={Euro}     color="success" label="Ingresos cobrados" value={fmtEuros(totales_facturas.ingresos_cobrados)} />
        <KpiItem Icon={Clock}    color="copper"  label="Pendiente cobro"   value={fmtEuros(totales_facturas.pendiente_cobro)} />
      </div>

      {/* Dos columnas: Cuenta + Empresa */}
      <div className="overview-grid-2">
        <div>
          <p className="section-block-label">Cuenta</p>
          <div className="card">
            <div className="user-data-row">
              <span className="user-data-label">Email</span>
              <span className="user-data-value">{profile.email}</span>
            </div>
            <div className="user-data-row">
              <span className="user-data-label">Email confirmado</span>
              <span className="user-data-value">
                {auth.email_confirmed_at
                  ? <><MailCheck size={13} className="text-success" /> Sí</>
                  : <><MailX size={13} className="text-error" /> No</>
                }
              </span>
            </div>
            {isBanned && (
              <div className="user-data-row">
                <span className="user-data-label">Suspensión</span>
                <span className="user-data-value">Hasta {new Date(auth.banned_until!).toLocaleDateString('es-ES')}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <p className="section-block-label">Empresa</p>
          <EmpresaInfo empresa={empresa} />
        </div>
      </div>

      {/* Documentos */}
      <div>
        <p className="section-block-label">Documentos del usuario</p>
        <DocumentosTabs data={data} onChanged={handleChanged} />
      </div>
    </div>
  )
}

/* ── KPI inline ─────────────────────────────────────────── */

function KpiItem({ Icon, color, label, value }: { Icon: React.ElementType; color: 'primary' | 'success' | 'copper' | 'gold'; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-4">
      <div className={`kpi-icon-circle kpi-icon-circle--${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="kpi-meta-label">{label}</p>
        <p className="kpi-meta-value">{value}</p>
      </div>
    </div>
  )
}
