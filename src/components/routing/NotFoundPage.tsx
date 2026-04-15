import { RouteStatusPage } from './RouteStatusPage'

export function NotFoundPage() {
  return (
    <RouteStatusPage
      title="Pagina no encontrada"
      description="La ruta que intentas abrir no existe o ya no esta disponible."
    />
  )
}
