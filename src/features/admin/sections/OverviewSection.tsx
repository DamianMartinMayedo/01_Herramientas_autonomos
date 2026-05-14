/**
 * OverviewSection.tsx
 * Dashboard principal: KPIs, uso por herramienta, actividad reciente.
 */
import { useMemo } from 'react'
import { useAdminStore } from '../../../store/adminStore'
import { useHerramientas } from '../../../hooks/useHerramientas'
import { useAdminFetch } from '../hooks/useAdminFetch'
import type { BlogPost } from '../../../types/blog'
import { FileText, Wrench, Activity, TrendingUp, Clock, CheckCircle, Circle } from 'lucide-react'

type Accent = 'primary' | 'success' | 'copper'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent?: Accent
}

function StatCard({ label, value, sub, icon: Icon, accent = 'primary' }: StatCardProps) {
  return (
    <div className="card flex flex-col gap-4">
      <div className={`icon-box icon-box-md icon-box--${accent}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
        {sub && <p className="stat-sub">{sub}</p>}
      </div>
    </div>
  )
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

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Ahora'
  if (m < 60) return `Hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  return `Hace ${Math.floor(h / 24)}d`
}

interface BlogPayload { posts: BlogPost[] }

export function OverviewSection() {
  const { data: postsData }    = useAdminFetch<BlogPost[]>(
    '/functions/v1/admin-blog-posts',
    { transform: (raw) => (raw as BlogPayload).posts ?? [] },
  )
  const posts                  = postsData ?? []
  const { data: herramientas } = useHerramientas()
  const events                 = useAdminStore((s) => s.events)

  const usosPorHerramienta = useMemo(() => {
    const map: Record<string, number> = {}
    for (const ev of events) {
      if (ev.tipo === 'tool_use' && ev.herramienta) {
        map[ev.herramienta] = (map[ev.herramienta] ?? 0) + 1
      }
    }
    return map
  }, [events])

  const published    = posts.filter(p => p.status === 'published').length
  const drafts       = posts.filter(p => p.status === 'draft').length
  const activasCount = herramientas.filter(h => h.activa).length
  const totalUsos    = Object.values(usosPorHerramienta).reduce((a, n) => a + n, 0)
  const recentEvents = events.slice(0, 15)

  const h24Ago = new Date(); h24Ago.setDate(h24Ago.getDate() - 1)
  const eventos24h = events.filter(e => new Date(e.timestamp) > h24Ago).length

  return (
    <div className="section-stack">

      <div>
        <h1 className="section-title">Resumen general</h1>
        <p className="section-sub">Estado de la plataforma en tiempo real</p>
      </div>

      <div className="kpi-grid">
        <StatCard label="Eventos (24h)"    value={eventos24h}    sub="actividad propia"        icon={Activity}   accent="primary" />
        <StatCard label="Usos totales"     value={totalUsos}     sub="desde inicio"            icon={TrendingUp} accent="success" />
        <StatCard label="Herramientas"     value={`${activasCount}/${herramientas.length}`} sub="activas" icon={Wrench} accent="copper" />
        <StatCard label="Posts publicados" value={published}     sub={`${drafts} en borrador`} icon={FileText}   accent="primary" />
      </div>

      <div>
        <p className="section-block-label">Uso por herramienta</p>
        <div className="flex flex-col gap-2">
          {herramientas.map(h => {
            const usos = usosPorHerramienta[h.id] ?? 0
            const pct = totalUsos > 0 ? Math.round((usos / totalUsos) * 100) : 0
            return (
              <div key={h.id} className="row-item usage-row">
                <div className="usage-row-label">
                  {h.activa
                    ? <CheckCircle size={13} className="text-success shrink-0" />
                    : <Circle      size={13} className="text-faint shrink-0" />
                  }
                  <span className="usage-row-name">{h.nombre}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-bar-fill ${h.activa ? 'progress-bar-fill--active' : 'progress-bar-fill--inactive'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="usage-row-count">{usos} usos</span>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <p className="section-block-label">Actividad reciente</p>

        {recentEvents.length === 0 ? (
          <div className="empty-state">
            <Activity size={24} className="empty-state-icon" />
            <p className="empty-state-text">
              Sin eventos registrados aún.<br />
              Los eventos se generan automáticamente cuando los usuarios usan la app.
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
