import { useRef, useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Calculator, ArrowRight, AlertTriangle, BookOpen, Calendar, Tag, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { useAdminStore } from '../../store/adminStore'

/*
  Paleta de 6 colores para cards de herramientas
  ─────────────────────────────────────────────
  1. card-accent-primary  → azul       (#1A5FC8)
  2. card-accent-success  → verde      (#53a61c)
  3. card-accent-copper   → cobre      (#A56227)
  4. card-accent-purple   → violeta    (#6D3BB8)
  5. card-accent-teal     → esmeralda  (#0F7E72)
  6. card-accent-gold     → oro ámbar  (#B07B00)

  A las herramientas nuevas se les asignará cualquiera de estos 6 accentClass.
*/

const HERRAMIENTAS = [
  {
    href: '/factura',
    icon: FileText,
    titulo: 'Generador de facturas',
    desc: 'Crea facturas con IVA e IRPF y descárgalas en PDF al instante.',
    activa: true,
    accentClass: 'card-accent-primary',
    badgeClass: 'badge-primary',
    ctaColor: 'var(--color-primary)',
    tag: 'Documentos',
  },
  {
    href: '/presupuesto',
    icon: FileText,
    titulo: 'Generador de presupuestos',
    desc: 'Envía presupuestos profesionales a tus clientes en minutos.',
    activa: true,
    accentClass: 'card-accent-success',
    badgeClass: 'badge-success',
    ctaColor: 'var(--color-success)',
    tag: 'Documentos',
  },
  {
    href: '/cuota-autonomos',
    icon: Calculator,
    titulo: 'Cuota de autónomos',
    desc: 'Calcula tu cuota mensual según tus ingresos netos reales.',
    activa: false,
    accentClass: 'card-accent-copper',
    badgeClass: 'badge-copper',
    ctaColor: 'var(--color-copper)',
    tag: 'Calculadoras',
  },
  {
    href: '/precio-hora',
    icon: Calculator,
    titulo: 'Precio por hora',
    desc: 'Fija tu tarifa sin venderte por debajo de coste.',
    activa: false,
    accentClass: 'card-accent-purple',
    badgeClass: 'badge-purple',
    ctaColor: 'var(--color-purple)',
    tag: 'Calculadoras',
  },
  {
    href: '/iva-irpf',
    icon: Calculator,
    titulo: 'IVA / IRPF',
    desc: 'Separa base imponible, IVA e IRPF de cualquier importe.',
    activa: false,
    accentClass: 'card-accent-teal',
    badgeClass: 'badge-teal',
    ctaColor: 'var(--color-teal)',
    tag: 'Calculadoras',
  },
] as const

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(iso))
}

// ── Carrusel de blog ─────────────────────────────────────────────────────────────────────────
const CARDS_PER_PAGE = 3
const AUTO_INTERVAL = 5000

