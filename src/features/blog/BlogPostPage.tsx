/**
 * BlogPostPage.tsx
 * Artículo individual con artículos relacionados al final.
 */
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAdminStore } from '../../store/adminStore'
import { ArrowLeft, ArrowRight, Calendar, Tag } from 'lucide-react'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { SiteFooter } from '../../components/layout/SiteFooter'

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
      <div className="page-root" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)' }}>
        <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text)' }}>Artículo no encontrado</p>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/blog')}>
          <ArrowLeft size={14} /> Volver al blog
        </button>
      </div>
    )
  }

  const related = getRelated(post.id, posts, post.tags)

  return (
    <div className="page-root" style={{ display: 'flex', flexDirection: 'column' }}>

      <SiteHeader />

      <main style={{ maxWidth: 'var(--content-default)', margin: '0 auto', padding: 'var(--space-10) var(--space-6) var(--space-20)' }}>

        {/* Breadcrumb / Volver */}
        <nav className="post-breadcrumb">
          <Link
            to="/"
            className="back-link"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          >
            <ArrowLeft size={13} /> Inicio
          </Link>
          <span className="breadcrumb-sep">/</span>
          <Link
            to="/blog"
            className="back-link"
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          >
            Blog
          </Link>
        </nav>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="blog-card-tags" style={{ marginBottom: 'var(--space-5)' }}>
            {post.tags.map((t) => (
              <span key={t} className="blog-tag">
                <Tag size={9} />{t}
              </span>
            ))}
          </div>
        )}

        {/* Título */}
        <h1 className="hero-heading" style={{ marginBottom: 'var(--space-4)' }}>
          {post.titulo}
        </h1>

        {/* Meta */}
        <div className="post-meta">
          <Calendar size={11} />
          Publicado el {formatDate(post.publishedAt ?? post.createdAt)}
        </div>

        {/* Extracto destacado */}
        {post.extracto && (
          <blockquote className="post-blockquote">
            {post.extracto}
          </blockquote>
        )}

        {/* Contenido Markdown */}
        <div className="blog-content" dangerouslySetInnerHTML={{ __html: html }} />

        {/* CTA herramientas */}
        <div className="post-cta-box">
          <p className="post-cta-title">¿Listo para aplicarlo?</p>
          <p className="post-cta-sub">Prueba nuestras herramientas</p>
          <Link to="/" className="btn btn-primary btn-sm">
            Ver todas las herramientas
          </Link>
        </div>

        {/* Artículos relacionados */}
        {related.length > 0 && (
          <section style={{ marginTop: '30px' }}>
            <h2 className="related-heading">
              Artículos que también te pueden interesar
            </h2>
            <div className="related-grid">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  to={`/blog/${rel.slug}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <article
                    className="blog-card blog-card--sm"
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
                      <div className="blog-card-tags" style={{ gap: 'var(--space-1)', marginBottom: 'var(--space-3)' }}>
                        {rel.tags.slice(0, 2).map((t) => (
                          <span key={t} className="blog-tag">{t}</span>
                        ))}
                      </div>
                    )}
                    <h3 className="blog-card-title blog-card-title--sm">{rel.titulo}</h3>
                    <div className="blog-card-read" style={{ marginTop: 'auto' }}>
                      Leer <ArrowRight size={12} />
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>

      <SiteFooter />
    </div>
  )
}
