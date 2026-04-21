/**
 * UserLayout.tsx
 * Shell del panel de usuario: sidebar + contenido principal.
 * Misma estructura visual que AdminLayout pero orientada al usuario.
 */
import { useState, type ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import {
  LayoutDashboard, FileText, Receipt, Package,
  FileSignature, ShieldOff, AlertCircle,
  Calculator, TrendingUp, Clock,
  LogOut, Menu, X, ChevronRight, User,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export type UserSection =
  | 'dashboard'
  | 'facturas' | 'presupuestos' | 'albaranes'
  | 'contratos' | 'ndas' | 'reclamaciones'
  | 'cuota-autonomos' | 'precio-hora' | 'iva-irpf'

interface UserLayoutProps {
  section: UserSection
  onNav: (s: UserSection) => void
  children: ReactNode
}

const NAV_GROUPS = [
  {
    label: 'General',
    items: [
      { id: 'dashboard' as UserSection,     label: 'Dashboard',      Icon: LayoutDashboard },
    ],
  },
  {
    label: 'Documentos',
    items: [
      { id: 'facturas' as UserSection,      label: 'Facturas',       Icon: Receipt },
      { id: 'presupuestos' as UserSection,  label: 'Presupuestos',   Icon: FileText },
      { id: 'albaranes' as UserSection,     label: 'Albaranes',      Icon: Package },
      { id: 'contratos' as UserSection,     label: 'Contratos',      Icon: FileSignature },
      { id: 'ndas' as UserSection,          label: 'NDAs',           Icon: ShieldOff },
      { id: 'reclamaciones' as UserSection, label: 'Reclamaciones',  Icon: AlertCircle },
    ],
  },
  {
    label: 'Calculadoras',
    items: [
      { id: 'cuota-autonomos' as UserSection, label: 'Cuota autónomos', Icon: Calculator },
      { id: 'precio-hora' as UserSection,     label: 'Precio/hora',     Icon: TrendingUp },
      { id: 'iva-irpf' as UserSection,        label: 'IVA / IRPF',      Icon: Clock },
    ],
  },
]

function UserSidebar({
  section, onNav, onClose,
}: {
  section: UserSection
  onNav: (s: UserSection) => void
  onClose?: () => void
}) {
  const { profile } = useProfile()
  const initials = (profile?.display_name ?? profile?.email ?? 'U')
    .slice(0, 2).toUpperCase()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <nav style={{
      display: 'flex', flexDirection: 'column',
      width: '220px', height: '100vh', maxHeight: '100vh',
      background: 'var(--color-surface)',
      borderRight: '2px solid var(--color-border)',
      padding: 'var(--space-5) var(--space-4) var(--space-4)',
      flexShrink: 0, overflow: 'hidden',
    }}>

      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{
            width: 30, height: 30, borderRadius: 'var(--radius-full)',
            background: 'var(--color-primary)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-display)',
            border: '1.5px solid var(--color-primary-active)', flexShrink: 0,
          }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>
              {profile?.display_name ?? profile?.email?.split('@')[0] ?? 'Usuario'}
            </p>
            <span style={{
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
              color: 'var(--color-primary)',
              background: 'var(--color-primary-highlight)',
              border: '1px solid var(--color-primary)',
              borderRadius: 'var(--radius-full)', padding: '1px 6px',
            }}>{profile?.plan ?? 'free'}</span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav grupos */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-faint)', padding: '0 var(--space-3)', marginBottom: 'var(--space-1)' }}>
              {group.label}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {group.items.map(({ id, label, Icon }) => {
                const active = section === id
                return (
                  <button
                    key={id}
                    onClick={() => { onNav(id); onClose?.() }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: active ? '1.5px solid var(--color-primary)' : '1.5px solid transparent',
                      background: active ? 'var(--color-primary-highlight)' : 'transparent',
                      color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      fontSize: 'var(--text-sm)', fontWeight: active ? 600 : 400,
                      cursor: 'pointer', fontFamily: 'var(--font-body)',
                      transition: 'background 100ms, color 100ms',
                      textAlign: 'left', width: '100%',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--color-surface-offset)'; e.currentTarget.style.color = 'var(--color-text)' } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)' } }}
                  >
                    <Icon size={14} />
                    <span style={{ flex: 1 }}>{label}</span>
                    {active && <ChevronRight size={12} />}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-divider)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <button
          onClick={() => onNav('dashboard')}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            width: '100%', padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-md)', border: 'none', background: 'none',
            color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)',
            cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'color 100ms, background 100ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-text)'; e.currentTarget.style.background = 'var(--color-surface-offset)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-faint)'; e.currentTarget.style.background = 'none' }}
        >
          <User size={13} /> Mi perfil
        </button>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            width: '100%', padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-md)', border: 'none', background: 'none',
            color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)',
            cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'color 100ms, background 100ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-error)'; e.currentTarget.style.background = 'var(--color-surface-offset)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-faint)'; e.currentTarget.style.background = 'none' }}
        >
          <LogOut size={13} /> Cerrar sesión
        </button>
      </div>
    </nav>
  )
}

export function UserLayout({ section, onNav, children }: UserLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'flex-start', background: 'var(--color-bg)' }}>

      {/* Sidebar desktop */}
      <div className="hidden lg:flex" style={{ position: 'sticky', top: 0, alignSelf: 'flex-start', height: '100vh' }}>
        <UserSidebar section={section} onNav={onNav} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }} onClick={() => setMobileOpen(false)}>
          <div style={{ height: '100vh' }} onClick={e => e.stopPropagation()}>
            <UserSidebar section={section} onNav={onNav} onClose={() => setMobileOpen(false)} />
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} />
        </div>
      )}

      {/* Contenido */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 30,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--color-divider)',
          background: 'var(--color-surface)',
        }}>
          <button className="lg:hidden" onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <Menu size={18} />
          </button>
          <div style={{ flex: 1 }} />
          <ThemeToggle />
        </div>

        <main style={{ flex: 1, padding: 'var(--space-6) var(--space-8)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
