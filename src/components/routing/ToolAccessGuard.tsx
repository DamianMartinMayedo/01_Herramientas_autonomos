/**
 * ToolAccessGuard.tsx
 * Wrapper de ruta que aplica el modelo de acceso por herramienta:
 *   - Si visible === false → NotFound (no accesible por URL directa).
 *   - Si estado != 'active' → ToolUnavailable (no accesible para nadie).
 *   - Anónimo: pasa si la herramienta es free Y anon_available=true.
 *   - Registrado free: pasa si plan_required != 'premium'.
 *   - Registrado premium: pasa siempre.
 * En el resto de casos renderiza <Paywall>.
 */
import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { useHerramienta } from '../../hooks/useHerramientas'
import { Paywall } from '../shared/Paywall'
import { ToolUnavailable } from './ToolUnavailable'
import { NotFoundPage } from './NotFoundPage'
import { RouteLoading } from './RouteLoading'

interface Props {
  herramientaId: string
  children: ReactNode
}

export function ToolAccessGuard({ herramientaId, children }: Props) {
  const { data: herramienta, loading: hLoading } = useHerramienta(herramientaId)
  const { user, loading: aLoading }              = useAuth()
  const { isPremium, loading: pLoading }         = useProfile()

  if (hLoading || aLoading || (user && pLoading)) return <RouteLoading />

  if (!herramienta) return <>{children}</>

  if (herramienta.visible === false) {
    return <NotFoundPage />
  }

  if (herramienta.estado !== 'active') {
    return <ToolUnavailable estado={herramienta.estado} toolName={herramienta.nombre} />
  }

  const isPremiumTool = herramienta.plan_required === 'premium'
  const allowsAnon    = herramienta.anon_available === true

  if (user) {
    if (isPremiumTool && !isPremium) return <Paywall reason="upgrade" toolName={herramienta.nombre} />
    return <>{children}</>
  }

  // Anónimo
  if (isPremiumTool || !allowsAnon) return <Paywall reason="login" toolName={herramienta.nombre} />
  return <>{children}</>
}
