/**
 * UserLayout.tsx
 * Shell del panel de usuario: sidebar + contenido principal.
 * Misma estructura visual que AdminLayout pero orientada al usuario.
 */
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import {
  LayoutDashboard, FileText, Receipt, Package,
  FileSignature, ShieldOff, AlertCircle,
  Calculator, TrendingUp, Clock,
  LogOut, Menu, X, ChevronRight, User, Settings,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export type UserSection =
  | 'dashboard'
  | 'facturas' | 'presupuestos' | 'albaranes'
  | 'contratos' | 'ndas' | 'reclamaciones'
  | 'clientes'
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
      { id: 'dashboard' as UserSection, label: 'Dashboard', Icon: LayoutDashboard },
      { id: 'clientes' as UserSection, label: 'Cliente', Icon: Settings },
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
  const { profile } = useAuth()
  const navigate = useNavigate()
  const initials = (profile?.display_name ?? profile?.email ?? 'U')
    .slice(0, 2).toUpperCase()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: 'var(--color-surface)',
      borderRight: '2px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: 'var(--space-4) 0',
      flexShrink: 0,
    }}>
      {/* Cabecera */}
      <div style={{
        padding: '0 var(--space-4) var(--space-4)',
        borderBottom: '1px solid var(--color-border)',
        marginBottom: 'var(--space-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--color-primary)',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-display)',
          flexShrink: 0,
        }}>{initials}</div>
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--color-text)',
            margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{profile?.display_name ?? profile?.email?.split('@')[0] ?? 'Usuario'}</p>
          <span style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-body)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>{profile?.plan ?? 'free'}</span>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav grupos */}
      <nav style={{ flex: 1, padding: '0 var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p style={{
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-body)',
              color: 'var(--color-text-faint)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
              margin: '0 0 var(--space-1) var(--space-1)',
            }}>{group.label}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {group.items.map(({ id, label, Icon }) => {
                const active = section === id
                return (
                  <button
                    key={id}
                    onClick={() => { onNav(id); onClose?.() }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-2) var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: active ? '1.5px solid var(--color-primary)' : '1.5px solid transparent',
                      background: active ? 'var(--color-primary-highlight)' : 'transparent',
                      color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: active ? 600 : 400,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                      transition: 'background 100ms, color 100ms',
                      textAlign: 'left',
                      width: '100%',
                    }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--color-surface-offset)'; e.currentTarget.style.color = 'var(--color-text)' } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-muted)' } }}
                  >
                    <Icon size={16} />{label}&nbsp;{active && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: 'var(--space-4) var(--space-3) 0', borderTop: '1px solid var(--color-border)', marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          onClick={() => onNav('clientes')}
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
          <User size={16} /> Cliente
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
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}

export function UserLayout({ section, onNav, children }: UserLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  // Guard: si no hay sesión, redirigir al home
  if (!loading && !user) {
    navigate('/')
    return null
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Sidebar desktop */}
      <div style={{ display: 'none' }} className="user-sidebar-desktop">
        <UserSidebar section={section} onNav={onNav} />
      </div>
      <UserSidebar section={section} onNav={onNav} />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
        }} onClick={() => setMobileOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: 260 }}>
            <UserSidebar section={section} onNav={onNav} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Contenido */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar mobile */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
        }}>
          <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <Menu size={22} />
          </button>
          <ThemeToggle />
        </div>
        <main style={{ flex: 1, padding: 'var(--space-6)', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
