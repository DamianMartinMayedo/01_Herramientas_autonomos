/**
 * ToolUnavailable.tsx
 * Página que se muestra cuando una herramienta no está disponible
 * (en mantenimiento o próximamente).
 */
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Clock, ArrowLeft, Home } from 'lucide-react'
import type { HerramientaEstado } from '../../types/herramienta'

interface Props {
  estado: HerramientaEstado
  toolName: string
}

export function ToolUnavailable({ estado, toolName }: Props) {
  const navigate = useNavigate()
  const isComingSoon = estado === 'coming_soon'

  return (
    <div className="page-root">
      <main className="paywall-main">
        <div className="paywall-card">
          <div className="paywall-icon paywall-icon--premium">
            {isComingSoon ? <Clock size={28} /> : <AlertTriangle size={28} />}
          </div>
          <h1 className="paywall-title">
            {isComingSoon ? `${toolName} próximamente` : `${toolName} en mantenimiento`}
          </h1>
          <p className="paywall-body">
            {isComingSoon
              ? 'Esta herramienta aún no está disponible. Estamos trabajando en ella y la publicaremos pronto.'
              : 'Esta herramienta está temporalmente fuera de servicio por mejoras. Volverá a estar disponible en breve.'
            }
          </p>
          <div className="paywall-actions">
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>
              <ArrowLeft size={14} /> Volver
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              <Home size={14} /> Ir al inicio
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
