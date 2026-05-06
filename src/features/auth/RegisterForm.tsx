import { useState } from 'react'
import { signUp } from '../../store/authStore'

interface RegisterFormProps {
  onSuccess: () => void
  onSwitchToLogin: () => void
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password)
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setMessage('¡Registro exitoso! Revisa tu correo para confirmar la cuenta.')
      setTimeout(() => onSuccess(), 3000)
    }
  }

  return (
    <div className="auth-form">
      <h2 className="auth-form__title">Crear cuenta</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="auth-form__field">
          <label htmlFor="register-email">Correo electrónico</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            required
            autoComplete="email"
          />
        </div>
        <div className="auth-form__field">
          <label htmlFor="register-password">Contraseña</label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            autoComplete="new-password"
          />
        </div>
        <div className="auth-form__field">
          <label htmlFor="register-confirm">Confirmar contraseña</label>
          <input
            id="register-confirm"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repite la contraseña"
            required
            autoComplete="new-password"
            onKeyDown={e => { if (e.key === 'Enter' && !loading) handleSubmit(e) }}
          />
        </div>
        {error && <p className="auth-form__error">{error}</p>}
        {message && <p className="auth-form__success">{message}</p>}
        <button type="submit" className="auth-form__submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Crear cuenta'}
        </button>
      </form>
      <p className="auth-form__switch">
        ¿Ya tienes cuenta?{' '}
        <button type="button" onClick={onSwitchToLogin} className="auth-form__switch-btn">
          Inicia sesión
        </button>
      </p>
    </div>
  )
}
