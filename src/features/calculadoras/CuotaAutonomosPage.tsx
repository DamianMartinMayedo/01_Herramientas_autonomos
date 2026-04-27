import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { Calculator, ArrowLeft } from 'lucide-react'
import { useAdminStore } from '../../store/adminStore'

const TRAMOS_2024 = [
  { min: 0,    max: 670,      cuota: 225 },
  { min: 670,  max: 900,      cuota: 250 },
  { min: 900,  max: 1166,     cuota: 267 },
  { min: 1166, max: 1300,     cuota: 291 },
  { min: 1300, max: 1500,     cuota: 294 },
  { min: 1500, max: 1700,     cuota: 294 },
  { min: 1700, max: 1850,     cuota: 310 },
  { min: 1850, max: 2030,     cuota: 315 },
  { min: 2030, max: 2330,     cuota: 320 },
  { min: 2330, max: 2760,     cuota: 330 },
  { min: 2760, max: 3190,     cuota: 350 },
  { min: 3190, max: 3620,     cuota: 370 },
  { min: 3620, max: 4050,     cuota: 390 },
  { min: 4050, max: 6000,     cuota: 415 },
  { min: 6000, max: Infinity, cuota: 500 },
]

function CuotaCalculator() {
  const [ingresos, setIngresos] = useState<number | ''>('')
  const [gastos,   setGastos]   = useState<number | ''>('')
  const pushEvent = useAdminStore(s => s.pushEvent)
  const [tracked, setTracked] = useState(false)

  const handleInput = (val: string, setter: (v: number | '') => void) => {
    setter(val === '' ? '' : Number(val))
    if (!tracked) { pushEvent('tool_use', 'cuota-autonomos'); setTracked(true) }
  }

  const vIngresos = Number(ingresos) || 0
  const vGastos   = Number(gastos) || 0
  const rendimientoNetoPrevio = Math.max(0, vIngresos - vGastos)
  const deduccion             = rendimientoNetoPrevio * 0.07
  const rendimientoNeto       = Math.max(0, rendimientoNetoPrevio - deduccion)
  const tramo = TRAMOS_2024.find(t => rendimientoNeto <= t.max) || TRAMOS_2024[TRAMOS_2024.length - 1]

  return (
    <>
      <div className="tool-page-header">
        <div className="tool-icon-box" style={{ background: 'var(--color-copper-highlight)', color: 'var(--color-copper)' }}>
          <Calculator size={24} />
        </div>
        <div>
          <h1 className="tool-title">Cuota de autónomos</h1>
          <p className="tool-sub">Calcula tu cuota mensual estimada según el nuevo sistema de tramos.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: '1fr 1fr' }}>
          <div className="input-group">
            <label className="input-label">Ingresos mensuales (€)</label>
            <input type="number" className="input-v3" placeholder="0" value={ingresos} onChange={e => handleInput(e.target.value, setIngresos)} />
          </div>
          <div className="input-group">
            <label className="input-label">Gastos mensuales (€)</label>
            <input type="number" className="input-v3" placeholder="0" value={gastos} onChange={e => handleInput(e.target.value, setGastos)} />
          </div>
        </div>

        <div className="calc-precompute">
          <p className="calc-precompute-label">Rendimiento neto computable (incl. 7% deduc.):</p>
          <p className="calc-precompute-value">{rendimientoNeto.toFixed(2)} € / mes</p>
        </div>

        <div className="calc-summary">
          <h3 className="calc-summary-title">Tu cuota estimada (2024)</h3>
          <div className="calc-result" style={{
            background: 'var(--color-copper-highlight)',
            border: '2px solid var(--color-copper)',
          }}>
            <span className="calc-result-value">{tramo.cuota}€</span>
            <span className="calc-result-unit" style={{ color: 'var(--color-copper)' }}>/ mes</span>
          </div>
          <p className="calc-result-note">
            Estimación basada en los tramos de rendimiento neto vigentes. La cuota final puede variar según circunstancias personales.
          </p>
        </div>
      </div>
    </>
  )
}

export function CuotaAutonomosWidget() {
  return (
    <div className="tool-page-inner">
      <CuotaCalculator />
    </div>
  )
}

export function CuotaAutonomosPage() {
  return (
    <div className="page-root">
      <SiteHeader />
      <main className="page-main section-pb">
        <div className="tool-page-inner">
          <nav className="post-breadcrumb">
            <Link to="/" className="back-link"><ArrowLeft size={13} /> Inicio</Link>
          </nav>
          <CuotaCalculator />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
