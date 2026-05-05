import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '../ui/ThemeToggle'
import { AuthModal } from '../../features/auth/AuthModal'
import { UserMenu } from '../../features/auth/UserMenu'
import { useAuth } from '../../hooks/useAuth'

export function SiteHeader() {
  const { user, plan, loading } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalView, setModalView] = useState<'login' | 'register'>('login')

  const openLogin = () => {
    setModalView('login')
    setModalOpen(true)
  }

  const openRegister = () => {
    setModalView('register')
    setModalOpen(true)
  }

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { view?: 'login' | 'register' }
      setModalView(detail?.view ?? 'register')
      setModalOpen(true)
    }
    window.addEventListener('ha:open-auth', handler)
    return () => window.removeEventListener('ha:open-auth', handler)
  }, [])

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="site-logo" style={{ textDecoration: 'none' }}>
            HerramientasAutonomos
          </Link>
          <nav className="site-nav">
            <Link to="/blog" className="site-nav-link">
              Blog
            </Link>
            <ThemeToggle />
            {!loading && (
              user ? (
                <UserMenu user={user} plan={plan} />
              ) : (
                <div className="auth-buttons">
                  <button className="auth-btn auth-btn--ghost" onClick={openLogin}>
                    Entrar
                  </button>
                  <button className="auth-btn auth-btn--primary" onClick={openRegister}>
                    Registrarse
                  </button>
                </div>
              )
            )}
          </nav>
        </div>
      </header>
      {modalOpen && (
        <AuthModal
          key={modalView}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          initialView={modalView}
        />
      )}
    </>
  )
}
