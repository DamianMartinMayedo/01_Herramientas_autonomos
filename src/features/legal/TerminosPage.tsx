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
        <p className="hero-sub--page" style={{ marginBottom: 'var(--space-8)' }}>Última actualización: 15 de mayo de 2026</p>

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

          <h2>4. Suscripción Premium</h2>
          <p>Determinadas funcionalidades de la plataforma están disponibles únicamente para usuarios con plan <strong>Premium</strong>. La suscripción se contrata desde el área de usuario y se rige por las condiciones que se exponen a continuación.</p>

          <h3>4.1. Precio e IVA</h3>
          <p>Los precios mostrados en el proceso de contratación incluyen el <strong>IVA al tipo legal vigente</strong> aplicable en España (21% en la fecha de última actualización de estos términos). El precio aplicable es el visible en el momento de la activación de la suscripción.</p>

          <h3>4.2. Periodo de prueba gratuito</h3>
          <p>Si el plan Premium ofrece un periodo de prueba gratuito, éste comienza en el momento de la activación y tiene la duración indicada en la pantalla de contratación. Durante el periodo de prueba <strong>no se efectúa ningún cargo</strong>. Al finalizar, si no has cancelado la suscripción, ésta se renovará automáticamente al precio vigente. Solo se concede un periodo de prueba por usuario.</p>

          <h3>4.3. Renovación automática</h3>
          <p>La suscripción Premium <strong>se renueva automáticamente</strong> al final de cada periodo (mensual o anual, según el modo elegido) al precio vigente en ese momento, salvo que la canceles antes de la siguiente fecha de renovación. En caso de modificación del precio, te lo comunicaremos con antelación razonable antes de que se aplique a tu renovación.</p>

          <h3>4.4. Cancelación</h3>
          <p>Puedes cancelar la suscripción en cualquier momento desde tu área de usuario (<em>Perfil → Plan</em>). La cancelación detiene la renovación automática; <strong>conservarás el acceso a las funcionalidades Premium hasta el final del periodo ya facturado</strong>. No se realizan reembolsos prorrateados por la fracción no consumida del periodo.</p>

          <h3>4.5. Derecho de desistimiento</h3>
          <p>De acuerdo con el artículo 102 y siguientes del Real Decreto Legislativo 1/2007, dispones de un plazo de <strong>14 días naturales</strong> desde la contratación para desistir de la suscripción sin necesidad de justificación. No obstante, al tratarse de un servicio digital, si manifiestas tu consentimiento expreso para iniciar la prestación antes de transcurridos esos 14 días y reconoces que perderás el derecho de desistimiento al ejecutarse completamente el servicio, dicho derecho podrá decaer.</p>

          <h3>4.6. Impago y suspensión</h3>
          <p>En caso de impago, retroceso bancario o rechazo de la pasarela de pago, podremos suspender el acceso a las funcionalidades Premium hasta la regularización del pago.</p>

          <h2>5. Uso adecuado</h2>
          <p>Te comprometes a hacer un uso adecuado de la plataforma y a no:</p>
          <ul>
            <li>Utilizar las herramientas con fines ilícitos o no autorizados.</li>
            <li>Intentar acceder a datos de otros usuarios o a partes restringidas del sistema.</li>
            <li>Utilizar scripts, bots o herramientas automatizadas para interactuar con la plataforma.</li>
            <li>Distribuir malware o realizar ataques de cualquier tipo.</li>
          </ul>

          <h2>6. Propiedad intelectual</h2>
          <p>Todo el contenido de esta web (textos, diseño, código, logotipos, imágenes) es propiedad de HerramientasAutonomos.es o de sus legítmos titulares y está protegido por las leyes de propiedad intelectual e industrial.</p>
          <p>Los documentos que generas a través de las herramientas son de tu propiedad. Puedes utilizarlos, modificarlos y distribuirlos libremente.</p>

          <h2>7. Limitación de responsabilidad</h2>
          <p>HerramientasAutonomos.es se esfuerza por ofrecer información precisa y herramientas funcionales, pero:</p>
          <ul>
            <li><strong>No garantiza</strong> que los documentos generados cumplan al 100% con la normativa vigente en todo momento. Te recomendamos verificar siempre con un profesional cualificado (asesor, gestoría, abogado).</li>
            <li><strong>No se hace responsable</strong> de los perjuicios que pudieran derivarse del uso de las herramientas o de la información contenida en el blog.</li>
            <li><strong>No garantiza</strong> la disponibilidad continua del servicio, pudiendo realizar mantenimientos o actualizaciones sin previo aviso.</li>
          </ul>

          <h2>8. Enlaces a terceros</h2>
          <p>Esta web puede contener enlaces a sitios web de terceros. No nos hacemos responsables del contenido ni de las políticas de privacidad de dichos sitios.</p>

          <h2>9. Modificación de los términos</h2>
          <p>Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento. Los cambios entrarán en vigor desde su publicación en esta web. El uso continuado del servicio tras la modificación implica la aceptación de los nuevos términos.</p>

          <h2>10. Legislación aplicable</h2>
          <p>Estos términos se rigen por la legislación española. Para la resolución de cualquier conflicto, las partes se someten a los Juzgados y Tribunales del domicilio del usuario consumidor o, en su defecto, de España.</p>

          <h2>11. Contacto</h2>
          <p>Para cualquier consulta relacionada con estos términos, puedes contactarnos a través de los medios disponibles en esta web.</p>
        </div>

      </main>

      <SiteFooter />
    </div>
  )
}
