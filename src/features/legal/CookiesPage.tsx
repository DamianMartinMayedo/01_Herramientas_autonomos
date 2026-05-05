import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { Seo } from '../../components/seo/Seo'

export function CookiesPage() {
  return (
    <div className="page-root">
      <Seo
        title="Política de cookies"
        description="Política de cookies de HerramientasAutonomos.es. Información sobre las cookies que utilizamos y cómo gestionarlas."
        noindex={true}
      />

      <SiteHeader />

      <main style={{ maxWidth: 'var(--content-default)', margin: '0 auto', padding: 'var(--space-10) var(--space-6) var(--space-20)' }}>

        <nav className="post-breadcrumb">
          <Link to="/" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={13} /> Inicio
          </Link>
        </nav>

        <h1 className="hero-heading--page" style={{ marginBottom: 'var(--space-2)' }}>Política de cookies</h1>
        <p className="hero-sub--page" style={{ marginBottom: 'var(--space-8)' }}>Última actualización: mayo de 2026</p>

        <div className="blog-content">
          <h2>1. ¿Qué son las cookies?</h2>
          <p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas una web. Se utilizan para recordar tus preferencias, mejorar la experiencia de navegación y recopilar información analítica sobre el uso del sitio.</p>

          <h2>2. ¿Qué cookies utilizamos?</h2>

          <h3>Cookies técnicas (necesarias)</h3>
          <p>Estas cookies son esenciales para el funcionamiento de la web y no pueden desactivarse:</p>
          <ul>
            <li><strong>ha-theme:</strong> almacena tu preferencia de tema (claro/oscuro).</li>
            <li><strong>ha-auth:</strong> gestiona tu sesión de usuario cuando inicias sesión.</li>
            <li><strong>ha-blog:</strong> almacena los artículos del blog creados por el administrador.</li>
            <li><strong>ha-emisor:</strong> guarda los datos de tu perfil de emisor para los documentos.</li>
          </ul>

          <h3>Cookies analíticas (opcionales)</h3>
          <p>Utilizamos Google Analytics para comprender cómo los visitantes usan nuestra web. Estas cookies nos ayudan a mejorar el servicio:</p>
          <ul>
            <li><strong>_ga, _ga_*, _gid:</strong> cookies de Google Analytics que identifican de forma única a los visitantes y recopilan información de uso de forma anónima.</li>
          </ul>

          <h2>3. ¿Cómo gestionar las cookies?</h2>
          <p>Puedes configurar tu navegador para rechazar cookies o para que te avise cuando se envía una cookie. Sin embargo, algunas funcionalidades de la web podrían no funcionar correctamente si desactivas las cookies técnicas.</p>
          <p>Enlaces a las instrucciones de gestión de cookies de los principales navegadores:</p>
          <ul>
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471" target="_blank" rel="noopener noreferrer">Safari</a></li>
            <li><a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
          </ul>

          <h2>4. Cookies de terceros</h2>
          <p>Esta web puede incluir servicios de terceros que instalan sus propias cookies:</p>
          <ul>
            <li><strong>Google Analytics:</strong> servicio de análisis web proporcionado por Google LLC. Más información: <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer">Google Privacy &amp; Terms</a></li>
          </ul>

          <h2>5. Actualizaciones</h2>
          <p>Esta política de cookies puede actualizarse para reflejar cambios en la normativa o en los servicios que utilizamos. Te recomendamos revisarla periódicamente.</p>

          <h2>6. Contacto</h2>
          <p>Si tienes alguna duda sobre esta política de cookies, puedes contactarnos a través de los medios disponibles en esta web.</p>
        </div>

      </main>

      <SiteFooter />
    </div>
  )
}
