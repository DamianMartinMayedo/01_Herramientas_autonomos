import { useState, useEffect } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialView?: 'login' | 'register'
}

export function AuthModal({ isOpen, onClose, initialView = 'login' }: AuthModalProps) {
  const [view, setView] = useState<'login' | 'register'>(initialView)

  useEffect(() => {
    if (isOpen) setView(initialView)
  }, [isOpen, initialView])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="auth-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={view === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
    >
      <div className="auth-modal">
        <button
          className="auth-modal__close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          ✕
        </button>
        {view === 'login' ? (
          <LoginForm
            onSuccess={onClose}
            onSwitchToRegister={() => setView('register')}
          />
        ) : (
          <RegisterForm
            onSuccess={onClose}
            onSwitchToLogin={() => setView('login')}
          />
        )}
      </div>
    </div>
  )
}
