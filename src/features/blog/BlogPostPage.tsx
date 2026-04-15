/**
 * BlogPostPage.tsx
 * Artículo individual. Lee del adminStore por slug.
 * El contenido se renderiza como Markdown usando marked (CDN).
 */
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAdminStore } from '../../store/adminStore'
import { ArrowLeft, Calendar, Tag } from 'lucide-react'
import { ThemeToggle } from '../../components/ui/ThemeToggle'

/** Renderizador de Markdown ligero sin dependencia extra */
function renderMarkdown(md: string): string {
  // Escapado básico
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Encabezados
    .replace(/^#{4}\s(.+)$/gm, '<h4>$1</h4>')
    .replace(/^#{3}\s(.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2}\s(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s(.+)$/gm, '<h1>$1</h1>')
    // Negrita e itálica
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Código inline
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Listas no ordenadas
    .replace(/^[-*]\s(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    // Listas ordenadas
    .replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>')
    // Línea separadora
    .replace(/^---$/gm, '<hr />')
    // Párrafos (bloques de texto que no son etiquetas HTML)
    .replace(/^(?!<[a-z]).+$/gm, (line) => `<p>${line}</p>`)
    // Saltos de línea consecutivos
    .replace(/\n{2,}/g, '\n')

  return html
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(iso))
}

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const posts = useAdminStore((s) => s.posts)
  const post = posts.find((p) => p.slug === slug && p.status === 'published')
  const [html, setHtml] = useState('')

  useEffect(() => {
    if (post?.contenido) {
      setHtml(renderMarkdown(post.contenido))
    }
  }, [post])

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

        {/* Breadcrumb */}
        <nav style={{ marginBottom: 'var(--space-8)' }}>
          <Link
            to="/blog"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
              fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)',
              textDecoration: 'none', fontWeight: 500,
            }}
          >
            <ArrowLeft size={14} /> Blog
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

        {/* Contenido Markdown renderizado */}
        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* CTA al final */}
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
