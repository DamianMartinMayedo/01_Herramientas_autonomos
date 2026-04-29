/**
 * UserLayout.tsx
 * Shell del panel de usuario: sidebar + contenido principal.
 */
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { ConfirmModal } from '../admin/components/ConfirmModal'
import {
  LayoutDashboard, FileText, Receipt, Package,
  FileSignature, ShieldOff, AlertCircle,
  LogOut, X, ChevronRight, User,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

export type UserSection =
  | 'dashboard'
  | 'facturas' | 'presupuestos' | 'albaranes'
  | 'contratos' | 'ndas' | 'reclamaciones'
  | 'perfil'
  | 'cuota-autonomos' | 'precio-hora' | 'iva-irpf'

interface UserLayoutProps {
  section: UserSection
  onNav: (s: UserSection) => void
  children: ReactNode
  nombreEmpresa?: string | null
}

const NAV_GROUPS = [
  {
    label: 'General',
    items: [
      { id: 'dashboard' as UserSection, label: 'Dashboard', Icon: LayoutDashboard },
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
]

function UserSidebar({
  section, onNav, onClose, nombreEmpresa,
}: {
  section: UserSection
  onNav: (s: UserSection) => void
  onClose?: () => void
  nombreEmpresa?: string | null
}) {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const displayName = nombreEmpresa ?? profile?.display_name ?? profile?.email?.split('@')[0] ?? 'Usuario'
  const initials = displayName.slice(0, 2).toUpperCase()

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
          <p className="user-avatar-name">{displayName}</p>
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
        <button
          onClick={() => { onNav('perfil'); onClose?.() }}
          className={`sidebar-nav-btn${section === 'perfil' ? ' active' : ''}`}
        >
          <User size={16} />
          Perfil
          {section === 'perfil' && <ChevronRight size={14} className="ml-auto" />}
        </button>
        <button onClick={() => setLogoutConfirmOpen(true)} className="sidebar-footer-btn sidebar-footer-btn--danger">
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>

      {logoutConfirmOpen && (
        <ConfirmModal
          title="Cerrar sesión"
          description="¿Seguro que quieres cerrar sesión?"
          confirmLabel="Cerrar sesión"
          confirmVariant="danger"
          onConfirm={() => { void handleLogout() }}
          onCancel={() => setLogoutConfirmOpen(false)}
        />
      )}

    </aside>
  )
}

export function UserLayout({ section, onNav, children, nombreEmpresa }: UserLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="layout-root">

      {/* Sidebar desktop */}
      <UserSidebar section={section} onNav={onNav} nombreEmpresa={nombreEmpresa} />

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="mobile-drawer" onClick={() => setMobileOpen(false)}>
          <div style={{ width: 260 }} onClick={e => e.stopPropagation()}>
            <UserSidebar section={section} onNav={onNav} onClose={() => setMobileOpen(false)} nombreEmpresa={nombreEmpresa} />
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
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>

    </div>
  )
}
