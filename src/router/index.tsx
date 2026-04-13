import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'

// Lazy loading para que cada herramienta cargue solo cuando se necesita
const FacturaPage = lazy(() => import('../features/factura/FacturaPage').then(m => ({ default: m.FacturaPage })))
const PresupuestoPage = lazy(() => import('../features/presupuesto/PresupuestoPage').then(m => ({ default: m.PresupuestoPage })))
// Fase 2 — descomentar cuando estén listas
// const AlbaranPage = lazy(() => import('../features/albaran/AlbaranPage').then(m => ({ default: m.AlbaranPage })))

import { HomePage } from '../features/home/HomePage'

const Loading = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
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
])
