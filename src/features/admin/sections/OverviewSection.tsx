/**
 * OverviewSection.tsx
 * Dashboard principal: KPIs, actividad reciente, estado del sistema.
 */
import { useAdminStore } from '../../../store/adminStore'
import { useBlogStore } from '../../../store/blogStore'
import { FileText, Wrench, Activity, TrendingUp, Clock, CheckCircle, Circle } from 'lucide-react'

function StatCard({
  label, value, sub, icon: Icon, accent = 'primary',
}: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; accent?: 'primary' | 'success' | 'copper'
}) {
  const colors = {
    primary: { bg: 'var(--color-primary-highlight)', color: 'var(--color-primary)' },
    success: { bg: 'var(--color-success-highlight)', color: 'var(--color-success)' },
    copper:  { bg: 'var(--color-copper-highlight)',  color: 'var(--color-copper)'  },
  }
  const c = colors[accent]

  return (
    <div className="card flex flex-col gap-4">
      <div className="icon-box icon-box-md" style={{ background: c.bg }}>
        <Icon size={16} style={{ color: c.color }} />
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

export function OverviewSection() {
  const posts        = useBlogStore((s) => s.posts)
  const herramientas = useAdminStore((s) => s.herramientas)
  const events       = useAdminStore((s) => s.events)

  const published     = posts.filter(p => p.status === 'published').length
  const drafts        = posts.filter(p => p.status === 'draft').length
  const activasCount  = herramientas.filter(h => h.activa).length
  const totalUsos     = herramientas.reduce((acc, h) => acc + h.usosRegistrados, 0)
  const recentEvents  = events.slice(0, 15)

  const h24 = new Date(); h24.setDate(h24.getDate() - 1)
  const eventos24h = events.filter(e => new Date(e.timestamp) > h24).length

  return (
    <div className="section-stack">

      {/* Header */}
      <div>
        <h1 className="section-title">Resumen general</h1>
        <p className="section-sub">Estado de la plataforma en tiempo real</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
        <StatCard label="Eventos (24h)"    value={eventos24h}    sub="actividad propia"       icon={Activity}   accent="primary" />
        <StatCard label="Usos totales"     value={totalUsos}     sub="desde inicio"           icon={TrendingUp} accent="success" />
        <StatCard label="Herramientas"     value={`${activasCount}/${herramientas.length}`} sub="activas"  icon={Wrench}     accent="copper"  />
        <StatCard label="Posts publicados" value={published}     sub={`${drafts} en borrador`} icon={FileText}  accent="primary" />
      </div>

      {/* Uso por herramienta */}
      <div>
        <p className="section-block-label">Uso por herramienta</p>
        <div className="flex flex-col gap-2">
          {herramientas.map(h => {
            const pct = totalUsos > 0 ? Math.round((h.usosRegistrados / totalUsos) * 100) : 0
            return (
              <div key={h.id} className="row-item" style={{ border: '1.5px solid var(--color-border)', padding: 'var(--space-3) var(--space-4)' }}>
                <div className="flex items-center gap-2" style={{ width: '180px', flexShrink: 0 }}>
                  {h.activa
                    ? <CheckCircle size={13} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                    : <Circle size={13} style={{ color: 'var(--color-text-faint)', flexShrink: 0 }} />
                  }
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {h.nombre}
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{
                    width: `${pct}%`,
                    background: h.activa ? 'var(--color-primary)' : 'var(--color-border)',
                  }} />
                </div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', width: '48px', textAlign: 'right', flexShrink: 0 }}>
                  {h.usosRegistrados} usos
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actividad reciente */}
      <div>
        <p className="section-block-label">Actividad reciente</p>

        {recentEvents.length === 0 ? (
          <div className="empty-state">
            <Activity size={24} style={{ color: 'var(--color-text-faint)', margin: '0 auto var(--space-3)', display: 'block' }} />
            <p className="empty-state-text">
              Sin eventos registrados aún.<br />
              Los eventos se generan automáticamente cuando los usuarios usan la app.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {recentEvents.map(ev => (
              <div key={ev.id} className="row-item" style={{ justifyContent: 'space-between' }}>
                <div className="flex items-center gap-3">
                  <EventBadge tipo={ev.tipo} />
                  {ev.herramienta && (
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      /{ev.herramienta}
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
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
