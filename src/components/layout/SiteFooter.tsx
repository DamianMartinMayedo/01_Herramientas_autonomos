/**
 * Pie de página global del sitio.
 * Reutilizable en cualquier página — importa y coloca al final del JSX.
 */
import { Link } from 'react-router-dom'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-grid">
          <div className="site-footer-col">
            <p className="site-footer-heading">Herramientas</p>
            <nav className="site-footer-links">
              <Link to="/factura">Facturas</Link>
              <Link to="/presupuesto">Presupuestos</Link>
              <Link to="/albaran">Albaranes</Link>
            </nav>
          </div>
          <div className="site-footer-col">
            <p className="site-footer-heading">Contratos y acuerdos</p>
            <nav className="site-footer-links">
              <Link to="/contrato">Contratos</Link>
              <Link to="/nda">NDA</Link>
              <Link to="/reclamacion-pago">Reclamación de pago</Link>
            </nav>
          </div>
          <div className="site-footer-col">
            <p className="site-footer-heading">Calculadoras</p>
            <nav className="site-footer-links">
              <Link to="/cuota-autonomos">Cuota autónomos</Link>
              <Link to="/precio-hora">Precio por hora</Link>
              <Link to="/iva-irpf">IVA / IRPF</Link>
            </nav>
          </div>
          <div className="site-footer-col">
            <p className="site-footer-heading">Blog</p>
            <nav className="site-footer-links">
              <Link to="/blog">Todos los artículos</Link>
            </nav>
          </div>
        </div>
        <div className="site-footer-bottom">
          <div className="site-footer-legal">
            <Link to="/privacidad">Política de privacidad</Link>
            <span className="site-footer-legal-sep">·</span>
            <Link to="/cookies">Política de cookies</Link>
            <span className="site-footer-legal-sep">·</span>
            <Link to="/terminos">Términos y condiciones</Link>
          </div>
          <p className="site-footer-copy">
            © {new Date().getFullYear()} HerramientasAutonomos.es
          </p>
        </div>
      </div>
    </footer>
  )
}
