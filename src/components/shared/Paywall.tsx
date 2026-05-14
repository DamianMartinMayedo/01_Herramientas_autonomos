/**
 * Paywall.tsx
 * Bloqueo visual para usuarios que no cumplen los requisitos de acceso a una
 * herramienta. Dos motivos:
 *  - "login":   herramienta requiere registro, el usuario es anónimo.
 *  - "upgrade": herramienta es premium, el usuario es free.
 */
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Crown, UserPlus, ArrowRight } from 'lucide-react'
import { SiteHeader } from '../layout/SiteHeader'
import { SiteFooter } from '../layout/SiteFooter'

interface Props {
  reason: 'login' | 'upgrade'
  toolName?: string
}

export function Paywall({ reason, toolName }: Props) {
  const navigate = useNavigate()
  const isLogin = reason === 'login'

  const handleLogin = () => {
    window.dispatchEvent(new CustomEvent('ha:open-auth', { detail: { view: 'login' } }))
  }

  const handleRegister = () => {
    window.dispatchEvent(new CustomEvent('ha:open-auth', { detail: { view: 'register' } }))
  }

  return (
    <div className="page-root">
      <SiteHeader />

      <main className="paywall-main">
        <button className="back-link paywall-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Volver
        </button>

        <div className={`paywall-card ${isLogin ? 'paywall-card--login' : 'paywall-card--premium'}`}>
          <div className={`paywall-icon ${isLogin ? 'paywall-icon--login' : 'paywall-icon--premium'}`}>
            {isLogin ? <Lock size={28} /> : <Crown size={28} />}
          </div>

          <h1 className="paywall-title">
            {isLogin
              ? 'Inicia sesión para acceder'
              : (toolName ? `${toolName} es una herramienta Premium` : 'Esta herramienta es Premium')
            }
          </h1>

          <p className="paywall-body">
            {isLogin
              ? 'Esta herramienta requiere una cuenta gratuita para usarse, así puedes guardar tus documentos y mantener la numeración consecutiva.'
              : 'Activa el plan Premium para acceder a contratos, NDA, reclamaciones y todas las funcionalidades avanzadas.'
            }
          </p>

          <div className="paywall-actions">
            {isLogin ? (
              <>
                <button className="btn btn-primary" onClick={handleLogin}>
                  Iniciar sesión <ArrowRight size={14} />
                </button>
                <button className="btn btn-secondary" onClick={handleRegister}>
                  <UserPlus size={14} /> Crear cuenta gratis
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-warning" onClick={() => navigate('/usuario')}>
                  <Crown size={14} /> Ver mi plan
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/')}>
                  Volver al inicio
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
