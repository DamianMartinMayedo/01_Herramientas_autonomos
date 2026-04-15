import { useRef, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Calculator, ArrowRight, AlertTriangle, BookOpen, Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import type { BlogPost } from '../../store/blogStore'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { SiteFooter } from '../../components/layout/SiteFooter'

/*
  Paleta de 6 colores para cards de herramientas
  1. card-accent-primary  → azul       (#1A5FC8)
  2. card-accent-success  → verde      (#53a61c)
  3. card-accent-copper   → cobre      (#A56227)
  4. card-accent-purple   → violeta    (#6D3BB8)
  5. card-accent-teal     → esmeralda  (#0F7E72)
  6. card-accent-gold     → oro ámbar  (#B07B00)
*/

const HERRAMIENTAS = [
  {
    href: '/factura',
    icon: FileText,
    titulo: 'Generador de facturas',
    desc: 'Crea facturas con IVA e IRPF y descárgalas en PDF al instante.',
    activa: true,
    accentClass: 'card-accent-primary',
    ctaColor: 'var(--color-primary)',
  },
  {
    href: '/presupuesto',
    icon: FileText,
    titulo: 'Generador de presupuestos',
    desc: 'Envía presupuestos profesionales a tus clientes en minutos.',
    activa: true,
    accentClass: 'card-accent-success',
    ctaColor: 'var(--color-success)',
  },
  {
    href: '/cuota-autonomos',
    icon: Calculator,
    titulo: 'Cuota de autónomos',
    desc: 'Calcula tu cuota mensual según tus ingresos netos reales.',
    activa: false,
    accentClass: 'card-accent-copper',
    ctaColor: 'var(--color-copper)',
  },
  {
    href: '/precio-hora',
    icon: Calculator,
    titulo: 'Precio por hora',
    desc: 'Fija tu tarifa sin venderte por debajo de coste.',
    activa: false,
    accentClass: 'card-accent-purple',
    ctaColor: 'var(--color-purple)',
  },
  {
    href: '/iva-irpf',
    icon: Calculator,
    titulo: 'IVA / IRPF',
    desc: 'Separa base imponible, IVA e IRPF de cualquier importe.',
    activa: false,
    accentClass: 'card-accent-teal',
    ctaColor: 'var(--color-teal)',
  },
] as const

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(iso))
}

// ── Blog Carousel ────────────────────────────────────────────────────────
const CARDS_PER_PAGE = 3
const AUTO_INTERVAL = 5000

type PublicBlogPost = Pick<
  BlogPost,
  'id' | 'titulo' | 'slug' | 'extracto' | 'tags' | 'status' | 'createdAt' | 'publishedAt'
>

