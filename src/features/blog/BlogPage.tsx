/**
 * BlogPage.tsx
 * Listado público de artículos del blog.
 * Lee del adminStore (localStorage en local → Supabase en cloud).
 */
import { Link } from 'react-router-dom'
import { useAdminStore } from '../../store/adminStore'
import { ArrowRight, Calendar, Tag } from 'lucide-react'
import { ThemeToggle } from '../../components/ui/ThemeToggle'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(iso))
}

export function BlogPage() {
  const posts = useAdminStore((s) => s.posts).filter((p) => p.status === 'published')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', transition: 'background var(--transition-slow)' }}>

      {/* Header */}
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div className="site-logo">HerramientasAutonomos</div>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main style={{ maxWidth: 'var(--content-default)', margin: '0 auto', padding: 'var(--space-12) var(--space-6) var(--space-20)' }}>

        {/* Hero del blog */}
        <section style={{ marginBottom: 'var(--space-12)' }}>
          <p className="section-label" style={{ marginBottom: 'var(--space-3)' }}>Blog</p>
          <h1 style={
            {
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-2xl)',
              fontWeight: 800,
              color: 'var(--color-text)',
              lineHeight: 1.2,
              marginBottom: 'var(--space-4)',
            }
          }>
            Guías y consejos<br />para autónomos
          </h1>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', maxWidth: '56ch' }}>
            Artículos prácticos sobre fiscalidad, gestión y herramientas para que tu actividad como autónomo sea más sencilla.
          </p>
        </section>

        {/* Lista de artículos */}
        {posts.length === 0 ? (
          <div style={{
            padding: 'var(--space-16)',
            textAlign: 'center',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '2px dashed var(--color-border)',
          }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-base)' }}>
              Próximamente publicaremos artículos útiles para autónomos.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {posts.map((post, i) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <article
                  style={{
                    background: 'var(--color-surface)',
                    border: '2px solid var(--color-border)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--space-6)',
                    boxShadow: i === 0 ? '4px 4px 0 var(--color-border)' : '3px 3px 0 var(--color-border)',
                    transition: 'transform 160ms ease, box-shadow 160ms ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0 var(--color-border)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'none'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = i === 0 ? '4px 4px 0 var(--color-border)' : '3px 3px 0 var(--color-border)'
                  }}
                >
                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                      {post.tags.slice(0, 3).map((t) => (
                        <span key={t} style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          fontSize: 'var(--text-xs)', fontWeight: 600,
                          color: 'var(--color-primary)',
                          background: 'var(--color-primary-highlight)',
                          padding: '3px 10px', borderRadius: 'var(--radius-full)',
                        }}>
                          <Tag size={9} />{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Título */}
                  <h2 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--text-xl)',
                    fontWeight: 800,
                    color: 'var(--color-text)',
                    lineHeight: 1.25,
                    marginBottom: 'var(--space-3)',
                  }}>
                    {post.titulo}
                  </h2>

                  {/* Extracto */}
                  {post.extracto && (
                    <p style={{
                      fontSize: 'var(--text-base)',
                      color: 'var(--color-text-muted)',
                      lineHeight: 1.6,
                      marginBottom: 'var(--space-5)',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {post.extracto}
                    </p>
                  )}

                  {/* Footer del artículo */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
                      <Calendar size={11} />
                      {formatDate(post.publishedAt ?? post.createdAt)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-primary)' }}>
                      Leer artículo <ArrowRight size={14} />
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--color-divider)' }}>
        <div style={{ maxWidth: 'var(--content-wide)', margin: '0 auto', padding: 'var(--space-6)', textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
            © {new Date().getFullYear()} HerramientasAutonomos.es — Herramientas para autónomos
          </p>
        </div>
      </footer>
    </div>
  )
}
