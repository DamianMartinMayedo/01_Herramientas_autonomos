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

import { RouteErrorPage }  from '../components/routing/RouteErrorPage'
import { RouteLoading }    from '../components/routing/RouteLoading'
import { NotFoundPage }    from '../components/routing/NotFoundPage'
import { ProtectedRoute }  from '../components/routing/ProtectedRoute'
import { HomePage }        from '../features/home/HomePage'

function withRouteSuspense(element: ReactNode) {
  return <Suspense fallback={<RouteLoading />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  { path: '/',                  element: <HomePage />,                               errorElement: <RouteErrorPage /> },
  { path: '/usuario',           element: <ProtectedRoute>{withRouteSuspense(<UserPage />)}</ProtectedRoute>, errorElement: <RouteErrorPage /> },
  { path: '/factura',           element: withRouteSuspense(<FacturaPage />),         errorElement: <RouteErrorPage /> },
  { path: '/presupuesto',       element: withRouteSuspense(<PresupuestoPage />),     errorElement: <RouteErrorPage /> },
  { path: '/albaran',           element: withRouteSuspense(<AlbaranPage />),         errorElement: <RouteErrorPage /> },
  { path: '/contrato',          element: withRouteSuspense(<ContratoPage />),        errorElement: <RouteErrorPage /> },
  { path: '/nda',               element: withRouteSuspense(<NdaPage />),             errorElement: <RouteErrorPage /> },
  { path: '/reclamacion-pago',  element: withRouteSuspense(<ReclamacionPage />),     errorElement: <RouteErrorPage /> },
  { path: '/admin',             element: withRouteSuspense(<AdminPage />),           errorElement: <RouteErrorPage /> },
  { path: '/cuota-autonomos',   element: withRouteSuspense(<CuotaAutonomosPage />),  errorElement: <RouteErrorPage /> },
  { path: '/precio-hora',       element: withRouteSuspense(<PrecioHoraPage />),      errorElement: <RouteErrorPage /> },
  { path: '/iva-irpf',          element: withRouteSuspense(<IvaIrpfPage />),         errorElement: <RouteErrorPage /> },
  { path: '/blog',              element: withRouteSuspense(<BlogPage />),            errorElement: <RouteErrorPage /> },
  { path: '/blog/:slug',        element: withRouteSuspense(<BlogPostPage />),        errorElement: <RouteErrorPage /> },
  { path: '*',                  element: <NotFoundPage /> },
])
