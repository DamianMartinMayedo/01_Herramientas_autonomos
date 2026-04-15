import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { RouteStatusPage } from './RouteStatusPage'

type ErrorContent = {
  title: string
  description: string
}

function getErrorContent(error: unknown): ErrorContent {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return {
        title: 'Pagina no encontrada',
        description: 'La ruta que intentas abrir no existe o ya no esta disponible.',
      }
    }

    return {
      title: 'Ha ocurrido un error en la ruta',
      description: error.statusText || 'No se pudo cargar esta pagina.',
    }
  }

  if (error instanceof Error) {
    return {
      title: 'Ha ocurrido un error inesperado',
      description: error.message || 'No se pudo cargar esta pagina.',
    }
  }

  return {
    title: 'Ha ocurrido un error inesperado',
    description: 'No se pudo cargar esta pagina.',
  }
}

export function RouteErrorPage() {
  const error = useRouteError()
  const { title, description } = getErrorContent(error)

  return <RouteStatusPage title={title} description={description} />
}
