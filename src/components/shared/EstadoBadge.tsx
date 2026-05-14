/**
 * EstadoBadge.tsx
 * Badge data-driven que indica si una herramienta está en estado
 * "Próximamente" o "En mantenimiento". Devuelve `null` para herramientas
 * activas o desconocidas.
 *
 * Análogo a <PlanBadge>: ambos pueden coexistir (premium + próximamente).
 */
import { Clock, AlertTriangle } from 'lucide-react'
import { useHerramienta } from '../../hooks/useHerramientas'

interface Props {
  /** id de la herramienta tal como aparece en la tabla `herramientas`. */
  herramientaId: string
  /** Tamaño del icono interno. */
  size?: 'xs' | 'sm'
}

export function EstadoBadge({ herramientaId, size = 'xs' }: Props) {
  const { data } = useHerramienta(herramientaId)
  if (!data || data.estado === 'active') return null
  const iconSize = size === 'xs' ? 11 : 13
  if (data.estado === 'coming_soon') {
    return (
      <span className="badge badge-icon badge-muted" title="Próximamente" aria-label="Próximamente">
        <Clock size={iconSize} />
      </span>
    )
  }
  return (
    <span className="badge badge-icon badge-gold" title="En mantenimiento" aria-label="En mantenimiento">
      <AlertTriangle size={iconSize} />
    </span>
  )
}
