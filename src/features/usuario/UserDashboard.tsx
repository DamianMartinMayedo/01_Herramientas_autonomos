/**
 * UserDashboard.tsx
 * Panel principal del usuario registrado.
 */
import { useEffect, useState } from 'react'
import { useProfile } from '../../hooks/useProfile'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import {
  Receipt, FileText, Package, FileSignature,
  ShieldOff, AlertCircle, TrendingUp, Calculator, Clock,
} from 'lucide-react'
import type { UserSection } from './UserLayout'
import { PlanBadge } from '../../components/shared/PlanBadge'
import { EstadoBadge } from '../../components/shared/EstadoBadge'

interface StatsState {
  facturas: number
  presupuestos: number
  albaranes: number
  contratos: number
  ndas: number
  reclamaciones: number
  totalFacturado: number
  totalPendienteCobro: number
}

const STAT_CARDS = [
  { key: 'facturas',      label: 'Facturas',      Icon: Receipt,       section: 'facturas'      as UserSection, herramientaId: 'factura',     color: 'var(--color-primary)' },
  { key: 'presupuestos',  label: 'Presupuestos',  Icon: FileText,      section: 'presupuestos'  as UserSection, herramientaId: 'presupuesto', color: 'var(--color-teal)' },
  { key: 'albaranes',     label: 'Albaranes',     Icon: Package,       section: 'albaranes'     as UserSection, herramientaId: 'albaran',     color: 'var(--color-gold)' },
  { key: 'contratos',     label: 'Contratos',     Icon: FileSignature, section: 'contratos'     as UserSection, herramientaId: 'contrato',    color: 'var(--color-success)' },
  { key: 'ndas',          label: 'NDAs',          Icon: ShieldOff,     section: 'ndas'          as UserSection, herramientaId: 'nda',         color: 'var(--color-purple)' },
  { key: 'reclamaciones', label: 'Reclamaciones', Icon: AlertCircle,   section: 'reclamaciones' as UserSection, herramientaId: 'reclamacion', color: 'var(--color-error)' },
]

interface Props {
  onNav: (s: UserSection) => void
  nombreEmpresa?: string | null
}

export function UserDashboard({ onNav, nombreEmpresa }: Props) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [stats, setStats] = useState<StatsState>({
    facturas: 0, presupuestos: 0, albaranes: 0,
    contratos: 0, ndas: 0, reclamaciones: 0, totalFacturado: 0, totalPendienteCobro: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    let active = true

    async function fetchStats() {
      setLoadingStats(true)
      const [f, p, a, c, n, r] = await Promise.all([
        supabase.from('facturas').select('id, total, estado', { count: 'exact' }).eq('user_id', userId),
        supabase.from('presupuestos').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('albaranes').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('contratos').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('ndas').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('reclamaciones').select('id', { count: 'exact' }).eq('user_id', userId),
      ])
      if (!active) return

      const totalFacturado = (f.data ?? [])
        .filter((row: { estado?: string }) => row.estado === 'cobrada')
        .reduce((acc: number, row: { total: number }) => acc + Number(row.total ?? 0), 0)
      const totalPendienteCobro = (f.data ?? [])
        .filter((row: { estado?: string }) => row.estado === 'emitida')
        .reduce((acc: number, row: { total: number }) => acc + Number(row.total ?? 0), 0)
      setStats({
        facturas: f.count ?? 0, presupuestos: p.count ?? 0,
        albaranes: a.count ?? 0, contratos: c.count ?? 0,
        ndas: n.count ?? 0, reclamaciones: r.count ?? 0,
        totalFacturado, totalPendienteCobro,
      })
      setLoadingStats(false)
    }

    void fetchStats()
    return () => { active = false }
  }, [userId])

  const nombre = nombreEmpresa ?? profile?.display_name ?? profile?.email?.split('@')[0] ?? 'usuario'
  const hora = new Date().getHours()
  const saludo = hora < 14 ? 'Buenos días' : hora < 21 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="doc-listado-wrap">

      {/* Saludo */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 className="section-title">{saludo}, {nombre}</h1>
        <p className="section-sub">Aquí tienes un resumen de tu actividad</p>
      </div>

      {/* KPI total facturado */}
      <div className="kpi-box">
        <div className="icon-box icon-box-lg" style={{
          background: 'var(--color-primary-highlight)',
          border: '1.5px solid var(--color-primary)',
        }}>
          <TrendingUp size={22} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <p className="stat-label">Ingresos cobrados</p>
          <p className="stat-value" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {loadingStats ? '—' : `${stats.totalFacturado.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`}
          </p>
          <p className="stat-sub">
            Pendiente de cobro: {loadingStats ? '—' : `${stats.totalPendienteCobro.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`}
          </p>
        </div>
      </div>

      {/* Grid de stat cards — sin JS mouse handlers (CSS :hover/:active) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-8)',
      }}>
        {STAT_CARDS.map(({ key, label, Icon, section, herramientaId, color }) => (
          <button key={key} onClick={() => onNav(section)} className="stat-btn">
            <div className="icon-box" style={{
              width: 40, height: 40,
              borderRadius: 'var(--radius-md)',
              background: `color-mix(in srgb, ${color} 12%, var(--color-surface-2))`,
            }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div className="stat-btn-body">
              <div className="stat-btn-label-row">
                <p className="stat-btn-label">{label}</p>
                <EstadoBadge herramientaId={herramientaId} />
                <PlanBadge herramientaId={herramientaId} />
              </div>
              <p className="stat-btn-value">
                {loadingStats ? '—' : stats[key as keyof StatsState]}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Calculadoras */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-4)' }}>
          Calculadoras
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
          {[
            { label: 'Cuota autónomos', desc: 'Calcula tu cuota según tus ingresos netos', section: 'cuota-autonomos' as UserSection, herramientaId: 'cuota-autonomos', Icon: Calculator, color: 'var(--color-primary)' },
            { label: 'Precio / hora',   desc: 'Descubre tu tarifa mínima facturable',       section: 'precio-hora' as UserSection,     herramientaId: 'precio-hora',     Icon: TrendingUp, color: 'var(--color-purple)' },
            { label: 'IVA / IRPF',      desc: 'Calcula IVA a repercutir y retención',       section: 'iva-irpf' as UserSection,        herramientaId: 'iva-irpf',        Icon: Clock,      color: 'var(--color-teal)' },
          ].map(({ label, desc, section, herramientaId, Icon, color }) => (
            <button key={section} onClick={() => onNav(section)} className="stat-btn">
              <div className="icon-box" style={{
                width: 40, height: 40,
                borderRadius: 'var(--radius-md)',
                background: `color-mix(in srgb, ${color} 12%, var(--color-surface-2))`,
              }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div className="stat-btn-body">
                <div className="stat-btn-label-row">
                  <p className="stat-btn-label-strong">{label}</p>
                  <EstadoBadge herramientaId={herramientaId} />
                  <PlanBadge herramientaId={herramientaId} />
                </div>
                <p className="stat-btn-desc">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
