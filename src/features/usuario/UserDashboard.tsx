/**
 * UserDashboard.tsx
 * Panel principal del usuario registrado.
 * Muestra stats de resumen y accesos rápidos.
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
}

const STAT_CARDS = [
  { key: 'facturas',      label: 'Facturas',      Icon: Receipt,        section: 'facturas' as UserSection,      color: 'var(--color-primary)' },
  { key: 'presupuestos',  label: 'Presupuestos',  Icon: FileText,       section: 'presupuestos' as UserSection,  color: 'var(--color-blue)' },
  { key: 'albaranes',     label: 'Albaranes',     Icon: Package,        section: 'albaranes' as UserSection,     color: 'var(--color-gold)' },
  { key: 'contratos',     label: 'Contratos',     Icon: FileSignature,  section: 'contratos' as UserSection,     color: 'var(--color-success)' },
  { key: 'ndas',          label: 'NDAs',          Icon: ShieldOff,      section: 'ndas' as UserSection,          color: 'var(--color-warning)' },
  { key: 'reclamaciones', label: 'Reclamaciones', Icon: AlertCircle,    section: 'reclamaciones' as UserSection, color: 'var(--color-error)' },
]

interface Props {
  onNav: (s: UserSection) => void
}

export function UserDashboard({ onNav }: Props) {
  const { user } = useAuth()
  const { profile } = useProfile()
  const [stats, setStats] = useState<StatsState>({
    facturas: 0, presupuestos: 0, albaranes: 0,
    contratos: 0, ndas: 0, reclamaciones: 0, totalFacturado: 0,
  })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchStats = async () => {
      setLoadingStats(true)
      const [f, p, a, c, n, r] = await Promise.all([
        supabase.from('facturas').select('id, total', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('presupuestos').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('albaranes').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('contratos').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('ndas').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('reclamaciones').select('id', { count: 'exact' }).eq('user_id', user.id),
      ])
      const totalFacturado = (f.data ?? []).reduce((acc: number, row: { total: number }) => acc + Number(row.total ?? 0), 0)
      setStats({
        facturas:      f.count ?? 0,
        presupuestos:  p.count ?? 0,
        albaranes:     a.count ?? 0,
        contratos:     c.count ?? 0,
        ndas:          n.count ?? 0,
        reclamaciones: r.count ?? 0,
        totalFacturado,
      })
      setLoadingStats(false)
    }
    fetchStats()
  }, [user])

  const nombre = profile?.display_name ?? profile?.email?.split('@')[0] ?? 'usuario'
  const hora = new Date().getHours()
  const saludo = hora < 14 ? 'Buenos días' : hora < 21 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Saludo */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>
          {saludo}, {nombre} 👋
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          Aquí tienes un resumen de tu actividad
        </p>
      </div>

      {/* KPI total facturado */}
      <div style={{
        background: 'var(--color-surface)',
        border: '2px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        marginBottom: 'var(--space-6)',
        boxShadow: '4px 4px 0px 0px var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--radius-lg)',
          background: 'var(--color-primary-highlight)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1.5px solid var(--color-primary)', flexShrink: 0,
        }}>
          <TrendingUp size={22} style={{ color: 'var(--color-primary)' }} />
        </div>
        <div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Total facturado</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' }}>
            {loadingStats ? '—' : `${stats.totalFacturado.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`}
          </p>
        </div>
      </div>

      {/* Grid stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-8)',
      }}>
        {STAT_CARDS.map(({ key, label, Icon, section, color }) => (
          <button
            key={key}
            onClick={() => onNav(section)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
              background: 'var(--color-surface)',
              border: '2px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4) var(--space-5)',
              cursor: 'pointer',
              boxShadow: '3px 3px 0px 0px var(--color-border)',
              transition: 'transform 90ms cubic-bezier(0.34,1.56,0.64,1), box-shadow 90ms',
              textAlign: 'left', fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '5px 5px 0px 0px var(--color-border)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '3px 3px 0px 0px var(--color-border)' }}
            onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = '1px 1px 0px 0px var(--color-border)' }}
            onMouseUp={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '5px 5px 0px 0px var(--color-border)' }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-md)',
              background: `color-mix(in oklch, ${color} 12%, var(--color-surface-2))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
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
      <div style={{
        background: 'var(--color-surface)',
        border: '2px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        boxShadow: '4px 4px 0px 0px var(--color-border)',
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-4)' }}>
          Crear nuevo documento
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          {[
            { label: 'Factura',      section: 'facturas' as UserSection },
            { label: 'Presupuesto',  section: 'presupuestos' as UserSection },
            { label: 'Albarán',      section: 'albaranes' as UserSection },
            { label: 'Contrato',     section: 'contratos' as UserSection },
            { label: 'NDA',          section: 'ndas' as UserSection },
            { label: 'Reclamación',  section: 'reclamaciones' as UserSection },
          ].map(({ label, section }) => (
            <button
              key={section}
              onClick={() => onNav(section)}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}
            >
              <Plus size={14} /> {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
