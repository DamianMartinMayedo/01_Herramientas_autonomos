/**
 * BlogPage.tsx
 * Listado público de artículos del blog — 2 columnas.
 */
import { Link } from 'react-router-dom'
import { useAdminStore } from '../../store/adminStore'
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { SiteFooter } from '../../components/layout/SiteFooter'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(iso))
}

export function BlogPage() {
  const posts = useAdminStore((s) => s.posts).filter((p) => p.status === 'published')

  return (
    <div className="page-root">

      <SiteHeader />

      <main style={{ maxWidth: 'var(--content-wide)', margin: '0 auto', padding: 'var(--space-12) var(--space-6) var(--space-20)' }}>

        {/* Volver al inicio + Hero */}
        <section style={{ marginBottom: 'var(--space-10)' }}>
          <Link
            to="/"
            className="back-link"
            style={{ marginBottom: 'var(--space-6)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          >
            <ArrowLeft size={14} /> Volver al inicio
          </Link>

          <p className="section-label" style={{ marginBottom: 'var(--space-3)' }}>Blog</p>
          <h1 className="hero-heading--page" style={{ marginBottom: 'var(--space-4)' }}>
            Guías y consejos para autónomos
          </h1>
          <p className="hero-sub--page">
            Artículos prácticos sobre fiscalidad, gestión y herramientas para que tu actividad como autónomo sea más sencilla.
          </p>
        </section>

        {/* Lista de artículos — 2 columnas */}
        {posts.length === 0 ? (
          <div className="blog-empty">
            <p>Próximamente publicaremos artículos útiles para autónomos.</p>
          </div>
        ) : (
          <div className="blog-list-grid">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <article
                  className="blog-card"
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0 var(--color-border)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'none'
                    ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                  }}
                >
                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="blog-card-tags">
                      {post.tags.slice(0, 2).map((t) => (
                        <span key={t} className="blog-tag">
                           {/* <Tag size={0} />*/}{t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Título */}
                  <h2 className="blog-card-title">{post.titulo}</h2>

                  {/* Extracto */}
                  {post.extracto && (
                    <p className="blog-card-excerpt">{post.extracto}</p>
                  )}

                  {/* Footer del artículo */}
                  <div className="blog-card-footer">
                    <div className="blog-card-date">
                      <Calendar size={11} />
                      {formatDate(post.publishedAt ?? post.createdAt)}
                    </div>
                    <div className="blog-card-read">
                      Leer artículo <ArrowRight size={14} />
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
