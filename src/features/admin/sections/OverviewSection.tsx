/**
 * OverviewSection.tsx
 * Dashboard del admin: métricas globales de Supabase (usuarios, documentos,
 * facturas, blog), atajos a otras secciones, top usuarios y un panel de
 * actividad del propio dispositivo (eventos locales).
 */
import { useMemo } from 'react'
import { useAdminStore } from '../../../store/adminStore'
import { useHerramientas } from '../../../hooks/useHerramientas'
import { useAdminFetch } from '../hooks/useAdminFetch'
import type { AdminSection } from '../AdminLayout'
import {
  Activity, Wrench, FileText, Users, UserPlus, Crown, Receipt, Euro, Clock,
  ArrowRight, FilePlus2, FileSignature, ShieldOff, AlertCircle, Package, Loader2,
} from 'lucide-react'

/* ── Tipos del payload de la edge function admin-stats ──────────────── */
interface StatsPayload {
  users: { total: number; premium: number; free: number; new_7d: number }
  documents: {
    total: number
    facturas: number
    presupuestos: number
    albaranes: number
    contratos: number
    ndas: number
    reclamaciones: number
  }
  facturas: { emitidas: number; cobradas: number; ingresos_cobrados: number; pendiente_cobro: number }
  posts: { total: number; published: number; draft: number }
  top_users: Array<{ id: string; email: string; plan: 'free' | 'premium'; documents: number }>
}

/* ── KPI Card ───────────────────────────────────────────────────────── */
type Accent = 'primary' | 'success' | 'copper' | 'gold'

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent?: Accent
  loading?: boolean
}

