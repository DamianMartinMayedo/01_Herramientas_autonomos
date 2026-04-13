import { Link } from 'react-router-dom'
import { FileText, Calculator, ArrowRight, Wrench, AlertTriangle } from 'lucide-react'
import { ThemeToggle } from '../../components/ui/ThemeToggle'

const HERRAMIENTAS = [
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
    disclaimer: null,
  },
  {
    href: '/factura',
    icon: FileText,
    titulo: 'Plantilla de factura',
    desc: 'Plantilla de referencia para uso interno (no válida fiscalmente).',
    activa: true,
    colorDark: '#1e3a5f',
    colorLight: '#dbeafe',
    colorMid: '#3b82f6',
    tag: 'Plantilla',
    disclaimer: 'Esta plantilla no tiene validez fiscal en España. Es solo para referencia interna. Para facturación legal, consulta con tu gestor o usa software certificado Verifactu.',
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
    disclaimer: null,
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
    disclaimer: null,
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
    disclaimer: null,
  },
] as const

export function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
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

      {/* ── Hero banner ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.08),transparent_50%)]" />
        
        <div className="relative max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-zinc-800/50 dark:bg-zinc-900/50 border border-zinc-700 dark:border-zinc-800 rounded-full px-4 py-1.5 mb-6">
            <span className="text-xs text-zinc-400">Sin registro · Sin instalación</span>
          </div>

          <h1
            className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Presupuestos profesionales
            <br />
            <span className="text-blue-400">y herramientas de gestión</span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Crea presupuestos, calcula costes y gestiona tu negocio de forma sencilla.
          </p>
        </div>
      </div>

      {/* ── Grid de herramientas ──────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 py-14">
        <h2
          className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Herramientas disponibles
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {HERRAMIENTAS.map((h) => {
            const Icon = h.icon

            const card = (
              <div
                className={[
                  'rounded-xl border p-5 group transition-all duration-200 relative',
                  h.activa
                    ? 'cursor-pointer bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md hover:-translate-y-0.5'
                    : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-900 opacity-50',
                ].join(' ')}
              >
                {/* Disclaimer icon (solo para factura) */}
                {h.disclaimer && (
                  <div className="absolute top-3 right-3 group/tooltip">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <div className="invisible group-hover/tooltip:visible absolute right-0 top-8 w-64 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-lg shadow-lg z-10">
                      <p className="text-xs text-amber-900 dark:text-amber-100 leading-relaxed">
                        {h.disclaimer}
                      </p>
                    </div>
                  </div>
                )}

                {/* Icono con color de herramienta */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: h.colorLight + '18' }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: h.colorMid }}
                    />
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{
                      backgroundColor: h.colorLight + '30',
                      color: h.colorMid,
                    }}
                  >
                    {h.activa ? h.tag : 'Próximamente'}
                  </span>
                </div>

                {/* Texto */}
                <h3
                  className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {h.titulo}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{h.desc}</p>

                {/* CTA */}
                {h.activa && (
                  <div
                    className="mt-4 flex items-center gap-1.5 text-sm font-medium group-hover:gap-2.5 transition-all duration-150"
                    style={{ color: h.colorMid }}
                  >
                    Ir a la herramienta
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            )

            return h.activa ? (
              <Link key={h.href} to={h.href}>{card}</Link>
            ) : (
              <div key={h.href}>{card}</div>
            )
          })}
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-200 dark:border-zinc-900 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-600">
            © {new Date().getFullYear()} HerramientasAutonomos.es — Herramientas para autónomos en España
          </p>
        </div>
      </footer>

    </div>
  )
}
