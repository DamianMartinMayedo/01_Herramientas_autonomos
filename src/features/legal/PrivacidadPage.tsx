import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { Seo } from '../../components/seo/Seo'

export function PrivacidadPage() {
  return (
    <div className="page-root">
      <Seo
        title="Política de privacidad"
        description="Política de privacidad de HerramientasAutonomos.es. Información sobre el tratamiento de datos personales conforme al RGPD y LOPDGDD."
        noindex={true}
      />

      <SiteHeader />

      <main style={{ maxWidth: 'var(--content-default)', margin: '0 auto', padding: 'var(--space-10) var(--space-6) var(--space-20)' }}>

        <nav className="post-breadcrumb">
          <Link to="/" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={13} /> Inicio
          </Link>
        </nav>

        <h1 className="hero-heading--page" style={{ marginBottom: 'var(--space-2)' }}>Política de privacidad</h1>
        <p className="hero-sub--page" style={{ marginBottom: 'var(--space-8)' }}>Última actualización: 15 de mayo de 2026</p>

        <div className="blog-content">
          <h2>1. Responsable del tratamiento</h2>
          <p>El responsable del tratamiento de tus datos personales es <strong>HerramientasAutonomos.es</strong>, con domicilio en España.</p>
          <p>Puedes contactar con nosotros a través de la información de contacto disponible en esta web.</p>

          <h2>2. Datos que recopilamos</h2>
          <p>Recopilamos y tratamos los siguientes datos personales:</p>
          <ul>
            <li><strong>Datos de registro:</strong> nombre, correo electrónico y contraseña cuando creas una cuenta de usuario.</li>
            <li><strong>Datos de documentos:</strong> información que introduces al crear facturas, presupuestos, contratos y otros documentos (datos de cliente, importes, etc.).</li>
            <li><strong>Datos de navegación:</strong> información técnica generada automáticamente durante tu uso de la web (dirección IP, tipo de navegador, páginas visitadas).</li>
            <li><strong>Datos de pago y facturación:</strong> si contratas la suscripción Premium, recopilamos los datos necesarios para emitir factura (nombre o razón social, NIF, dirección fiscal) y para gestionar el cobro. <strong>No almacenamos los datos completos de tu tarjeta bancaria</strong>: el pago se procesa a través de una pasarela de pago externa que cumple con el estándar PCI-DSS y que actúa como encargado del tratamiento.</li>
          </ul>

          <h2>3. Finalidad del tratamiento</h2>
          <p>Tus datos se tratan con las siguientes finalidades:</p>
          <ul>
            <li>Gestionar tu cuenta de usuario y proporcionarte acceso a las herramientas.</li>
            <li>Almacenar y gestionar los documentos que creas a través de la plataforma.</li>
            <li>Gestionar el cobro de la suscripción Premium y emitir la factura correspondiente.</li>
            <li>Mejorar el funcionamiento y la experiencia de uso de la web.</li>
            <li>Cumplir con las obligaciones legales aplicables (en particular, las obligaciones fiscales y contables, que exigen conservar las facturas durante el plazo legalmente previsto).</li>
          </ul>

          <h2>4. Base legal</h2>
          <p>El tratamiento de tus datos se basa en:</p>
          <ul>
            <li><strong>Ejecución de un contrato:</strong> el tratamiento es necesario para proporcionarte el servicio solicitado.</li>
            <li><strong>Consentimiento:</strong> cuando nos lo otorgas al crear tu cuenta o aceptar esta política.</li>
            <li><strong>Interés legítimo:</strong> para la mejora continua del servicio y la seguridad de la plataforma.</li>
            <li><strong>Obligación legal:</strong> cuando estamos obligados por la normativa vigente.</li>
          </ul>

          <h2>5. Conservación de datos</h2>
          <p>Tus datos se conservarán mientras mantengas tu cuenta de usuario activa. Si decides eliminar tu cuenta, los datos asociados se eliminarán de nuestros sistemas en un plazo razonable, salvo que exista una obligación legal de conservación.</p>
          <p>Los <strong>datos de facturación y los registros de pago</strong> de las suscripciones Premium se conservan durante el plazo exigido por la normativa fiscal y contable (mínimo 4 años, conforme al artículo 66 de la Ley General Tributaria), aun cuando elimines tu cuenta.</p>

          <h2>6. Destinatarios</h2>
          <p>No se ceden datos a terceros salvo obligación legal o cuando sea necesario para la prestación del servicio. En particular, intervienen los siguientes encargados del tratamiento:</p>
          <ul>
            <li><strong>Proveedores de hosting y bases de datos en la nube</strong>, para el alojamiento del servicio y los documentos generados.</li>
            <li><strong>Pasarela de pago</strong>, para el procesamiento de los pagos de la suscripción Premium. Estos proveedores actúan bajo sus propias políticas de privacidad y cumplen con los estándares de seguridad aplicables al sector (PCI-DSS).</li>
            <li><strong>Proveedores de envío de correo transaccional</strong>, para confirmaciones, recuperación de contraseña y comunicaciones relacionadas con el servicio.</li>
          </ul>

          <h2>7. Derechos del interesado</h2>
          <p>De acuerdo con el Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD), tienes derecho a:</p>
          <ul>
            <li><strong>Acceso:</strong> conocer qué datos personales tratamos sobre ti.</li>
            <li><strong>Rectificación:</strong> solicitar la corrección de datos inexactos.</li>
            <li><strong>Supresión:</strong> solicitar la eliminación de tus datos.</li>
            <li><strong>Limitación:</strong> solicitar la limitación del tratamiento en ciertos casos.</li>
            <li><strong>Portabilidad:</strong> recibir tus datos en un formato estructurado.</li>
            <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos en determinadas circunstancias.</li>
          </ul>
          <p>Puedes ejercer estos derechos contactando con nosotros a través de los medios disponibles en esta web. También tienes derecho a presentar una reclamación ante la <strong>Agencia Española de Protección de Datos</strong> (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">www.aepd.es</a>).</p>

          <h2>8. Seguridad</h2>
          <p>Aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos personales contra el acceso no autorizado, la alteración, la divulgación o la destrucción.</p>

          <h2>9. Modificaciones</h2>
          <p>Nos reservamos el derecho a modificar esta política de privacidad para adaptarla a novedades legislativas o jurisprudenciales. Cualquier cambio será publicado en esta página con la fecha de última actualización.</p>
        </div>

      </main>

      <SiteFooter />
    </div>
  )
}
