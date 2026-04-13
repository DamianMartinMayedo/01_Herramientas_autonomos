import { Link } from 'react-router-dom'
import { FileText, Calculator, ArrowRight, Wrench } from 'lucide-react'

const HERRAMIENTAS = [
  {
    href: '/factura',
    icon: FileText,
    titulo: 'Generador de facturas',
    desc: 'Crea facturas con IVA e IRPF y descárgalas en PDF.',
    activa: true,
  },
  {
    href: '/presupuesto',
    icon: FileText,
    titulo: 'Generador de presupuestos',
    desc: 'Envía presupuestos profesionales a tus clientes.',
    activa: true,
  },
  {
    href: '/cuota-autonomos',
    icon: Calculator,
    titulo: 'Calculadora cuota autónomos',
    desc: 'Calcula tu cuota mensual según tus ingresos netos.',
    activa: false,
  },
  {
    href: '/precio-hora',
    icon: Calculator,
    titulo: 'Calculadora precio/hora',
    desc: 'Fija tu tarifa sin venderte por debajo de coste.',
    activa: false,
  },
  {
    href: '/iva-irpf',
    icon: Calculator,
    titulo: 'Calculadora IVA/IRPF',
    desc: 'Separa base imponible, IVA e IRPF de cualquier importe.',
    activa: false,
  },
] as const

export function HomePage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-teal-700" />
          <span className="font-bold text-stone-800 tracking-tight">HerramientasAutonomos.es</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-stone-900 mb-2">
            Herramientas gratuitas para autónomos
          </h1>
          <p className="text-stone-500 text-base">
            Sin registro. Sin bases de datos. Directo al grano.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {HERRAMIENTAS.map((h) => {
            const Icon = h.icon
            const card = (
              <div
                className={[
                  'bg-white rounded-xl border p-5 group transition-all duration-150',
                  h.activa
                    ? 'border-stone-200 hover:border-teal-300 hover:shadow-md cursor-pointer'
                    : 'border-stone-100 opacity-60',
                ].join(' ')}
              >
                <div className="flex items-start justify-between mb-3">
                  <Icon className="w-5 h-5 text-teal-700 mt-0.5" />
                  {!h.activa && (
                    <span className="text-xs bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full">
                      Próximamente
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-semibold text-stone-800 mb-1">{h.titulo}</h2>
                <p className="text-xs text-stone-500 leading-relaxed">{h.desc}</p>
                {h.activa && (
                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-teal-700 group-hover:gap-2 transition-all">
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
    </div>
  )
}
