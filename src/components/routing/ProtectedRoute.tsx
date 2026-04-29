import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { RouteLoading } from './RouteLoading'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) return <RouteLoading />
  if (!user) return <Navigate to="/" replace />

  return <>{children}</>
}
