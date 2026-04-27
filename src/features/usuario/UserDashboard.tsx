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
  ShieldOff, AlertCircle, TrendingUp, Plus,
} from 'lucide-react'
import type { UserSection } from './UserLayout'

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
  { key: 'facturas',      label: 'Facturas',      Icon: Receipt,       section: 'facturas' as UserSection,      color: 'var(--color-primary)' },
  { key: 'presupuestos',  label: 'Presupuestos',  Icon: FileText,      section: 'presupuestos' as UserSection,  color: 'var(--color-blue)' },
  { key: 'albaranes',     label: 'Albaranes',     Icon: Package,       section: 'albaranes' as UserSection,     color: 'var(--color-gold)' },
  { key: 'contratos',     label: 'Contratos',     Icon: FileSignature, section: 'contratos' as UserSection,     color: 'var(--color-success)' },
  { key: 'ndas',          label: 'NDAs',          Icon: ShieldOff,     section: 'ndas' as UserSection,          color: 'var(--color-warning)' },
  { key: 'reclamaciones', label: 'Reclamaciones', Icon: AlertCircle,   section: 'reclamaciones' as UserSection, color: 'var(--color-error)' },
]

interface Props {
  onNav: (s: UserSection) => void
}

export function UserDashboard({ onNav }: Props) {
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

  const nombre = profile?.display_name ?? profile?.email?.split('@')[0] ?? 'usuario'
  const hora = new Date().getHours()
  const saludo = hora < 14 ? 'Buenos días' : hora < 21 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Saludo */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 className="section-title">{saludo}, {nombre} 👋</h1>
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
        {STAT_CARDS.map(({ key, label, Icon, section, color }) => (
          <button key={key} onClick={() => onNav(section)} className="stat-btn">
            <div className="icon-box" style={{
              width: 40, height: 40,
              borderRadius: 'var(--radius-md)',
              background: `color-mix(in oklch, ${color} 12%, var(--color-surface-2))`,
            }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', fontWeight: 500 }}>{label}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' }}>
                {loadingStats ? '—' : stats[key as keyof StatsState]}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Accesos rápidos */}
      <div className="fieldset-v3" style={{ padding: 'var(--space-6)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-4)' }}>
          Crear nuevo documento
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          {[
            { label: 'Factura',     section: 'facturas' as UserSection },
            { label: 'Presupuesto', section: 'presupuestos' as UserSection },
            { label: 'Albarán',     section: 'albaranes' as UserSection },
            { label: 'Contrato',    section: 'contratos' as UserSection },
            { label: 'NDA',         section: 'ndas' as UserSection },
            { label: 'Reclamación', section: 'reclamaciones' as UserSection },
          ].map(({ label, section }) => (
            <button key={section} onClick={() => onNav(section)} className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
              <Plus size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
