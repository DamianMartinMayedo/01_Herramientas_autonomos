/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense, type ReactNode } from 'react'

// Lazy loading para que cada herramienta cargue solo cuando se necesita
const FacturaPage     = lazy(() => import('../features/factura/FacturaPage').then(m => ({ default: m.FacturaPage })))
const PresupuestoPage = lazy(() => import('../features/presupuesto/PresupuestoPage').then(m => ({ default: m.PresupuestoPage })))
const AdminPage       = lazy(() => import('../features/admin/AdminPage').then(m => ({ default: m.AdminPage })))
const BlogPage        = lazy(() => import('../features/blog/BlogPage').then(m => ({ default: m.BlogPage })))
const BlogPostPage    = lazy(() => import('../features/blog/BlogPostPage').then(m => ({ default: m.BlogPostPage })))

import { RouteErrorPage } from '../components/routing/RouteErrorPage'
import { RouteLoading } from '../components/routing/RouteLoading'
import { NotFoundPage } from '../components/routing/NotFoundPage'
import { HomePage } from '../features/home/HomePage'

function withRouteSuspense(element: ReactNode) {
  return <Suspense fallback={<RouteLoading />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  { path: '/', element: <HomePage />, errorElement: <RouteErrorPage /> },
  {
    path: '/factura',
    element: withRouteSuspense(<FacturaPage />),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/presupuesto',
    element: withRouteSuspense(<PresupuestoPage />),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/admin',
    element: withRouteSuspense(<AdminPage />),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/blog',
    element: withRouteSuspense(<BlogPage />),
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/blog/:slug',
    element: withRouteSuspense(<BlogPostPage />),
    errorElement: <RouteErrorPage />,
  },
  { path: '*', element: <NotFoundPage /> },
])
