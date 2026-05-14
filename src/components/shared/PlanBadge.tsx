/**
 * PlanBadge.tsx
 * Pequeño badge que indica el plan necesario para usar una herramienta.
 * Renderiza `null` mientras carga y para herramientas que no requieren plan.
 * Es data-driven: lee la tabla `herramientas` de Supabase, así que basta con
 * que el admin marque una herramienta como premium para que el badge aparezca
 * en todos los puntos donde se use este componente.
 */
import { Crown } from 'lucide-react'
import { useHerramienta } from '../../hooks/useHerramientas'

interface Props {
  /** id de la herramienta tal como aparece en la tabla `herramientas`. */
  herramientaId: string
  /** Tamaño del badge. */
  size?: 'xs' | 'sm'
}

export function PlanBadge({ herramientaId, size = 'xs' }: Props) {
  const { data } = useHerramienta(herramientaId)
  if (!data) return null
  if (data.plan_required !== 'premium') return null
  return (
    <span className="badge badge-icon badge-gold" title="Premium" aria-label="Premium">
      <Crown size={size === 'xs' ? 11 : 13} />
    </span>
  )
}