function BlogCarousel({ posts }: { posts: ReturnType<typeof useAdminStore.getState>['posts'] }) {
  const total = Math.min(posts.length, 9)
  const visiblePosts = posts.slice(0, total)
  const pageCount = Math.ceil(total / CARDS_PER_PAGE)
  const [page, setPage] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const go = useCallback((next: number) => {
    setPage(((next % pageCount) + pageCount) % pageCount)
  }, [pageCount])

  // Auto-avance
  useEffect(() => {
    if (pageCount <= 1) return
    timerRef.current = setInterval(() => go(page + 1), AUTO_INTERVAL)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [page, pageCount, go])

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  if (total === 0) return null

  const start = page * CARDS_PER_PAGE
  const slice = visiblePosts.slice(start, start + CARDS_PER_PAGE)

  return (
    <div>
      {/* Tarjetas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px,100%), 1fr))',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-5)',
      }}>
        {slice.map((post) => (
          <Link key={post.id} to={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
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
              {post.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  {post.tags.slice(0, 2).map((t) => (
                    <span key={t} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontSize: 'var(--text-xs)', fontWeight: 600,
                      color: 'var(--color-primary)',
                      background: 'var(--color-primary-highlight)',
                      padding: '2px 8px', borderRadius: 'var(--radius-full)',
                    }}><Tag size={8} />{t}</span>
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
                {post.titulo}
              </h3>

              {post.extracto && (
                <p style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.5,
                  marginBottom: 'var(--space-4)',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {post.extracto}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
                  <Calendar size={10} />
                  {formatDate(post.publishedAt ?? post.createdAt)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-primary)' }}>
                  Leer <ArrowRight size={12} />
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>

      {/* Controles: flechas + puntos */}
      {pageCount > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)' }}>
          {/* Flecha izquierda */}
          <button
            aria-label="Anterior"
            onClick={() => { resetTimer(); go(page - 1) }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px',
              borderRadius: 'var(--radius-full)',
              border: '2px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'background var(--transition-interactive), color var(--transition-interactive)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-offset)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--color-text)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--color-surface)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)'
            }}
          >
            <ChevronLeft size={16} />
          </button>

          {/* Puntos */}
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {Array.from({ length: pageCount }).map((_, idx) => (
              <button
                key={idx}
                aria-label={`Página ${idx + 1}`}
                onClick={() => { resetTimer(); go(idx) }}
                style={{
                  width: idx === page ? '20px' : '8px',
                  height: '8px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: idx === page ? 'var(--color-primary)' : 'var(--color-border)',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'width 220ms ease, background 220ms ease',
                }}
              />
            ))}
          </div>

          {/* Flecha derecha */}
          <button
            aria-label="Siguiente"
            onClick={() => { resetTimer(); go(page + 1) }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px',
              borderRadius: 'var(--radius-full)',
              border: '2px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'background var(--transition-interactive), color var(--transition-interactive)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-offset)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--color-text)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--color-surface)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)'
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────────────────────
export function HomePage() {
  const allPosts = useAdminStore((s) => s.posts)
  const blogPosts = allPosts.filter((p) => p.status === 'published')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', transition: 'background var(--transition-slow)' }}>

      {/* Header */}
      <header className="site-header">
        <div className="site-header-inner">
          <div className="site-logo">HerramientasAutonomos</div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
            <Link
              to="/blog"
              style={{
                fontSize: 'var(--text-sm)', fontWeight: 600,
                color: 'var(--color-text-muted)', textDecoration: 'none',
                transition: 'color var(--transition-interactive)',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            >
              Blog
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 'var(--content-wide)', margin: '0 auto', padding: '0 var(--space-6) var(--space-16)' }}>

        {/* Hero */}
        <section style={{ padding: 'var(--space-12) 0 var(--space-12)' }}>
          <div className="manifesto-item featured" style={{ padding: '50px' }}>
            <div style={{ position: 'relative', zIndex: 1, maxWidth: '100%' }}>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-2xl)',
                fontWeight: 800,
                color: 'white',
                marginBottom: 'var(--space-5)',
                lineHeight: 1.15,
              }}>
                Todo lo que necesitas<br />como autónomo,<br />
                <span style={{ color: 'var(--color-primary-light)' }}>sin complicaciones.</span>
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'var(--text-base)', lineHeight: 1.7 }}>
                Facturas, presupuestos, calculadoras y más.
              </p>
            </div>
          </div>
        </section>

        {/* Grid herramientas */}
        <section style={{ paddingBottom: 'var(--space-20)' }}>
          <p className="section-label">Herramientas disponibles</p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'var(--space-4)',
          }}>
            {HERRAMIENTAS.map((h) => {
              const Icon = h.icon
              const cardEl = (
                <div
                  className={`card ${h.accentClass} ${h.activa ? 'card-interactive' : 'card-disabled'}`}
                  style={{ display: 'flex', flexDirection: 'column' }}
                >
                  {/* Fila superior: icono + badge */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
                    <div style={{
                      width: '40px', height: '40px',
                      background: 'var(--color-surface-offset)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1.5px solid var(--color-border)',
                    }}>
                      <Icon size={18} style={{ color: h.ctaColor }} />
                    </div>

                    {/* Badge: Próximamente (solo en inactivas) */}
                    {!h.activa && (
                      <span className="badge badge-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={10} />
                        Próximamente
                      </span>
                    )}
                  </div>

                  <h3 className="card-title" style={{ fontSize: 'var(--text-base)' }}>{h.titulo}</h3>
                  <p className="card-body" style={{ flex: 1 }}>{h.desc}</p>

                  {/* CTA + aviso Verifactu (solo en activas) */}
                  {h.activa && (
                    <div style={{
                      marginTop: 'var(--space-5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 'var(--space-3)',
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                        fontSize: 'var(--text-sm)', fontWeight: 600,
                        color: h.ctaColor, transition: 'gap var(--transition)',
                      }}>
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

        {/* Sección Blog — carrusel */}
        <section style={{ paddingBottom: 'var(--space-20)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div>
              <p className="section-label" style={{ marginBottom: 'var(--space-2)' }}>Blog</p>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-xl)',
                fontWeight: 800,
                color: 'var(--color-text)',
                lineHeight: 1.2,
              }}>
                Guías para autónomos
              </h2>
            </div>
            <Link
              to="/blog"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
                fontSize: 'var(--text-sm)', fontWeight: 600,
                color: 'var(--color-primary)', textDecoration: 'none',
              }}
            >
              Ver todos los artículos <ArrowRight size={14} />
            </Link>
          </div>

          {blogPosts.length === 0 ? (
            <div style={{
              padding: 'var(--space-12)',
              textAlign: 'center',
              background: 'var(--color-surface)',
              border: '2px dashed var(--color-border)',
              borderRadius: 'var(--radius-xl)',
            }}>
              <BookOpen size={28} style={{ color: 'var(--color-text-faint)', margin: '0 auto var(--space-3)' }} />
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                Próximamente publicaremos guías y consejos útiles.
              </p>
            </div>
          ) : (
            <BlogCarousel posts={blogPosts} />
          )}
        </section>

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
