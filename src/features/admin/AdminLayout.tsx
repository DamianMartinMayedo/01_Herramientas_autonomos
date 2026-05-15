/**
 * AdminLayout.tsx
 * Shell del panel: sidebar + área de contenido + login gate.
 */
import { useState, type ReactNode } from 'react'
import { useAdminStore } from '../../store/adminStore'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { ConfirmModal } from './components/ConfirmModal'
import {
  LayoutDashboard, FileText, Wrench, Users, BarChart3,
  LogOut, Menu, X, Lock, Eye, EyeOff, ChevronRight, Tag,
} from 'lucide-react'

/* ── Tipos ──────────────────────────────────────────────────────────────── */
export type AdminSection = 'overview' | 'analytics' | 'blog' | 'herramientas' | 'usuarios' | 'planes'

interface AdminLayoutProps {
  section: AdminSection
  onNav: (s: AdminSection) => void
  children: ReactNode
}

const NAV_ITEMS: { id: AdminSection; label: string; Icon: React.ElementType }[] = [
  { id: 'overview',      label: 'Resumen',      Icon: LayoutDashboard },
  { id: 'analytics',    label: 'Analíticas',   Icon: BarChart3 },
  { id: 'herramientas', label: 'Herramientas',  Icon: Wrench },
  { id: 'blog',         label: 'Blog',          Icon: FileText },
  { id: 'usuarios',     label: 'Usuarios',      Icon: Users },
  { id: 'planes',      label: 'Planes',        Icon: Tag },
]

function AdminSidebar({
  section,
  onNav,
  onClose,
  onLogout,
}: {
  section: AdminSection
  onNav: (s: AdminSection) => void
  onClose?: () => void
  onLogout: () => void
}) {
  return (
    <nav className="sidebar admin-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div>
          <p className="sidebar-logo-title">HA Admin</p>
          <p className="sidebar-logo-sub">herramientasautonomos.es</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <div className="sidebar-nav">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = section === id
          return (
            <button
              key={id}
              onClick={() => { onNav(id); onClose?.() }}
              className={`sidebar-nav-btn${active ? ' active' : ''}`}
            >
              <Icon size={15} />
              {label}
              {active && <ChevronRight size={13} className="ml-auto" />}
            </button>
          )
        })}
      </div>

      <div className="sidebar-footer">
        <button onClick={onLogout} className="sidebar-footer-btn sidebar-footer-btn--danger">
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}

/* ── LoginGate ──────────────────────────────────────────────────────────── */
function LoginGate() {
  const login = useAdminStore((s) => s.login)
  const [pin, setPin]     = useState('')
  const [show, setShow]   = useState(false)
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const ok = login(pin)
    if (!ok) {
      setError(true)
      setPin('')
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div className="login-gate">
      <form onSubmit={handleSubmit} className="login-form">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <div className="flex flex-col gap-2">
          <div className="icon-box icon-box-md mb-2 login-icon-box">
            <Lock size={18} className="login-icon" />
          </div>
          <h1 className="login-title">Panel de administración</h1>
          <p className="section-sub">Acceso restringido a HerramientasAutonomos.es</p>
        </div>

        <div className="input-group">
          <label className="input-label">PIN de acceso</label>
          <div className="input-password-wrap">
            <input
              type={show ? 'text' : 'password'}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••••"
              autoFocus
              className={`input-v3 has-icon-right${error ? ' is-error' : ''}`}
            />
            <button type="button" onClick={() => setShow(!show)} className="input-password-toggle">
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {error && <p className="input-error-msg">PIN incorrecto</p>}
        </div>

        <button type="submit" className="btn btn-primary btn-center">
          Entrar al panel
        </button>

        <p className="note-text text-center">
          PIN por defecto: <code className="font-mono">admin1234</code><br />
          Cambia <code className="font-mono">VITE_ADMIN_PIN</code> en tu .env
        </p>
      </form>
    </div>
  )
}

/* ── AdminLayout ────────────────────────────────────────────────────────── */
export function AdminLayout({ section, onNav, children }: AdminLayoutProps) {
  const { isAuthenticated, logout } = useAdminStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  if (!isAuthenticated) return <LoginGate />

  return (
    <div className="layout-root admin-layout-shell">

      {/* Sidebar desktop */}
      <div className="show-lg admin-layout-sidebar">
        <AdminSidebar section={section} onNav={onNav} onLogout={() => setLogoutConfirmOpen(true)} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="mobile-drawer" onClick={() => setMobileOpen(false)}>
          <div className="admin-mobile-drawer-panel" onClick={e => e.stopPropagation()}>
            <AdminSidebar
              section={section}
              onNav={onNav}
              onClose={() => setMobileOpen(false)}
              onLogout={() => setLogoutConfirmOpen(true)}
            />
          </div>
          <div className="mobile-drawer-backdrop" />
        </div>
      )}

      {/* Contenido principal */}
      <div className="admin-layout-content">

        {/* Topbar */}
        <div className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="hide-lg admin-menu-btn"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={18} />
            </button>
          </div>
          <div className="flex items-center justify-end shrink-0">
            <ThemeToggle />
          </div>
        </div>

        {/* Área de contenido */}
        <main className="admin-layout-main">
          {children}
        </main>
      </div>

      {logoutConfirmOpen && (
        <ConfirmModal
          title="Cerrar sesión"
          description="¿Seguro que quieres cerrar sesión del panel de administración?"
          confirmLabel="Cerrar sesión"
          confirmVariant="danger"
          onConfirm={() => { logout(); setLogoutConfirmOpen(false) }}
          onCancel={() => setLogoutConfirmOpen(false)}
        />
      )}
    </div>
  )
}
