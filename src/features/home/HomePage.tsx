import { useRef, useState, useEffect, useCallback } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { RouteLoading } from '../../components/routing/RouteLoading'
import { FileText, Calculator, ArrowRight, AlertTriangle, BookOpen, Calendar, ChevronLeft, ChevronRight, Clock, Scroll, ShieldCheck, BadgeAlert, Truck, FileCheck, Download, UserPlus, Crown } from 'lucide-react'
import type { BlogPost } from '../../types/blog'
import type { Herramienta } from '../../types/herramienta'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { useHerramientas } from '../../hooks/useHerramientas'
import { useBlogPosts } from '../../hooks/useBlogPosts'
import { Seo } from '../../components/seo/Seo'

/*
  Paleta de acentos de card — SOLO usar variables que existen en index.css
  → --color-primary  (azul)
  → --color-success  (verde)
  → --color-copper   (cobre)
  → --color-purple   (violeta)
  → --color-teal     (esmeralda)
  → --color-gold     (oro ámbar)
*/
const HERRAMIENTA_META: Record<string, {
  icon: React.ElementType
  accentClass: string
  ctaColor: string   // debe coincidir 1:1 con el color del acento
}> = {
  factura:           { icon: FileText,    accentClass: 'card-accent-primary', ctaColor: 'var(--color-primary)' },
  presupuesto:       { icon: FileText,    accentClass: 'card-accent-success', ctaColor: 'var(--color-success)' },
  albaran:           { icon: Truck,       accentClass: 'card-accent-copper',  ctaColor: 'var(--color-copper)'  },
  contrato:          { icon: Scroll,      accentClass: 'card-accent-purple',  ctaColor: 'var(--color-purple)'  },
  nda:               { icon: ShieldCheck, accentClass: 'card-accent-teal',    ctaColor: 'var(--color-teal)'    },
  reclamacion:       { icon: BadgeAlert,  accentClass: 'card-accent-gold',    ctaColor: 'var(--color-gold)'    },
  'cuota-autonomos': { icon: Calculator,  accentClass: 'card-accent-copper',  ctaColor: 'var(--color-copper)'  },
  'precio-hora':     { icon: Calculator,  accentClass: 'card-accent-purple',  ctaColor: 'var(--color-purple)'  },
  'iva-irpf':        { icon: Calculator,  accentClass: 'card-accent-teal',    ctaColor: 'var(--color-teal)'    },
}

const FALLBACK_META = { icon: FileText, accentClass: 'card-accent-primary', ctaColor: 'var(--color-primary)' }

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(iso))
}

// ── Blog Carousel ──────────────────────────────────────────────────────────────────
const CARDS_PER_PAGE = 3
const AUTO_INTERVAL  = 5000

type PublicBlogPost = Pick<BlogPost, 'id' | 'titulo' | 'slug' | 'extracto' | 'tags' | 'status' | 'created_at' | 'published_at'>