function KpiCard({ label, value, sub, icon: Icon, accent = 'primary', loading }: KpiCardProps) {
  return (
    <div className="card flex flex-col gap-4">
      <div className={`icon-box icon-box-md icon-box--${accent}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{loading ? '—' : value}</p>
        {sub && <p className="stat-sub">{sub}</p>}
      </div>
    </div>
  )
}

/* ── Helpers ────────────────────────────────────────────────────────── */
function formatEuros(n: number) {
  return `${n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Ahora'
  if (m < 60) return `Hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  return `Hace ${Math.floor(h / 24)}d`
}

function EventBadge({ tipo }: { tipo: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pageview:               { label: 'Visita',        cls: 'badge-muted' },
    tool_use:               { label: 'Herramienta',   cls: 'badge-primary' },
    pdf_export:             { label: 'PDF exportado', cls: 'badge-success' },
    presupuesto_to_factura: { label: '→ Factura',     cls: 'badge-copper' },
  }
  const { label, cls } = map[tipo] ?? { label: tipo, cls: 'badge-muted' }
  return <span className={`badge ${cls}`}>{label}</span>
}

/* ── Documentos por tipo (barras horizontales) ──────────────────────── */
const DOC_META: { key: keyof StatsPayload['documents']; label: string; Icon: React.ElementType; accent: Accent }[] = [
  { key: 'facturas',      label: 'Facturas',      Icon: Receipt,       accent: 'primary' },
  { key: 'presupuestos',  label: 'Presupuestos',  Icon: FileText,      accent: 'success' },
  { key: 'albaranes',     label: 'Albaranes',     Icon: Package,       accent: 'gold' },
  { key: 'contratos',     label: 'Contratos',     Icon: FileSignature, accent: 'success' },
  { key: 'ndas',          label: 'NDAs',          Icon: ShieldOff,     accent: 'primary' },
  { key: 'reclamaciones', label: 'Reclamaciones', Icon: AlertCircle,   accent: 'copper' },
]

interface DocsProps { docs: StatsPayload['documents'] | null }

function DocumentosPorTipo({ docs }: DocsProps) {
  if (!docs) return null
  const max = Math.max(1, ...DOC_META.map(d => docs[d.key]))
  return (
    <div className="flex flex-col gap-2">
      {DOC_META.map(({ key, label, Icon, accent }) => {
        const value = docs[key]
        const pct = Math.round((value / max) * 100)
        return (
          <div key={key} className="row-item usage-row">
            <div className="usage-row-label">
              <Icon size={13} className={`shrink-0 text-${accent === 'gold' ? 'gold' : accent}`} />
              <span className="usage-row-name">{label}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill progress-bar-fill--active" style={{ width: `${pct}%` }} />
            </div>
            <span className="usage-row-count">{value}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ── Top usuarios ───────────────────────────────────────────────────── */
function TopUsuarios({ users, onNav }: { users: StatsPayload['top_users']; onNav: (s: AdminSection) => void }) {
  if (users.length === 0) {
    return (
      <div className="empty-state">
        <Users size={24} className="empty-state-icon" />
        <p className="empty-state-text">Aún no hay usuarios con documentos.</p>
      </div>
    )
  }
  return (
    <div className="card card-no-pad">
      <table className="data-table data-table--responsive">
        <thead>
          <tr className="data-thead-row">
            <th className="data-th">Usuario</th>
            <th className="data-th">Plan</th>
            <th className="data-th-right">Documentos</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="data-tr" onClick={() => onNav('usuarios')} style={{ cursor: 'pointer' }}>
              <td className="data-td data-td--bold">{u.email}</td>
              <td className="data-td">
                <span className={`badge ${u.plan === 'premium' ? 'badge-gold' : 'badge-muted'}`}>
                  {u.plan === 'premium' ? <><Crown size={9} /> Premium</> : 'Free'}
                </span>
              </td>
              <td className="data-td-right data-td--bold">{u.documents}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── Section ────────────────────────────────────────────────────────── */
interface Props {
  onNav: (section: AdminSection) => void
}

export function OverviewSection({ onNav }: Props) {
  const { data: stats, loading: statsLoading } = useAdminFetch<StatsPayload>(
    '/functions/v1/admin-stats',
    { transform: (raw) => raw as StatsPayload },
  )
  const { data: herramientas } = useHerramientas()
  const events                 = useAdminStore((s) => s.events)

  const recentEvents = events.slice(0, 10)
  const h24Ago = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 1); return d }, [])
  const eventos24h = events.filter(e => new Date(e.timestamp) > h24Ago).length

  const activasCount = herramientas.filter(h => h.estado === 'active').length

  return (
    <div className="section-stack">

      <div className="admin-section-header">
        <div>
          <h1 className="section-title">Resumen general</h1>
          <p className="section-sub">Métricas globales de la plataforma en tiempo real</p>
        </div>
        <div className="overview-quick-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => onNav('blog')}>
            <FilePlus2 size={14} /> Nuevo post
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNav('herramientas')}>
            <Wrench size={14} /> Herramientas
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNav('usuarios')}>
            <Users size={14} /> Ver usuarios
          </button>
        </div>
      </div>

      {/* KPIs — globales (Supabase) */}
      <div className="kpi-grid">
        <KpiCard
          label="Usuarios totales"
          value={stats?.users.total ?? 0}
          sub={stats ? `${stats.users.premium} premium · ${stats.users.free} free` : undefined}
          icon={Users}
          accent="primary"
          loading={statsLoading}
        />
        <KpiCard
          label="Nuevos (7d)"
          value={stats?.users.new_7d ?? 0}
          sub="registros última semana"
          icon={UserPlus}
          accent="success"
          loading={statsLoading}
        />
        <KpiCard
          label="Documentos creados"
          value={stats?.documents.total ?? 0}
          sub="todos los usuarios"
          icon={FileText}
          accent="copper"
          loading={statsLoading}
        />
        <KpiCard
          label="Facturas emitidas"
          value={stats?.facturas.emitidas ?? 0}
          sub={stats ? `${stats.facturas.cobradas} cobradas` : undefined}
          icon={Receipt}
          accent="primary"
          loading={statsLoading}
        />
        <KpiCard
          label="Ingresos cobrados"
          value={stats ? formatEuros(stats.facturas.ingresos_cobrados) : 0}
          sub={stats ? `${formatEuros(stats.facturas.pendiente_cobro)} pendientes` : undefined}
          icon={Euro}
          accent="success"
          loading={statsLoading}
        />
        <KpiCard
          label="Herramientas activas"
          value={`${activasCount}/${herramientas.length}`}
          sub="activas en el catálogo"
          icon={Wrench}
          accent="gold"
        />
        <KpiCard
          label="Posts publicados"
          value={stats?.posts.published ?? 0}
          sub={stats ? `${stats.posts.draft} en borrador` : undefined}
          icon={FileText}
          accent="primary"
          loading={statsLoading}
        />
        <KpiCard
          label="Eventos 24h"
          value={eventos24h}
          sub="este dispositivo"
          icon={Activity}
          accent="copper"
        />
      </div>

      {/* Dos columnas: Documentos por tipo + Top usuarios */}
      <div className="overview-grid-2">
        <div>
          <p className="section-block-label">Documentos por tipo</p>
          {statsLoading
            ? (
              <div className="empty-state">
                <Loader2 size={20} className="spin empty-state-icon text-primary" />
                <p className="empty-state-text">Cargando métricas…</p>
              </div>
            )
            : <DocumentosPorTipo docs={stats?.documents ?? null} />
          }
        </div>

        <div>
          <div className="overview-block-header">
            <p className="section-block-label">Top usuarios</p>
            <button className="btn-link-sm" onClick={() => onNav('usuarios')}>
              Ver todos <ArrowRight size={12} />
            </button>
          </div>
          {statsLoading
            ? (
              <div className="empty-state">
                <Loader2 size={20} className="spin empty-state-icon text-primary" />
                <p className="empty-state-text">Cargando usuarios…</p>
              </div>
            )
            : <TopUsuarios users={stats?.top_users ?? []} onNav={onNav} />
          }
        </div>
      </div>

      {/* Actividad reciente (device) */}
      <div>
        <div className="overview-block-header">
          <p className="section-block-label">Actividad reciente</p>
          <span className="section-block-hint">Este dispositivo</span>
        </div>
        {recentEvents.length === 0 ? (
          <div className="empty-state">
            <Activity size={24} className="empty-state-icon" />
            <p className="empty-state-text">
              Sin eventos registrados aún.<br />
              Los eventos se generan automáticamente cuando los usuarios usan la app en este dispositivo.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {recentEvents.map(ev => (
              <div key={ev.id} className="row-item activity-row">
                <div className="flex items-center gap-3">
                  <EventBadge tipo={ev.tipo} />
                  {ev.herramienta && <span className="activity-row-tool">/{ev.herramienta}</span>}
                </div>
                <span className="activity-row-time">
                  <Clock size={11} />
                  {formatRelative(ev.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
