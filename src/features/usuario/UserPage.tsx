/**
 * UserPage.tsx
 * Página raíz del panel de usuario.
 * Gestiona la sección activa y renderiza el contenido correspondiente.
 */
import { useState } from 'react'
import { UserLayout, type UserSection } from './UserLayout'
import { UserDashboard } from './UserDashboard'
import { DocumentoListado } from './DocumentoListado'
import { lazy, Suspense } from 'react'
import { RouteLoading } from '../../components/routing/RouteLoading'

const CuotaAutonomosPage = lazy(() => import('../calculadoras/CuotaAutonomosPage').then(m => ({ default: m.CuotaAutonomosPage })))
const PrecioHoraPage     = lazy(() => import('../calculadoras/PrecioHoraPage').then(m => ({ default: m.PrecioHoraPage })))
const IvaIrpfPage        = lazy(() => import('../calculadoras/IvaIrpfPage').then(m => ({ default: m.IvaIrpfPage })))

const DOCUMENT_SECTIONS: UserSection[] = [
  'facturas', 'presupuestos', 'albaranes', 'contratos', 'ndas', 'reclamaciones',
]

export function UserPage() {
  const [section, setSection] = useState<UserSection>('dashboard')

  const renderContent = () => {
    if (section === 'dashboard') {
      return <UserDashboard onNav={setSection} />
    }
    if (DOCUMENT_SECTIONS.includes(section)) {
      return <DocumentoListado tipo={section as 'facturas' | 'presupuestos' | 'albaranes' | 'contratos' | 'ndas' | 'reclamaciones'} />
    }
    if (section === 'cuota-autonomos') {
      return <Suspense fallback={<RouteLoading />}><CuotaAutonomosPage /></Suspense>
    }
    if (section === 'precio-hora') {
      return <Suspense fallback={<RouteLoading />}><PrecioHoraPage /></Suspense>
    }
    if (section === 'iva-irpf') {
      return <Suspense fallback={<RouteLoading />}><IvaIrpfPage /></Suspense>
    }
    return null
  }

  return (
    <UserLayout section={section} onNav={setSection}>
      {renderContent()}
    </UserLayout>
  )
}
