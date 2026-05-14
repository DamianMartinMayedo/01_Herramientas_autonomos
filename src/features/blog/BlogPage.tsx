/**
 * BlogPage.tsx
 * Listado público de artículos del blog — 2 columnas.
 */
import { useNavigate, Link } from 'react-router-dom'
import { useBlogPosts } from '../../hooks/useBlogPosts'
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { Seo } from '../../components/seo/Seo'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(iso))
}

export function BlogPage() {
  const navigate = useNavigate()
  const { data: posts } = useBlogPosts()

  const jsonLd = posts.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Blog para autónomos',
    description: 'Guías prácticas sobre fiscalidad, gestión y herramientas para autónomos.',
    itemListElement: posts.map((post, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Article',
        url: `https://herramientasautonomos.es/blog/${post.slug}`,
        name: post.titulo,
        description: post.extracto,
        datePublished: post.published_at ?? post.created_at,
      },
    })),
  } : undefined

  return (
    <div className="page-root">
      <Seo
        title="Blog para autónomos — Guías y consejos"
        description="Artículos prácticos sobre fiscalidad, gestión y herramientas para que tu actividad como autónomo sea más sencilla."
        jsonLd={jsonLd}
      />

      <SiteHeader />

      <main style={{ maxWidth: 'var(--content-wide)', margin: '0 auto', padding: 'var(--space-12) var(--space-6) var(--space-20)' }}>

        {/* Volver */}
        <button
          className="back-link"
          style={{ marginBottom: 'var(--space-6)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={14} /> Volver
        </button>

        <p className="section-label" style={{ marginBottom: 'var(--space-3)' }}>Blog</p>
        <h1 className="hero-heading--page" style={{ marginBottom: 'var(--space-4)' }}>
          Guías y consejos para autónomos
        </h1>
        <p className="hero-sub--page">
          Artículos prácticos sobre fiscalidad, gestión y herramientas para que tu actividad como autónomo sea más sencilla.
        </p>

        {/* Lista de artículos */}
        {posts.length === 0 ? (
          <div className="blog-empty">
            <p>Próximamente publicaremos artículos útiles para autónomos.</p>
          </div>
        ) : (
          <div className="blog-list-grid">
            {posts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug}`} className="link-block">
                <article className="blog-card">
                  {post.tags.length > 0 && (
                    <div className="blog-card-tags">
                      {post.tags.slice(0, 2).map((t) => (
                        <span key={t} className="blog-tag">{t}</span>
                      ))}
                    </div>
                  )}
                  <h2 className="blog-card-title">{post.titulo}</h2>
                  {post.extracto && <p className="blog-card-excerpt">{post.extracto}</p>}
                  <div className="blog-card-footer">
                    <div className="blog-card-date">
                      <Calendar size={11} />
                      {formatDate(post.published_at ?? post.created_at)}
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
