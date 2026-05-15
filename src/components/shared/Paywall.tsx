/**
 * Paywall.tsx
 * Bloqueo visual para usuarios que no cumplen los requisitos de acceso a una
 * herramienta. Dos motivos:
 *  - "login":   herramienta requiere registro, el usuario es anónimo.
 *  - "upgrade": herramienta es premium, el usuario es free.
 *
 * `<Paywall>` envuelve la card con SiteHeader/Footer para usarse como página.
 * `<PaywallCard>` es el bloque autocontenido para embeber dentro de otro layout
 * (por ejemplo el panel de usuario).
 */
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Crown, UserPlus, ArrowRight } from 'lucide-react'
import { SiteHeader } from '../layout/SiteHeader'
import { SiteFooter } from '../layout/SiteFooter'

interface PaywallProps {
  reason: 'login' | 'upgrade'
  toolName?: string
}

export function PaywallCard({ reason, toolName }: PaywallProps) {
  const navigate = useNavigate()
  const isLogin = reason === 'login'

  const handleLogin = () => {
    window.dispatchEvent(new CustomEvent('ha:open-auth', { detail: { view: 'login' } }))
  }
  const handleRegister = () => {
    window.dispatchEvent(new CustomEvent('ha:open-auth', { detail: { view: 'register' } }))
  }

  return (
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
          ? 'Esta herramienta requiere una cuenta gratuita: así puedes guardar tus documentos, mantener la numeración consecutiva y activar VeriFactu (registro fiscal de la AEAT) cuando lo necesites.'
          : 'Activa el plan Premium para acceder a esta herramienta y a todas las funcionalidades avanzadas: contratos, NDAs, reclamaciones de pago y más.'
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
            <button className="btn btn-warning" onClick={() => navigate('/usuario?s=perfil')}>
              <Crown size={14} /> Actualizar a Premium
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/usuario')}>
              Volver al dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/** Variante full-page para rutas públicas (anónimos en herramienta protegida). */
export function Paywall({ reason, toolName }: PaywallProps) {
  const navigate = useNavigate()
  return (
    <div className="page-root">
      <SiteHeader />
      <main className="paywall-main">
        <button className="back-link paywall-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Volver
        </button>
        <PaywallCard reason={reason} toolName={toolName} />
      </main>
      <SiteFooter />
    </div>
  )
}
