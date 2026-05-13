/**
 * CrearUsuarioModal.tsx
 * Modal para crear un nuevo usuario vía edge function admin-create-user.
 */
import { useState } from 'react'
import { UserPlus, Eye, EyeOff, AlertTriangle, Loader2 } from 'lucide-react'
import { AdminModal } from '../../components/AdminModal'
import { adminPost } from '../../hooks/useAdminFetch'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function CrearUsuarioModal({ open, onClose, onCreated }: Props) {
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [plan,    setPlan]    = useState<'free' | 'premium'>('free')
  const [showPass,setShowPass]= useState(false)
  const [creando, setCreando] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const reset = () => {
    setEmail(''); setPass(''); setPlan('free'); setShowPass(false); setError(null)
  }

  const handleClose = () => { if (!creando) { reset(); onClose() } }

  const handleSubmit = async () => {
    if (!email.trim() || !pass.trim()) {
      setError('El email y la contraseña son obligatorios')
      return
    }
    setCreando(true); setError(null)
    const res = await adminPost('/functions/v1/admin-create-user', {
      email: email.trim(), password: pass, plan,
    })
    setCreando(false)
    if (!res.ok) { setError(res.error ?? 'Error al crear el usuario'); return }
    reset()
    onCreated()
    onClose()
  }

  return (
    <AdminModal
      open={open}
      size="sm"
      title="Crear usuario"
      icon={<UserPlus size={18} />}
      iconAccent="primary"
      onClose={handleClose}
      closeDisabled={creando}
      footer={
        <>
          <button className="btn btn-secondary btn-sm" onClick={handleClose} disabled={creando}>
            Cancelar
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { void handleSubmit() }}
            disabled={creando}
          >
            {creando ? <Loader2 size={14} className="spin" /> : <UserPlus size={14} />}
            {creando ? 'Creando...' : 'Crear usuario'}
          </button>
        </>
      }
    >
      <div className="input-group">
        <label className="input-label">Email *</label>
        <input
          type="email"
          className="input-v3"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="usuario@ejemplo.com"
          disabled={creando}
          autoFocus
        />
      </div>

      <div className="input-group">
        <label className="input-label">Contraseña *</label>
        <div className="input-password-wrap">
          <input
            type={showPass ? 'text' : 'password'}
            className="input-v3 has-icon-right"
            value={pass}
            onChange={e => setPass(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            disabled={creando}
          />
          <button
            type="button"
            onClick={() => setShowPass(p => !p)}
            className="input-password-toggle"
            disabled={creando}
            aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      <div className="input-group">
        <label className="input-label">Plan</label>
        <select
          className="select-v3"
          value={plan}
          onChange={e => setPlan(e.target.value as 'free' | 'premium')}
          disabled={creando}
        >
          <option value="free">Free</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      {error && (
        <div className="error-box">
          <AlertTriangle size={15} className="error-box-icon" />
          <span>{error}</span>
        </div>
      )}

      <p className="admin-modal-hint">
        El usuario recibirá un email de confirmación. Hasta que lo confirme, su cuenta estará pendiente.
      </p>
    </AdminModal>
  )
}
