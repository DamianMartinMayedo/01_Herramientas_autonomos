/**
 * BlogPostPage.tsx
 * Artículo individual con artículos relacionados al final.
 */
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAdminStore } from '../../store/adminStore'
import { ArrowLeft, ArrowRight, Calendar, Tag } from 'lucide-react'
import { ThemeToggle } from '../../components/ui/ThemeToggle'

/** Renderizador de Markdown ligero sin dependencia extra */
function renderMarkdown(md: string): string {
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^#{4}\s(.+)$/gm, '<h4>$1</h4>')
    .replace(/^#{3}\s(.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2}\s(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s(.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^[-*]\s(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>')
    .replace(/^---$/gm, '<hr />')
    .replace(/^(?!<[a-z]).+$/gm, (line) => `<p>${line}</p>`)
    .replace(/\n{2,}/g, '\n')
  return html
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(iso))
}

/** Devuelve hasta 3 artículos relacionados por tags compartidos */
function getRelated(currentId: string, allPosts: ReturnType<typeof useAdminStore.getState>['posts'], currentTags: string[]) {
  return allPosts
    .filter((p) => p.id !== currentId && p.status === 'published')
    .map((p) => ({
      ...p,
      score: p.tags.filter((t) => currentTags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score || new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime())
    .slice(0, 3)
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const posts = useAdminStore((s) => s.posts)
  const post = posts.find((p) => p.slug === slug && p.status === 'published')
  const [html, setHtml] = useState('')

  useEffect(() => {
    if (post?.contenido) setHtml(renderMarkdown(post.contenido))
    window.scrollTo({ top: 0 })
  }, [post?.id])

  if (!post) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', background: 'var(--color-bg)' }}>
        <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text)' }}>Artículo no encontrado</p>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/blog')}>
          <ArrowLeft size={14} /> Volver al blog
        </button>
      </div>
    )
  }

  const related = getRelated(post.id, posts, post.tags)

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

      <main style={{ maxWidth: 'var(--content-narrow)', margin: '0 auto', padding: 'var(--space-10) var(--space-6) var(--space-20)' }}>

        {/* Breadcrumb / Volver */}
        <nav style={{ marginBottom: 'var(--space-8)', display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)',
              textDecoration: 'none', fontWeight: 500,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          >
            <ArrowLeft size={13} /> Inicio
          </Link>
          <span style={{ color: 'var(--color-text-faint)', fontSize: 'var(--text-sm)' }}>/</span>
          <Link
            to="/blog"
            style={{
              fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)',
              textDecoration: 'none', fontWeight: 500,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          >
            Blog
          </Link>
        </nav>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
            {post.tags.map((t) => (
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
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-2xl)',
          fontWeight: 800,
          color: 'var(--color-text)',
          lineHeight: 1.2,
          marginBottom: 'var(--space-4)',
        }}>
          {post.titulo}
        </h1>

        {/* Meta */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)',
          marginBottom: 'var(--space-8)',
          paddingBottom: 'var(--space-6)',
          borderBottom: '1px solid var(--color-divider)',
        }}>
          <Calendar size={11} />
          Publicado el {formatDate(post.publishedAt ?? post.createdAt)}
        </div>

        {/* Extracto destacado */}
        {post.extracto && (
          <blockquote style={{
            padding: 'var(--space-5)',
            background: 'var(--color-primary-highlight)',
            borderLeft: '3px solid var(--color-primary)',
            borderRadius: '0 var(--radius-lg) var(--radius-lg) 0',
            marginBottom: 'var(--space-8)',
            fontSize: 'var(--text-base)',
            color: 'var(--color-text)',
            lineHeight: 1.65,
            fontStyle: 'italic',
          }}>
            {post.extracto}
          </blockquote>
        )}

        {/* Contenido Markdown */}
        <div className="blog-content" dangerouslySetInnerHTML={{ __html: html }} />

        {/* CTA herramientas */}
        <div style={{
          marginTop: 'var(--space-12)',
          padding: 'var(--space-6)',
          background: 'var(--color-surface)',
          border: '2px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '4px 4px 0 var(--color-border)',
          textAlign: 'center',
        }}>
          <p style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)', marginBottom: 'var(--space-3)' }}>
            ¿Listo para aplicarlo?
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-5)' }}>
            Prueba nuestras herramientas gratuitas para autónomos — sin registro, sin complicaciones.
          </p>
          <Link to="/" className="btn btn-primary btn-sm">
            Ver todas las herramientas
          </Link>
        </div>

        {/* Artículos relacionados */}
        {related.length > 0 && (
          <section style={{ marginTop: 'var(--space-14)' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-lg)',
              fontWeight: 800,
              color: 'var(--color-text)',
              marginBottom: 'var(--space-5)',
            }}>
              Artículos que también te pueden interesar
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px,100%), 1fr))',
              gap: 'var(--space-4)',
            }}>
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/blog/${rel.slug}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <article
                    style={{
                      background: 'var(--color-surface)',
                      border: '2px solid var(--color-border)',
                      borderRadius: 'var(--radius-xl)',
                      padding: 'var(--space-5)',
                      height: '100%',
                      display: 'flex', flexDirection: 'column',
                      transition: 'transform 160ms ease, box-shadow 160ms ease',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)'
                      ;(e.currentTarget as HTMLElement).style.boxShadow = '5px 5px 0 var(--color-border)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'none'
                      ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                    }}
                  >
                    {rel.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginBottom: 'var(--space-3)' }}>
                        {rel.tags.slice(0, 2).map((t) => (
                          <span key={t} style={{
                            fontSize: 'var(--text-xs)', fontWeight: 600,
                            color: 'var(--color-primary)',
                            background: 'var(--color-primary-highlight)',
                            padding: '2px 8px', borderRadius: 'var(--radius-full)',
                          }}>{t}</span>
                        ))}
                      </div>
                    )}
                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 700,
                      color: 'var(--color-text)',
                      lineHeight: 1.3,
                      marginBottom: 'var(--space-3)',
                      flex: 1,
                    }}>
                      {rel.titulo}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-primary)', marginTop: 'auto' }}>
                      Leer <ArrowRight size={12} />
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>

      <footer style={{ borderTop: '1px solid var(--color-divider)' }}>
        <div style={{ maxWidth: 'var(--content-wide)', margin: '0 auto', padding: 'var(--space-6)', textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
            © {new Date().getFullYear()} HerramientasAutonomos.es
          </p>
        </div>
      </footer>
    </div>
  )
}
