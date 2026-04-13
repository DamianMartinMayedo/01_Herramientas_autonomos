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
    colorDark: '#1e3a5f',
    colorLight: '#dbeafe',
    colorMid: '#3b82f6',
    tag: 'Documentos',
  },
  {
    href: '/presupuesto',
    icon: FileText,
    titulo: 'Generador de presupuestos',
    desc: 'Envía presupuestos profesionales a tus clientes en minutos.',
    activa: true,
    colorDark: '#14532d',
    colorLight: '#dcfce7',
    colorMid: '#22c55e',
    tag: 'Documentos',
  },
  {
    href: '/cuota-autonomos',
    icon: Calculator,
    titulo: 'Cuota de autónomos',
    desc: 'Calcula tu cuota mensual según tus ingresos netos reales.',
    activa: false,
    colorDark: '#78350f',
    colorLight: '#fef3c7',
    colorMid: '#f59e0b',
    tag: 'Calculadoras',
  },
  {
    href: '/precio-hora',
    icon: Calculator,
    titulo: 'Precio por hora',
    desc: 'Fija tu tarifa sin venderte por debajo de coste.',
    activa: false,
    colorDark: '#4c1d95',
    colorLight: '#ede9fe',
    colorMid: '#8b5cf6',
    tag: 'Calculadoras',
  },
  {
    href: '/iva-irpf',
    icon: Calculator,
    titulo: 'IVA / IRPF',
    desc: 'Separa base imponible, IVA e IRPF de cualquier importe.',
    activa: false,
    colorDark: '#881337',
    colorLight: '#ffe4e6',
    colorMid: '#f43f5e',
    tag: 'Calculadoras',
  },
] as const

export function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-200">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-zinc-400" />
            <span
              className="font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight text-sm"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              HerramientasAutonomos.es
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5">

        {/* ── Hero banner ──────────────────────────────────────────────── */}
        <section className="py-16 md:py-20">
          <div
            className="rounded-2xl px-8 py-12 md:px-14 md:py-16 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%)',
            }}
          >
            {/* Decoración de fondo */}
            <div
              className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }}
            />
            <div
              className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #34d399, transparent)' }}
            />

            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
                <Zap className="w-3.5 h-3.5" />
                Gratuito · Sin registro · Sin base de datos
              </div>
              <h1
                className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Todo lo que necesitas<br />como autónomo,<br />
                <span className="text-blue-300">gratis y sin complicaciones.</span>
              </h1>
              <p className="text-white/60 text-base md:text-lg leading-relaxed">
                Facturas, presupuestos, calculadoras de cuota e IRPF.
                Sin suscripciones, sin datos personales, directo al grano.
              </p>
            </div>
          </div>
        </section>

        {/* ── Grid de herramientas ─────────────────────────────────────── */}
        <section className="pb-20">
          <h2
            className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-6"
          >
            Herramientas disponibles
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {HERRAMIENTAS.map((h) => {
              const Icon = h.icon

              const card = (
                <div
                  className={[
                    'rounded-2xl border p-6 group transition-all duration-200 flex flex-col',
                    h.activa
                      ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                      : 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-100 dark:border-zinc-900 opacity-50 select-none',
                  ].join(' ')}
                >
                  {/* Icono + tag */}
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: h.colorLight + (h.activa ? '40' : '20') }}
                    >
                      <Icon className="w-5 h-5" style={{ color: h.colorMid }} />
                    </div>
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: h.colorLight + '40',
                        color: h.colorDark,
                      }}
                    >
                      {h.activa ? h.tag : 'Próximamente'}
                    </span>
                  </div>

                  {/* Título */}
                  <h3
                    className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2 leading-snug"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {h.titulo}
                  </h3>

                  {/* Descripción */}
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed flex-1">
                    {h.desc}
                  </p>

                  {/* CTA */}
                  {h.activa && (
                    <div
                      className="mt-5 flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2.5 transition-all duration-150"
                      style={{ color: h.colorMid }}
                    >
                      Ir a la herramienta
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              )

              return h.activa ? (
                <Link key={h.href} to={h.href} className="block">{card}</Link>
              ) : (
                <div key={h.href}>{card}</div>
              )
            })}
          </div>
        </section>

      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-100 dark:border-zinc-900">
        <div className="max-w-5xl mx-auto px-5 py-6 text-center">
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            © {new Date().getFullYear()} HerramientasAutonomos.es — Herramientas gratuitas para autónomos en España
          </p>
        </div>
      </footer>

    </div>
  )
}
