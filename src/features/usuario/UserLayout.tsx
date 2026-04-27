/**
 * UserLayout.tsx
 * Shell del panel de usuario: sidebar + contenido principal.
 */
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import {
  LayoutDashboard, FileText, Receipt, Package,
  FileSignature, ShieldOff, AlertCircle,
  Calculator, TrendingUp, Clock,
  LogOut, X, ChevronRight, User, Settings,
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
      { id: 'dashboard' as UserSection,  label: 'Dashboard', Icon: LayoutDashboard },
      { id: 'clientes' as UserSection,   label: 'Cliente',   Icon: Settings },
    ],
  },
  {
    label: 'Documentos',
    items: [
      { id: 'facturas' as UserSection,      label: 'Facturas',      Icon: Receipt },
      { id: 'presupuestos' as UserSection,  label: 'Presupuestos',  Icon: FileText },
      { id: 'albaranes' as UserSection,     label: 'Albaranes',     Icon: Package },
      { id: 'contratos' as UserSection,     label: 'Contratos',     Icon: FileSignature },
      { id: 'ndas' as UserSection,          label: 'NDAs',          Icon: ShieldOff },
      { id: 'reclamaciones' as UserSection, label: 'Reclamaciones', Icon: AlertCircle },
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
    <aside className="sidebar user-sidebar-wrap">

      {/* Cabecera con avatar */}
      <div className="user-sidebar-header">
        <div className="user-avatar">{initials}</div>
        <div className="min-w-0">
          <p className="user-avatar-name">
            {profile?.display_name ?? profile?.email?.split('@')[0] ?? 'Usuario'}
          </p>
          <span className="user-avatar-plan">{profile?.plan ?? 'free'}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="modal-close-btn" style={{ marginLeft: 'auto' }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav grupos */}
      <nav style={{ flex: 1, padding: '0 var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="nav-group-label">{group.label}</p>
            <div className="flex flex-col" style={{ gap: 2 }}>
              {group.items.map(({ id, label, Icon }) => {
                const active = section === id
                return (
                  <button
                    key={id}
                    onClick={() => { onNav(id); onClose?.() }}
                    className={`sidebar-nav-btn${active ? ' active' : ''}`}
                  >
                    <Icon size={16} />{label}
                    {active && <ChevronRight size={14} className="ml-auto" />}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button onClick={() => { onNav('clientes'); onClose?.() }} className="sidebar-footer-btn">
          <User size={16} /> Cliente
        </button>
        <button onClick={handleLogout} className="sidebar-footer-btn sidebar-footer-btn--danger">
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

  if (!loading && !user) {
    navigate('/')
    return null
  }

  return (
    <div className="layout-root">

      {/* Sidebar desktop */}
      <UserSidebar section={section} onNav={onNav} />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="mobile-drawer" onClick={() => setMobileOpen(false)}>
          <div style={{ width: 260 }} onClick={e => e.stopPropagation()}>
            <UserSidebar section={section} onNav={onNav} onClose={() => setMobileOpen(false)} />
          </div>
          <div className="mobile-drawer-backdrop" />
        </div>
      )}

      {/* Contenido */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div className="admin-topbar">
          {/* <button onClick={() => setMobileOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <Menu size={22} />
          </button> */}
          <ThemeToggle />
        </div>
        <main style={{ flex: 1, padding: 'var(--space-6)', overflowY: 'auto' }}>
          {children}
        </main>
      </div>

    </div>
  )
}
