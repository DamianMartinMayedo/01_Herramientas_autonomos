import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { Seo } from '../../components/seo/Seo'

export function TerminosPage() {
  return (
    <div className="page-root">
      <Seo
        title="Términos y condiciones de uso"
        description="Términos y condiciones de uso de HerramientasAutonomos.es. Condiciones generales de acceso y uso de la plataforma."
        noindex={true}
      />

      <SiteHeader />

      <main style={{ maxWidth: 'var(--content-default)', margin: '0 auto', padding: 'var(--space-10) var(--space-6) var(--space-20)' }}>

        <nav className="post-breadcrumb">
          <Link to="/" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={13} /> Inicio
          </Link>
        </nav>

        <h1 className="hero-heading--page" style={{ marginBottom: 'var(--space-2)' }}>Términos y condiciones de uso</h1>
        <p className="hero-sub--page" style={{ marginBottom: 'var(--space-8)' }}>Última actualización: mayo de 2026</p>

        <div className="blog-content">
          <h2>1. Objeto</h2>
          <p>Estos términos y condiciones regulan el acceso y uso de la web <strong>HerramientasAutonomos.es</strong>, que ofrece herramientas en línea para la generación de documentos profesionales (facturas, presupuestos, contratos, etc.) y calculadoras fiscales dirigidas a trabajadores autónomos.</p>
          <p>Al acceder y utilizar esta web, aceptas estos términos en su totalidad. Si no estás de acuerdo con alguna parte, te rogamos que no utilices el servicio.</p>

          <h2>2. Registro y cuenta de usuario</h2>
          <p>El uso de algunas funcionalidades requiere la creación de una cuenta de usuario. Al registrarte, te comprometes a:</p>
          <ul>
            <li>Proporcionar información veraz y actualizada.</li>
            <li>Mantener la confidencialidad de tu contraseña.</li>
            <li>Responsabilizarte de todas las actividades realizadas bajo tu cuenta.</li>
            <li>No utilizar la cuenta de terceros sin autorización.</li>
          </ul>
          <p>Nos reservamos el derecho de suspender o cancelar cuentas que incumplan estos términos.</p>

          <h2>3. Servicios ofrecidos</h2>
          <p>La plataforma ofrece las siguientes herramientas:</p>
          <ul>
            <li><strong>Generación de documentos:</strong> facturas, presupuestos, albaranes, contratos, acuerdos de confidencialidad (NDA) y cartas de reclamación de pago.</li>
            <li><strong>Calculadoras:</strong> cálculo de cuota de autónomos, precio por hora y liquidación de IVA/IRPF.</li>
            <li><strong>Blog:</strong> artículos informativos sobre fiscalidad y gestión para autónomos.</li>
          </ul>

          <h2>4. Uso adecuado</h2>
          <p>Te comprometes a hacer un uso adecuado de la plataforma y a no:</p>
          <ul>
            <li>Utilizar las herramientas con fines ilícitos o no autorizados.</li>
            <li>Intentar acceder a datos de otros usuarios o a partes restringidas del sistema.</li>
            <li>Utilizar scripts, bots o herramientas automatizadas para interactuar con la plataforma.</li>
            <li>Distribuir malware o realizar ataques de cualquier tipo.</li>
          </ul>

          <h2>5. Propiedad intelectual</h2>
          <p>Todo el contenido de esta web (textos, diseño, código, logotipos, imágenes) es propiedad de HerramientasAutonomos.es o de sus legítmos titulares y está protegido por las leyes de propiedad intelectual e industrial.</p>
          <p>Los documentos que generas a través de las herramientas son de tu propiedad. Puedes utilizarlos, modificarlos y distribuirlos libremente.</p>

          <h2>6. Limitación de responsabilidad</h2>
          <p>HerramientasAutonomos.es se esfuerza por ofrecer información precisa y herramientas funcionales, pero:</p>
          <ul>
            <li><strong>No garantiza</strong> que los documentos generados cumplan al 100% con la normativa vigente en todo momento. Te recomendamos verificar siempre con un profesional cualificado (asesor, gestoría, abogado).</li>
            <li><strong>No se hace responsable</strong> de los perjuicios que pudieran derivarse del uso de las herramientas o de la información contenida en el blog.</li>
            <li><strong>No garantiza</strong> la disponibilidad continua del servicio, pudiendo realizar mantenimientos o actualizaciones sin previo aviso.</li>
          </ul>

          <h2>7. Enlaces a terceros</h2>
          <p>Esta web puede contener enlaces a sitios web de terceros. No nos hacemos responsables del contenido ni de las políticas de privacidad de dichos sitios.</p>

          <h2>8. Modificación de los términos</h2>
          <p>Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento. Los cambios entrarán en vigor desde su publicación en esta web. El uso continuado del servicio tras la modificación implica la aceptación de los nuevos términos.</p>

          <h2>9. Legislación aplicable</h2>
          <p>Estos términos se rigen por la legislación española. Para la resolución de cualquier conflicto, las partes se someten a los Juzgados y Tribunales del domicilio del usuario consumidor o, en su defecto, de España.</p>

          <h2>10. Contacto</h2>
          <p>Para cualquier consulta relacionada con estos términos, puedes contactarnos a través de los medios disponibles en esta web.</p>
        </div>

      </main>

      <SiteFooter />
    </div>
  )
}
