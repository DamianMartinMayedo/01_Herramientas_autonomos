import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { signIn } from '../../store/authStore'

interface LoginFormProps {
  onSuccess: () => void
  onSwitchToRegister: () => void
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError('Correo o contraseña incorrectos.')
    } else {
      onSuccess()
    }
  }

  return (
    <div className="auth-form">
      <h2 className="auth-form__title">Iniciar sesión</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="auth-form__field">
          <label htmlFor="login-email">Correo electrónico</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            required
            autoComplete="email"
          />
        </div>
        <div className="auth-form__field">
          <label htmlFor="login-password">Contraseña</label>
          <div className="input-password-wrap">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(e) }}
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="input-password-toggle"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        {error && <p className="auth-form__error">{error}</p>}
        <button type="submit" className="auth-form__submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="auth-form__switch">
        ¿No tienes cuenta?{' '}
        <button type="button" onClick={onSwitchToRegister} className="auth-form__switch-btn">
          Regístrate
        </button>
      </p>
    </div>
  )
}