function BlogCarousel({ posts }: { posts: PublicBlogPost[] }) {
  const total        = Math.min(posts.length, 9)
  const visiblePosts = posts.slice(0, total)
  const pageCount    = Math.ceil(total / CARDS_PER_PAGE)
  const [page, setPage]     = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const go = useCallback((next: number) => {
    const target = ((next % pageCount) + pageCount) % pageCount
    setPage(target)
    setAnimKey(k => k + 1)
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
                {post.tags.slice(0, 2).map(t => (
                  <span key={t} className="blog-card-tag">{t}</span>
                ))}
              </div>
            )}
            <h3 className="blog-card-title">{post.titulo}</h3>
            {post.extracto && <p className="blog-card-excerpt">{post.extracto}</p>}
            <div className="blog-card-footer">
              <div className="blog-card-date">
                <Calendar size={10} />
                {formatDate(post.published_at ?? post.created_at)}
              </div>
              <div className="blog-card-read">Leer <ArrowRight size={12} /></div>
            </div>
          </Link>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="carousel-controls">
          <button aria-label="Anterior" className="carousel-arrow" onClick={() => { resetTimer(); go(page - 1) }}>
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
          <button aria-label="Siguiente" className="carousel-arrow" onClick={() => { resetTimer(); go(page + 1) }}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── ToolCard ───────────────────────────────────────────────────────────────────────
function ToolCard({ h }: { h: Herramienta }) {
  const meta = HERRAMIENTA_META[h.id] ?? FALLBACK_META
  const Icon = meta.icon
  const isActive = h.estado === 'active'

  const cardEl = (
    <div className={`card tool-card-inner ${meta.accentClass} ${isActive ? 'card-interactive' : 'card-disabled'}`}>
      <div className="tool-card-top">
        <div className="tool-icon-box">
          <Icon size={18} style={{ color: meta.ctaColor }} />
        </div>
        <div className="flex items-center gap-1">
          {h.plan_required === 'premium' && (
            <span className="badge badge-gold"><Crown size={10} /> Premium</span>
          )}
          {h.plan_required === 'free' && !h.anon_available && (
            <span className="badge badge-primary">Registro</span>
          )}
          {h.estado === 'maintenance' && (
            <span className="badge badge-gold"><AlertTriangle size={10} /> Mejorando</span>
          )}
          {h.estado === 'coming_soon' && (
            <span className="badge badge-muted"><Clock size={10} /> Próximamente</span>
          )}
        </div>
      </div>

      <h3 className="card-title" style={{ fontSize: 'var(--text-base)' }}>{h.nombre}</h3>
      <p className="card-body">{h.descripcion}</p>

      {isActive && (
        <div className="tool-cta">
          <div className="tool-cta-link" style={{ color: meta.ctaColor }}>
            Ir a la herramienta <ArrowRight size={15} />
          </div>
          {h.id === 'factura' && (
            <div className="tooltip-wrap">
              <AlertTriangle className="tooltip-warn-icon" />
              <div className="tooltip-content">
                Esta herramienta genera facturas en formato PDF pero
                <strong> no está conectada a Verifactu</strong>. En el futuro
                se integrará con el sistema oficial de la AEAT.
                <div className="tooltip-arrow" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )

  return isActive ? (
    <Link to={h.ruta} className="link-block">
      {cardEl}
    </Link>
  ) : (
    <div>{cardEl}</div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────────────
export function HomePage() {
  const { user, loading } = useAuth()
  const { data: herramientas } = useHerramientas()
  const { data: posts } = useBlogPosts()

  const blogPosts: PublicBlogPost[] = posts.map(p => ({
    id: p.id, titulo: p.titulo, slug: p.slug, extracto: p.extracto,
    tags: p.tags, status: p.status, created_at: p.created_at, published_at: p.published_at,
  }))

  if (loading) return <RouteLoading />
  if (user) return <Navigate to="/usuario" replace />

  const visibles = herramientas.filter(h => h.visible !== false)

  const sortTools = (a: Herramienta, b: Herramienta) => {
    const priorityIds = ['factura', 'presupuesto']
    const aPrio = priorityIds.includes(a.id)
    const bPrio = priorityIds.includes(b.id)
    if (aPrio && !bPrio) return -1
    if (!aPrio && bPrio) return 1
    if (a.estado === 'active' && b.estado !== 'active') return -1
    if (a.estado !== 'active' && b.estado === 'active') return 1
    return 0
  }

  const byCategoria: Record<string, { items: Herramienta[], hasActive: boolean }> = {}
  for (const h of visibles) {
    if (!byCategoria[h.categoria]) byCategoria[h.categoria] = { items: [], hasActive: false }
    byCategoria[h.categoria].items.push(h)
    if (h.estado === 'active') byCategoria[h.categoria].hasActive = true
  }

  const categoriasOrdenadas = Object.entries(byCategoria)
    .map(([cat, info]) => ({
      id: cat,
      label: ({ documentos: 'Documentos', contratos: 'Contratos y acuerdos', calculadoras: 'Calculadoras' } as Record<string,string>)[cat] ?? cat,
      items: info.items.sort(sortTools),
      hasActive: info.hasActive,
    }))
    .sort((a, b) => (a.hasActive === b.hasActive ? 0 : a.hasActive ? -1 : 1))

  return (
    <div className="page-root">
      <Seo
        title="Herramientas para autónomos"
        description="Crea facturas, presupuestos, contratos y calculadoras fiscales online. Sin complicaciones."
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'HerramientasAutonomos.es',
            url: 'https://herramientasautonomos.es/',
            description: 'Herramientas para autónomos: facturas, presupuestos, contratos, calculadoras fiscales y más.',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://herramientasautonomos.es/?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'HerramientasAutonomos.es',
            url: 'https://herramientasautonomos.es/',
            sameAs: [],
          },
        ]}
      />
      <SiteHeader />
      <main className="page-main">

        {/* Hero compacto */}
        <section className="section-hero section-hero--compact">
          <div className="manifesto-item featured">
            <h1 className="hero-heading hero-heading--compact">
              Herramientas para autónomos,<br />
              <span className="hero-heading-accent">sin complicaciones.</span>
            </h1>
            <p className="hero-sub" style={{ marginBottom: 'var(--space-6)' }}>Facturas, presupuestos, contratos, calculadoras y más.</p>
            <button
              className="btn btn-white"
              onClick={() => window.dispatchEvent(new CustomEvent('ha:open-auth', { detail: { view: 'register' } }))}
            >
              Crear cuenta gratis
            </button>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="how-it-works-section">
          <div className="how-it-works-grid">
            <div className="how-it-works-step how-it-works-step--simple">
              <div className="how-it-works-icon how-it-works-icon--simple">
                <FileCheck size={18} />
              </div>
              <h3 className="how-it-works-title how-it-works-title--simple">Elige tu herramienta</h3>
              <p className="how-it-works-desc how-it-works-desc--simple">Facturas, presupuestos, contratos, calculadoras y más.</p>
            </div>
            <div className="how-it-works-step how-it-works-step--simple">
              <div className="how-it-works-icon how-it-works-icon--simple">
                <Download size={18} />
              </div>
              <h3 className="how-it-works-title how-it-works-title--simple">Rellena los datos</h3>
              <p className="how-it-works-desc how-it-works-desc--simple">Completa la información de tu documento o introduce los valores.</p>
            </div>
            <div className="how-it-works-step how-it-works-step--simple">
              <div className="how-it-works-icon how-it-works-icon--simple">
                <UserPlus size={18} />
              </div>
              <h3 className="how-it-works-title how-it-works-title--simple">Descarga o regístrate</h3>
              <p className="how-it-works-desc how-it-works-desc--simple">Descarga en PDF o regístrate para guardar y gestionar después.</p>
            </div>
          </div>
        </section>

        {/* Grid herramientas por categoría */}
        <section className="section-pb">
          {categoriasOrdenadas.map(cat => (
            <div key={cat.id} style={{ marginTop: 'var(--space-10)' }}>
              <h2 className="section-block-label">{cat.label}</h2>
              <div className="tools-grid">
                {cat.items.map(h => <ToolCard key={h.id} h={h} />)}
              </div>
            </div>
          ))}
        </section>

        {/* CTA registro */}
        <section className="section-pb">
          <div className="register-cta-box">
            <h2 className="register-cta-title">Lleva tu gestión al siguiente nivel</h2>
            <p className="register-cta-sub">Regístrate gratis y accede a todas las herramientas: guarda tus documentos, gestiona clientes, lleva tu contabilidad y mucho más.</p>
            <button
              className="btn btn-white-copper"
              onClick={() => window.dispatchEvent(new CustomEvent('ha:open-auth', { detail: { view: 'register' } }))}
            >
              Registrarme ahora
            </button>
          </div>
        </section>

        {/* Blog */}
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
              <div className="spinner spinner-md spinner-primary" style={{ margin: '0 auto var(--space-3)' }} />
              <p>Cargando artículos…</p>
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="blog-empty">
              <BookOpen size={28} className="blog-empty-icon" />
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
