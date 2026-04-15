import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'

// Lazy loading para que cada herramienta cargue solo cuando se necesita
const FacturaPage     = lazy(() => import('../features/factura/FacturaPage').then(m => ({ default: m.FacturaPage })))
const PresupuestoPage = lazy(() => import('../features/presupuesto/PresupuestoPage').then(m => ({ default: m.PresupuestoPage })))
const AdminPage       = lazy(() => import('../features/admin/AdminPage').then(m => ({ default: m.AdminPage })))
const BlogPage        = lazy(() => import('../features/blog/BlogPage').then(m => ({ default: m.BlogPage })))
const BlogPostPage    = lazy(() => import('../features/blog/BlogPostPage').then(m => ({ default: m.BlogPostPage })))

import { HomePage } from '../features/home/HomePage'

const Loading = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
  </div>
)

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  {
    path: '/factura',
    element: (
      <Suspense fallback={<Loading />}>
        <FacturaPage />
      </Suspense>
    ),
  },
  {
    path: '/presupuesto',
    element: (
      <Suspense fallback={<Loading />}>
        <PresupuestoPage />
      </Suspense>
    ),
  },
  {
    path: '/admin',
    element: (
      <Suspense fallback={<Loading />}>
        <AdminPage />
      </Suspense>
    ),
  },
  {
    path: '/blog',
    element: (
      <Suspense fallback={<Loading />}>
        <BlogPage />
      </Suspense>
    ),
  },
  {
    path: '/blog/:slug',
    element: (
      <Suspense fallback={<Loading />}>
        <BlogPostPage />
      </Suspense>
    ),
  },
])
