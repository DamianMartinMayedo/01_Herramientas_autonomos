import { Link } from 'react-router-dom'
import { FileText, Calculator, ArrowRight, Wrench } from 'lucide-react'

const HERRAMIENTAS = [
  {
    href: '/factura',
    icon: FileText,
    titulo: 'Generador de facturas',
    desc: 'Crea facturas con IVA e IRPF y descárgalas en PDF.',
    activa: true,
    colorDark: '#1e3a5f',
    colorLight: '#dbeafe',
    colorMid: '#3b82f6',
  },
  {
    href: '/presupuesto',
    icon: FileText,
    titulo: 'Generador de presupuestos',
    desc: 'Envía presupuestos profesionales a tus clientes.',
    activa: true,
    colorDark: '#14532d',
    colorLight: '#dcfce7',
    colorMid: '#22c55e',
  },
  {
    href: '/cuota-autonomos',
    icon: Calculator,
    titulo: 'Calculadora cuota autónomos',
    desc: 'Calcula tu cuota mensual según tus ingresos netos.',
    activa: false,
    colorDark: '#78350f',
    colorLight: '#fef3c7',
    colorMid: '#f59e0b',
  },
  {
    href: '/precio-hora',
    icon: Calculator,
    titulo: 'Calculadora precio/hora',
    desc: 'Fija tu tarifa sin venderte por debajo de coste.',
    activa: false,
    colorDark: '#4c1d95',
    colorLight: '#ede9fe',
    colorMid: '#8b5cf6',
  },
  {
    href: '/iva-irpf',
    icon: Calculator,
    titulo: 'Calculadora IVA/IRPF',
    desc: 'Separa base imponible, IVA e IRPF de cualquier importe.',
    activa: false,
    colorDark: '#881337',
    colorLight: '#ffe4e6',
    colorMid: '#f43f5e',
  },
] as const

export function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2.5">
          <Wrench className="w-4 h-4 text-zinc-400" />
          <span
            className="font-semibold text-zinc-100 tracking-tight text-sm"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            HerramientasAutonomos.es
          </span>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 py-14">

        <div className="mb-12">
          <h1
            className="text-3xl font-bold text-zinc-50 mb-3 leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Herramientas gratuitas<br />para autónomos
          </h1>
          <p className="text-zinc-400 text-base">
            Sin registro. Sin bases de datos. Directo al grano.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {HERRAMIENTAS.map((h) => {
            const Icon = h.icon

            const card = (
              <div
                className={[
                  'rounded-xl border p-5 group transition-all duration-200',
                  h.activa
                    ? 'cursor-pointer bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                    : 'bg-zinc-900/50 border-zinc-900 opacity-50',
                ].join(' ')}
              >
                {/* Icono con color de herramienta */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: h.colorLight + '18' }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: h.colorMid }}
                    />
                  </div>
                  {!h.activa && (
                    <span className="text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
                      Próximamente
                    </span>
                  )}
                </div>

                {/* Texto */}
                <h2
                  className="text-sm font-semibold text-zinc-100 mb-1.5"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {h.titulo}
                </h2>
                <p className="text-xs text-zinc-500 leading-relaxed">{h.desc}</p>

                {/* CTA */}
                {h.activa && (
                  <div
                    className="mt-4 flex items-center gap-1 text-xs font-medium group-hover:gap-2 transition-all duration-150"
                    style={{ color: h.colorMid }}
                  >
                    Ir a la herramienta
                    <ArrowRight className="w-3.5 h-3.5" />
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

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-900 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} HerramientasAutonomos.es — Herramientas gratuitas para autónomos en España
          </p>
        </div>
      </footer>

    </div>
  )
}
