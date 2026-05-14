/**
 * ToolUnavailable.tsx
 * Pantalla que se muestra cuando una herramienta no está disponible
 * (en mantenimiento o próximamente).
 *
 * `<ToolUnavailable>` envuelve la card con page-root + main para usarse como
 * página completa (rutas directas vía ToolAccessGuard).
 * `<ToolUnavailableCard>` es el bloque autocontenido para embeber dentro de
 * otro layout (por ejemplo el panel de usuario).
 */
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Clock, ArrowLeft, Home } from 'lucide-react'
import type { HerramientaEstado } from '../../types/herramienta'

interface Props {
  estado: HerramientaEstado
  toolName: string
  /** Variante embebida (dentro de /usuario): copy adaptado y sin botones de navegación. */
  embedded?: boolean
}

export function ToolUnavailableCard({ estado, toolName, embedded = false }: Props) {
  const navigate = useNavigate()
  const isComingSoon = estado === 'coming_soon'

  const title = isComingSoon
    ? `${toolName} próximamente`
    : `${toolName} en mantenimiento`

  const body = embedded
    ? (isComingSoon
        ? `Estamos trabajando en ${toolName}. Te avisaremos en cuanto esté lista.`
        : `${toolName} está temporalmente fuera de servicio por mejoras. Volverá a estar disponible en breve.`)
    : (isComingSoon
        ? 'Esta herramienta aún no está disponible. Estamos trabajando en ella y la publicaremos pronto.'
        : 'Esta herramienta está temporalmente fuera de servicio por mejoras. Volverá a estar disponible en breve.')

  return (
    <div className="paywall-card">
      <div className="paywall-icon paywall-icon--premium">
        {isComingSoon ? <Clock size={28} /> : <AlertTriangle size={28} />}
      </div>
      <h1 className="paywall-title">{title}</h1>
      <p className="paywall-body">{body}</p>
      {!embedded && (
        <div className="paywall-actions">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={14} /> Volver
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            <Home size={14} /> Ir al inicio
          </button>
        </div>
      )}
    </div>
  )
}

export function ToolUnavailable({ estado, toolName }: Props) {
  return (
    <div className="page-root">
      <main className="paywall-main">
        <ToolUnavailableCard estado={estado} toolName={toolName} />
      </main>
    </div>
  )
}
