import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Envuelve rutas que requieren usuario autenticado.
 * Uso: <Route path="/panel" element={<ProtectedRoute><MiPagina /></ProtectedRoute>} />
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="protected-loading">
        <span>Cargando...</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