function BlogCarousel({ posts }: { posts: PublicBlogPost[] }) {
  const total = Math.min(posts.length, 9)
  const visiblePosts = posts.slice(0, total)
  const pageCount = Math.ceil(total / CARDS_PER_PAGE)
  const [page, setPage] = useState(0)
  // Key que cambia con cada página para forzar re-mount y relanzar la animación CSS
  const [animKey, setAnimKey] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const go = useCallback((next: number) => {
    const target = ((next % pageCount) + pageCount) % pageCount
    setPage(target)
    setAnimKey(k => k + 1) // reinicia la animación de entrada
  }, [pageCount])

  useEffect(() => {
    if (pageCount <= 1) return
    timerRef.current = setInterval(() => go(page + 1), AUTO_INTERVAL)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [page, pageCount, go])

  const resetTimer = () => { if (timerRef.current) clearInterval(timerRef.current) }

  if (total === 0) return null

  const start = page * CARDS_PER_PAGE
  const slice = visiblePosts.slice(start, start + CARDS_PER_PAGE)

  return (
    <div>
      {/* Grid con animación — el key fuerza re-mount al cambiar de página */}
      <div key={animKey} className="carousel-grid">
        {slice.map((post, i) => (
          <Link
            key={post.id}
            to={`/blog/${post.slug}`}
            className="blog-card"
            style={{ '--i': i } as React.CSSProperties}
          >
            {post.tags.length > 0 && (
              <div className="blog-card-tags">
                {post.tags.slice(0, 2).map((t) => (
                  <span key={t} className="blog-card-tag">
                     {/* <Tag size={0} />*/}{t}
                  </span>
                ))}
              </div>
            )}

            <h3 className="blog-card-title">{post.titulo}</h3>

            {post.extracto && (
              <p className="blog-card-excerpt">{post.extracto}</p>
            )}

            <div className="blog-card-footer">
              <div className="blog-card-date">
                <Calendar size={10} />
                {formatDate(post.publishedAt ?? post.createdAt)}
              </div>
              <div className="blog-card-read">
                Leer <ArrowRight size={12} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Controles */}
      {pageCount > 1 && (
        <div className="carousel-controls">
          <button
            aria-label="Anterior"
            className="carousel-arrow"
            onClick={() => { resetTimer(); go(page - 1) }}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="carousel-dots">
            {Array.from({ length: pageCount }).map((_, idx) => (
              <button
                key={idx}
                aria-label={`Página ${idx + 1}`}
                className={`carousel-dot${idx === page ? ' active' : ''}`}
                onClick={() => { resetTimer(); go(idx) }}
              />
            ))}
          </div>

          <button
            aria-label="Siguiente"
            className="carousel-arrow"
            onClick={() => { resetTimer(); go(page + 1) }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────
export function HomePage() {
  const [blogPosts, setBlogPosts] = useState<PublicBlogPost[] | null>(null)

  useEffect(() => {
    let cancelled = false
    let unsubscribe: undefined | (() => void)

    const toPublic = (posts: BlogPost[]): PublicBlogPost[] =>
      posts
        .filter((p) => p.status === 'published')
        .map((p) => ({
          id: p.id,
          titulo: p.titulo,
          slug: p.slug,
          extracto: p.extracto,
          tags: p.tags,
          status: p.status,
          createdAt: p.createdAt,
          publishedAt: p.publishedAt,
        }))

    ;(async () => {
      try {
        const { useBlogStore } = await import('../../store/blogStore')
        if (cancelled) return

        setBlogPosts(toPublic(useBlogStore.getState().posts))
        unsubscribe = useBlogStore.subscribe((state) => {
          if (cancelled) return
          setBlogPosts(toPublic(state.posts))
        })
      } catch {
        if (cancelled) return
        setBlogPosts([])
      }
    })()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])

  return (
    <div className="page-root">
      <SiteHeader />

      <main className="page-main">

        {/* Hero */}
        <section className="section-hero">
          <div className="manifesto-item featured">
            <h1 className="hero-heading">
              Todo lo que necesitas<br />como autónomo,<br />
              <span className="hero-heading-accent">sin complicaciones.</span>
            </h1>
            <p className="hero-sub">Facturas, presupuestos, calculadoras y más.</p>
          </div>
        </section>

        {/* Grid herramientas */}
        <section className="section-pb">
          <p className="section-label">Herramientas disponibles</p>
          <div className="tools-grid">
            {HERRAMIENTAS.map((h) => {
              const Icon = h.icon
              const cardEl = (
                <div className={`card tool-card-inner ${h.accentClass} ${h.activa ? 'card-interactive' : 'card-disabled'}`}>
                  <div className="tool-card-top">
                    <div className="tool-icon-box">
                      <Icon size={18} style={{ color: h.ctaColor }} />
                    </div>
                    {!h.activa && (
                      <span className="badge badge-muted">
                        <Clock size={10} />
                        Próximamente
                      </span>
                    )}
                  </div>

                  <h3 className="card-title" style={{ fontSize: 'var(--text-base)' }}>{h.titulo}</h3>
                  <p className="card-body" style={{ flex: 1 }}>{h.desc}</p>

                  {h.activa && (
                    <div className="tool-cta">
                      <div className="tool-cta-link" style={{ color: h.ctaColor }}>
                        Ir a la herramienta <ArrowRight size={15} />
                      </div>
                      {h.href === '/factura' && (
                        <div className="relative flex items-center">
                          <div className="peer cursor-default">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                          </div>
                          <div className="
                            absolute bottom-full right-0 mb-2 w-56 z-20
                            bg-zinc-900 dark:bg-zinc-800 text-white text-xs
                            rounded-lg px-3 py-2.5 leading-relaxed shadow-lg
                            opacity-0 pointer-events-none
                            peer-hover:opacity-100 peer-hover:pointer-events-auto
                            transition-opacity duration-150
                          ">
                            Esta herramienta genera facturas en formato PDF pero
                            <strong> no está conectada a Verifactu</strong>. En el futuro
                            se integrará con el sistema oficial de la AEAT.
                            <div className="absolute top-full right-3 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-800" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
              return h.activa ? (
                <Link key={h.href} to={h.href} style={{ display: 'block', textDecoration: 'none' }}>
                  {cardEl}
                </Link>
              ) : (
                <div key={h.href}>{cardEl}</div>
              )
            })}
          </div>
        </section>

        {/* Sección Blog */}
        <section className="section-pb">
          <div className="blog-section-header">
            <div>
              <p className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Blog</p>
              <h2 className="blog-section-title">Guías para autónomos</h2>
            </div>
            <Link to="/blog" className="blog-section-link">
              Ver todos los artículos <ArrowRight size={14} />
            </Link>
          </div>

          {blogPosts === null ? (
            <div className="blog-empty">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent', margin: '0 auto var(--space-3)' }} />
              <p>Cargando artículos…</p>
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="blog-empty">
              <BookOpen size={28} style={{ color: 'var(--color-text-faint)', margin: '0 auto var(--space-3)' }} />
              <p>Próximamente publicaremos guías y consejos útiles.</p>
            </div>
          ) : (
            <BlogCarousel posts={blogPosts} />
          )}
        </section>

      </main>

      <SiteFooter />
    </div>
  )
}
