/**
 * AdminLayout.tsx
 * Shell del panel: sidebar + área de contenido + login gate.
 */
import { useState, type ReactNode } from 'react'
import { useAdminStore } from '../../store/adminStore'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import {
  LayoutDashboard, FileText, Wrench, Users, BarChart3,
  LogOut, Menu, X, Lock, Eye, EyeOff, ChevronRight,
} from 'lucide-react'

/* ── Tipos ──────────────────────────────────────────────────────────────── */
export type AdminSection = 'overview' | 'analytics' | 'blog' | 'herramientas' | 'usuarios'

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
    <nav style={{
      display: 'flex', flexDirection: 'column',
      width: '220px',
      height: '100vh',
      maxHeight: '100vh',
      background: 'var(--color-surface)',
      borderRight: '2px solid var(--color-border)',
      padding: 'var(--space-5) var(--space-4) var(--space-4)',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 'var(--space-6)',
      }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>
            HA Admin
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: '2px' }}>
            herramientasautonomos.es
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const active = section === id
          return (
            <button
              key={id}
              onClick={() => { onNav(id); onClose?.() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
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
              onMouseEnter={e => {
                if (!active) {
                  e.currentTarget.style.background = 'var(--color-surface-offset)'
                  e.currentTarget.style.color = 'var(--color-text)'
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--color-text-muted)'
                }
              }}
            >
              <Icon size={15} />
              {label}
              {active && <ChevronRight size={13} style={{ marginLeft: 'auto' }} />}
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-divider)', flexShrink: 0 }}>
        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            width: '100%',
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-md)',
            border: 'none', background: 'none',
            color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
            transition: 'color 100ms, background 100ms',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = 'var(--color-error)'
            e.currentTarget.style.background = 'var(--color-surface-offset)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'var(--color-text-faint)'
            e.currentTarget.style.background = 'none'
          }}
        >
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
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg)',
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--color-surface)',
          border: '2px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '4px 4px 0px 0px var(--color-border)',
          padding: 'var(--space-10)',
          width: '100%', maxWidth: '360px',
          display: 'flex', flexDirection: 'column', gap: 'var(--space-6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ThemeToggle />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'var(--color-primary-highlight)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 'var(--space-2)',
          }}>
            <Lock size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text)' }}>
            Panel de administración
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            Acceso restringido a HerramientasAutonomos.es
          </p>
        </div>

        <div className="input-group">
          <label className="input-label">PIN de acceso</label>
          <div style={{ position: 'relative' }}>
            <input
              type={show ? 'text' : 'password'}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••••"
              autoFocus
              className={`input-v3${error ? ' is-error' : ''}`}
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              style={{
                position: 'absolute', right: 'var(--space-3)', top: '50%',
                transform: 'translateY(-50%)', background: 'none', border: 'none',
                cursor: 'pointer', color: 'var(--color-text-faint)',
              }}
            >
              {show ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {error && <p className="input-error-msg">PIN incorrecto</p>}
        </div>

        <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
          Entrar al panel
        </button>

        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', textAlign: 'center', lineHeight: 1.5 }}>
          PIN por defecto: <code style={{ fontFamily: 'var(--font-mono)' }}>admin1234</code><br />
          Cambia <code style={{ fontFamily: 'var(--font-mono)' }}>VITE_ADMIN_PIN</code> en tu .env
        </p>
      </form>
    </div>
  )
}

/* ── AdminLayout ────────────────────────────────────────────────────────── */
export function AdminLayout({ section, onNav, children }: AdminLayoutProps) {
  const { isAuthenticated, logout } = useAdminStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!isAuthenticated) return <LoginGate />

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'flex-start', background: 'var(--color-bg)' }}>

      {/* Sidebar desktop */}
      <div className="hidden lg:flex" style={{ position: 'sticky', top: 0, alignSelf: 'flex-start', height: '100vh' }}>
        <AdminSidebar section={section} onNav={onNav} onLogout={logout} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex',
          }}
          onClick={() => setMobileOpen(false)}
        >
          <div style={{ height: '100vh' }} onClick={e => e.stopPropagation()}>
            <AdminSidebar
              section={section}
              onNav={onNav}
              onClose={() => setMobileOpen(false)}
              onLogout={logout}
            />
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} />
        </div>
      )}

      {/* Contenido principal */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Topbar */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--color-divider)',
          background: 'var(--color-surface)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
            <button
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', flexShrink: 0 }}
            >
              <Menu size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}>
            <ThemeToggle />
          </div>
        </div>

        {/* Área de contenido */}
        <main style={{ flex: 1, padding: 'var(--space-8)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
