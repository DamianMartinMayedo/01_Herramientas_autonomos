import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { Calculator, ArrowLeft } from 'lucide-react'
import { useAdminStore } from '../../store/adminStore'

export function PrecioHoraCalculator() {
  const [salarioNeto,          setSalarioNeto]          = useState<number | ''>('')
  const [gastosMensuales,      setGastosMensuales]      = useState<number | ''>('')
  const [horasSemanales,       setHorasSemanales]       = useState<number | ''>(40)
  const [porcentajeFacturable, setPorcentajeFacturable] = useState<number | ''>(60)
  const [vacacionesSemanas,    setVacacionesSemanas]    = useState<number | ''>(4)
  const pushEvent = useAdminStore(s => s.pushEvent)
  const [tracked, setTracked] = useState(false)

  const handleInput = (val: string, setter: (v: number | '') => void) => {
    setter(val === '' ? '' : Number(val))
    if (!tracked) { pushEvent('tool_use', 'precio-hora'); setTracked(true) }
  }

  const vSalario    = Number(salarioNeto) || 0
  const vGastos     = Number(gastosMensuales) || 0
  const vHoras      = Number(horasSemanales) || 0
  const vPorcentaje = Number(porcentajeFacturable) || 0
  const vVacaciones = Number(vacacionesSemanas) || 0

  const COSTO_IMPUESTOS_AGREGADO  = 1.30
  const gastosTotalMensual        = vSalario * COSTO_IMPUESTOS_AGREGADO + vGastos
  const gastosAnuales             = gastosTotalMensual * 12
  const semanasLaborables         = Math.max(0, 52 - vVacaciones)
  const horasTotalesAnuales       = vHoras * semanasLaborables
  const horasFacturablesAnuales   = horasTotalesAnuales * (vPorcentaje / 100)
  const precioHora                = horasFacturablesAnuales > 0 ? (gastosAnuales / horasFacturablesAnuales) : 0

  return (
    <>
      <div className="tool-page-header">
        <div className="tool-icon-box" style={{ background: 'var(--color-purple-highlight)', color: 'var(--color-purple)' }}>
          <Calculator size={24} />
        </div>
        <div>
          <h1 className="tool-title">Precio por hora</h1>
          <p className="tool-sub">Descubre a cuánto deberías cobrar la hora para que te salgan los números.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
            <div className="input-group">
              <label className="input-label">Sueldo neto deseado (€/mes)</label>
              <input type="number" className="input-v3" placeholder="1500" value={salarioNeto} onChange={e => handleInput(e.target.value, setSalarioNeto)} />
            </div>
            <div className="input-group">
              <label className="input-label">Gastos fijos (€/mes)</label>
              <input type="number" className="input-v3" placeholder="200" title="Software, cuotas, gestoría..." value={gastosMensuales} onChange={e => handleInput(e.target.value, setGastosMensuales)} />
            </div>
          </div>

          <div className="calc-divider" />

          <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="input-group">
              <label className="input-label">Horas/sem</label>
              <input type="number" className="input-v3" placeholder="40" value={horasSemanales} onChange={e => handleInput(e.target.value, setHorasSemanales)} />
            </div>
            <div className="input-group">
              <label className="input-label">% Facturable</label>
              <input type="number" className="input-v3" placeholder="60" value={porcentajeFacturable} onChange={e => handleInput(e.target.value, setPorcentajeFacturable)} />
            </div>
            <div className="input-group">
              <label className="input-label">Vacaciones</label>
              <input type="number" className="input-v3" placeholder="4" title="Semanas de vacaciones al año" value={vacacionesSemanas} onChange={e => handleInput(e.target.value, setVacacionesSemanas)} />
            </div>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-text-faint)' }}>
            *% Facturable: parte del tiempo dedicado a clientes (facturable). El resto va a gestión, formación, ventas, etc. Un estimado razonable es 60%.
          </p>
        </div>

        <div className="calc-summary">
          <h3 className="calc-summary-title">Tu tarifa mínima recomendada</h3>
          <div className="calc-result" style={{
            background: 'var(--color-purple-highlight)',
            border: '2px solid var(--color-purple)',
          }}>
            <span className="calc-result-value">{precioHora.toFixed(2)}€</span>
            <span className="calc-result-unit" style={{ color: 'var(--color-purple)' }}>/ hora</span>
          </div>
          <div className="calc-row" style={{ marginTop: 'var(--space-4)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Mínimo facturación mensual:</span>
            <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{gastosTotalMensual.toFixed(2)} €</span>
          </div>
          <div className="calc-row">
            <span style={{ color: 'var(--color-text-muted)' }}>Horas facturables al mes:</span>
            <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{(horasFacturablesAnuales / 12).toFixed(1)} h</span>
          </div>
        </div>
      </div>
    </>
  )
}

export function PrecioHoraWidget() {
  return (
    <div className="tool-page-inner">
      <PrecioHoraCalculator />
    </div>
  )
}

export function PrecioHoraPage() {
  return (
    <div className="page-root">
      <SiteHeader />
      <main className="page-main section-pb">
        <div className="tool-page-inner">
          <nav className="post-breadcrumb">
            <Link to="/" className="back-link"><ArrowLeft size={13} /> Inicio</Link>
          </nav>
          <PrecioHoraCalculator />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
