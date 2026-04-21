/**
 * UserPage.tsx
 * Página raíz del panel de usuario.
 */
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { UserLayout, type UserSection } from './UserLayout'
import { UserDashboard } from './UserDashboard'
import { DocumentoListado } from './DocumentoListado'
import { useAuth } from '../../hooks/useAuth'
import { RouteLoading } from '../../components/routing/RouteLoading'
import { CuotaAutonomosWidget } from '../calculadoras/CuotaAutonomosPage'
import { PrecioHoraWidget } from '../calculadoras/PrecioHoraPage'
import { IvaIrpfWidget } from '../calculadoras/IvaIrpfPage'

const DOCUMENT_SECTIONS: UserSection[] = [
  'facturas', 'presupuestos', 'albaranes', 'contratos', 'ndas', 'reclamaciones',
]

export function UserPage() {
  const { user, loading } = useAuth()
  const [section, setSection] = useState<UserSection>('dashboard')

  if (loading) return <RouteLoading />
  if (!user) return <Navigate to="/" replace />

  const renderContent = () => {
    if (section === 'dashboard') {
      return <UserDashboard onNav={setSection} />
    }
    if (DOCUMENT_SECTIONS.includes(section)) {
      return <DocumentoListado tipo={section as 'facturas' | 'presupuestos' | 'albaranes' | 'contratos' | 'ndas' | 'reclamaciones'} />
    }
    if (section === 'cuota-autonomos') return <CuotaAutonomosWidget />
    if (section === 'precio-hora')     return <PrecioHoraWidget />
    if (section === 'iva-irpf')        return <IvaIrpfWidget />
    return null
  }

  return (
    <UserLayout section={section} onNav={setSection}>
      {renderContent()}
    </UserLayout>
  )
}
