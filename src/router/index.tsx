/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense, type ReactNode } from 'react'

const FacturaPage        = lazy(() => import('../features/factura/FacturaPage').then(m => ({ default: m.FacturaPage })))
const PresupuestoPage    = lazy(() => import('../features/presupuesto/PresupuestoPage').then(m => ({ default: m.PresupuestoPage })))
const AlbaranPage        = lazy(() => import('../features/albaran/AlbaranPage').then(m => ({ default: m.AlbaranPage })))
const ContratoPage       = lazy(() => import('../features/contrato/ContratoPage').then(m => ({ default: m.ContratoPage })))
const NdaPage            = lazy(() => import('../features/nda/NdaPage').then(m => ({ default: m.NdaPage })))
const ReclamacionPage    = lazy(() => import('../features/reclamacion/ReclamacionPage').then(m => ({ default: m.ReclamacionPage })))
const AdminPage          = lazy(() => import('../features/admin/AdminPage').then(m => ({ default: m.AdminPage })))
const BlogPage           = lazy(() => import('../features/blog/BlogPage').then(m => ({ default: m.BlogPage })))
const BlogPostPage       = lazy(() => import('../features/blog/BlogPostPage').then(m => ({ default: m.BlogPostPage })))
const CuotaAutonomosPage = lazy(() => import('../features/calculadoras/CuotaAutonomosPage').then(m => ({ default: m.CuotaAutonomosPage })))
const PrecioHoraPage     = lazy(() => import('../features/calculadoras/PrecioHoraPage').then(m => ({ default: m.PrecioHoraPage })))
const IvaIrpfPage        = lazy(() => import('../features/calculadoras/IvaIrpfPage').then(m => ({ default: m.IvaIrpfPage })))
const UserPage           = lazy(() => import('../features/usuario/UserPage').then(m => ({ default: m.UserPage })))
const PrivacidadPage     = lazy(() => import('../features/legal/PrivacidadPage').then(m => ({ default: m.PrivacidadPage })))
const CookiesPage        = lazy(() => import('../features/legal/CookiesPage').then(m => ({ default: m.CookiesPage })))
const TerminosPage       = lazy(() => import('../features/legal/TerminosPage').then(m => ({ default: m.TerminosPage })))

import { RouteErrorPage }  from '../components/routing/RouteErrorPage'
import { RouteLoading }    from '../components/routing/RouteLoading'
import { NotFoundPage }    from '../components/routing/NotFoundPage'
import { ProtectedRoute }  from '../components/routing/ProtectedRoute'
import { ToolAccessGuard } from '../components/routing/ToolAccessGuard'
import { HomePage }        from '../features/home/HomePage'

function withRouteSuspense(element: ReactNode) {
  return <Suspense fallback={<RouteLoading />}>{element}</Suspense>
}

function tool(id: string, element: ReactNode) {
  return <ToolAccessGuard herramientaId={id}>{withRouteSuspense(element)}</ToolAccessGuard>
}

export const router = createBrowserRouter([
  { path: '/',                  element: <HomePage />,                               errorElement: <RouteErrorPage /> },
  { path: '/usuario',           element: <ProtectedRoute>{withRouteSuspense(<UserPage />)}</ProtectedRoute>, errorElement: <RouteErrorPage /> },
  { path: '/factura',           element: tool('factura',         <FacturaPage />),       errorElement: <RouteErrorPage /> },
  { path: '/presupuesto',       element: tool('presupuesto',     <PresupuestoPage />),   errorElement: <RouteErrorPage /> },
  { path: '/albaran',           element: tool('albaran',         <AlbaranPage />),       errorElement: <RouteErrorPage /> },
  { path: '/contrato',          element: tool('contrato',        <ContratoPage />),      errorElement: <RouteErrorPage /> },
  { path: '/nda',               element: tool('nda',             <NdaPage />),           errorElement: <RouteErrorPage /> },
  { path: '/reclamacion-pago',  element: tool('reclamacion',     <ReclamacionPage />),   errorElement: <RouteErrorPage /> },
  { path: '/admin',             element: withRouteSuspense(<AdminPage />),           errorElement: <RouteErrorPage /> },
  { path: '/cuota-autonomos',   element: tool('cuota-autonomos', <CuotaAutonomosPage />), errorElement: <RouteErrorPage /> },
  { path: '/precio-hora',       element: tool('precio-hora',     <PrecioHoraPage />),    errorElement: <RouteErrorPage /> },
  { path: '/iva-irpf',          element: tool('iva-irpf',        <IvaIrpfPage />),       errorElement: <RouteErrorPage /> },
  { path: '/blog',              element: withRouteSuspense(<BlogPage />),            errorElement: <RouteErrorPage /> },
  { path: '/blog/:slug',        element: withRouteSuspense(<BlogPostPage />),        errorElement: <RouteErrorPage /> },
  { path: '/privacidad',        element: withRouteSuspense(<PrivacidadPage />),      errorElement: <RouteErrorPage /> },
  { path: '/cookies',           element: withRouteSuspense(<CookiesPage />),         errorElement: <RouteErrorPage /> },
  { path: '/terminos',          element: withRouteSuspense(<TerminosPage />),        errorElement: <RouteErrorPage /> },
  { path: '*',                  element: <NotFoundPage /> },
])
