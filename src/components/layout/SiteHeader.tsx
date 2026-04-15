import { Link } from 'react-router-dom'
import { ThemeToggle } from '../ui/ThemeToggle'

/**
 * Cabecera global del sitio.
 * Reutilizable en cualquier página — importa y coloca al principio del JSX.
 */
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link to="/" className="site-logo" style={{ textDecoration: 'none' }}>
          HerramientasAutonomos
        </Link>
        <nav className="site-nav">
          <Link to="/blog" className="site-nav-link">
            Blog
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
