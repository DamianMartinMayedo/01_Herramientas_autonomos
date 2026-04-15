/**
 * AdminPage.tsx
 * Página principal del panel de administración.
 * Ruta: /admin
 */
import { useState } from 'react'
import { AdminLayout, type AdminSection } from './AdminLayout'
import { OverviewSection }     from './sections/OverviewSection'
import { AnalyticsSection }    from './sections/AnalyticsSection'
import { BlogSection }         from './sections/BlogSection'
import { HerramientasSection } from './sections/HerramientasSection'
import { UsuariosSection }     from './sections/UsuariosSection'

export function AdminPage() {
  const [section, setSection] = useState<AdminSection>('overview')

  const content = {
    overview:      <OverviewSection />,
    analytics:     <AnalyticsSection />,
    blog:          <BlogSection />,
    herramientas:  <HerramientasSection />,
    usuarios:      <UsuariosSection />,
  }[section]

  return (
    <AdminLayout section={section} onNav={setSection}>
      {content}
    </AdminLayout>
  )
}
