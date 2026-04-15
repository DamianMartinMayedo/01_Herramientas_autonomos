/**
 * Pie de página global del sitio.
 * Reutilizable en cualquier página — importa y coloca al final del JSX.
 */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-copy">
          © {new Date().getFullYear()} HerramientasAutonomos.es — Herramientas para autónomos
        </p>
      </div>
    </footer>
  )
}
