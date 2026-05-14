/**
 * BlogPostPage.tsx
 * Artículo individual con artículos relacionados al final.
 */
import { useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useBlogPosts } from '../../hooks/useBlogPosts'
import type { BlogPost } from '../../types/blog'
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { Seo } from '../../components/seo/Seo'

/** Renderizador de Markdown ligero sin dependencia extra */
function renderMarkdown(md: string): string {
  const html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
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
function getRelated(currentId: string, allPosts: BlogPost[], currentTags: string[]) {
  return allPosts
    .filter((p) => p.id !== currentId && p.status === 'published')
    .map((p) => ({
      ...p,
      score: p.tags.filter((t) => currentTags.includes(t)).length,
    }))
    .sort((a, b) => b.score - a.score || new Date(b.published_at ?? b.created_at).getTime() - new Date(a.published_at ?? a.created_at).getTime())
    .slice(0, 3)
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { data: posts } = useBlogPosts()
  const post = posts.find((p) => p.slug === slug)
  const html = useMemo(() => (post?.contenido ? renderMarkdown(post.contenido) : ''), [post])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [post?.id])

  if (!post) {
    return (
      <div className="page-root page-loading">
        <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text)' }}>Artículo no encontrado</p>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/blog')}>
          <ArrowLeft size={14} /> Volver al blog
        </button>
      </div>
    )
  }

  const related = getRelated(post.id, posts, post.tags)

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.titulo,
    description: post.extracto,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Organization',
      name: 'HerramientasAutonomos.es',
      url: 'https://herramientasautonomos.es',
    },
    publisher: {
      '@type': 'Organization',
      name: 'HerramientasAutonomos.es',
      url: 'https://herramientasautonomos.es',
    },
    mainEntityOfPage: `https://herramientasautonomos.es/blog/${post.slug}`,
  }

  return (
    
    <div className="page-root">

      <Seo
        title={post.titulo}
        description={post.extracto}
        ogType="article"
        jsonLd={articleJsonLd}
      />

      <SiteHeader />

      <main
  style={{
    maxWidth: 'var(--content-default)',
    margin: '0 auto',
    padding: 'var(--space-10) var(--space-6) var(--space-20)'
  }}
>
  
  

        {/* Volver */}
        <button className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-8)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={() => navigate(-1)}>
          <ArrowLeft size={13} /> Volver
        </button>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="blog-card-tags" style={{ marginBottom: 'var(--space-5)' }}>
            {post.tags.map((t) => (
              <span key={t} className="blog-tag">
                 {/* <Tag size={0} />*/}{t}
              </span>
            ))}
          </div>
        )}

        {/* Título */}
        <h1 className="hero-heading--page" style={{ marginBottom: 'var(--space-4)' }}>
          {post.titulo}
        </h1>

        {/* Meta */}
        <div className="post-meta">
          <Calendar size={11} />
          Publicado el {formatDate(post.published_at ?? post.created_at)}
        </div>

        {/* Extracto destacado */}
        {post.extracto && (
          <blockquote className="post-blockquote">
            {post.extracto}
          </blockquote>
        )}

        {/* Contenido Markdown */}
        <div className="blog-content" dangerouslySetInnerHTML={{ __html: html }} />

        {/* CTA registro */}
        <div className="post-cta-box">
          <p className="post-cta-title">¿Quieres gestionar todo esto desde un solo sitio?</p>
          <p className="post-cta-sub">Crea tu cuenta <strong>gratis</strong> y accede a facturas, presupuestos, contratos, calculadoras y más.</p>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => window.dispatchEvent(new CustomEvent('ha:open-auth', { detail: { view: 'register' } }))}
          >
            Crear tu cuenta
          </button>
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
                  className="link-block"
                >
                  <article className="blog-card blog-card--sm">
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
