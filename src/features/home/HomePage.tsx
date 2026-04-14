import { Link } from 'react-router-dom'
import { FileText, Calculator, ArrowRight, Wrench, Zap } from 'lucide-react'
import { ThemeToggle } from '../../components/ui/ThemeToggle'

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
    accentClass: 'card-accent-primary',
    badgeClass: 'badge-muted',
    ctaColor: 'var(--color-primary)',
    tag: 'Calculadoras',
  },
  {
    href: '/iva-irpf',
    icon: Calculator,
    titulo: 'IVA / IRPF',
    desc: 'Separa base imponible, IVA e IRPF de cualquier importe.',
    activa: false,
    accentClass: 'card-accent-primary',
    badgeClass: 'badge-error',
    ctaColor: 'var(--color-error)',
    tag: 'Calculadoras',
  },
] as const

export function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', transition: 'background var(--transition-slow)' }}>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="site-header">
        <div className="site-header-inner">
          <div className="site-logo">
            <Wrench size={15} style={{ color: 'var(--color-text-faint)' }} />
            HerramientasAutonomos.es
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main style={{ maxWidth: 'var(--content-wide)', margin: '0 auto', padding: '0 var(--space-6) var(--space-16)' }}>

        {/* ── Hero ─────────────────────────────────────────────────────────────── */}
        <section style={{ padding: 'var(--space-12) 0 var(--space-12)' }}>
          <div
            className="manifesto-item featured"
            style={
              {padding: '80px 50px'}
            }
          >
    

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
              <div className="badge" style={{
                background: 'rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.85)',
                marginBottom: 'var(--space-6)',
              }}>
                <Zap size={13} />
                Sin registro · Sin base de datos
              </div>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-2xl)',
                fontWeight: 800,
                color: 'white',
                marginBottom: 'var(--space-5)',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
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

        {/* ── Grid de herramientas ─────────────────────────────────────────────── */}
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
                  className={`card ${h.accentClass} ${h.activa ? 'card-interactive' : ''}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: h.activa ? 1 : 0.52,
                    cursor: h.activa ? 'pointer' : 'default',
                    userSelect: h.activa ? undefined : 'none',
                  }}
                >
                  {/* Icono + badge */}
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
                    <span className={`badge ${h.badgeClass}`}>
                      {h.activa ? h.tag : 'Próximamente'}
                    </span>
                  </div>

                  {/* Título */}
                  <h3 className="card-title" style={{ fontSize: 'var(--text-base)' }}>
                    {h.titulo}
                  </h3>

                  {/* Descripción */}
                  <p className="card-body" style={{ flex: 1 }}>
                    {h.desc}
                  </p>

                  {/* CTA */}
                  {h.activa && (
                    <div style={{
                      marginTop: 'var(--space-5)',
                      display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                      fontSize: 'var(--text-sm)', fontWeight: 600,
                      color: h.ctaColor,
                      transition: 'gap var(--transition)',
                    }}>
                      Ir a la herramienta
                      <ArrowRight size={15} />
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

      </main>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--color-divider)' }}>
        <div style={{
          maxWidth: 'var(--content-wide)', margin: '0 auto',
          padding: 'var(--space-6)', textAlign: 'center',
        }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)' }}>
            © {new Date().getFullYear()} HerramientasAutonomos.es — Herramientas para autónomos en España
          </p>
        </div>
      </footer>
    </div>
  )
}
