import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { Calculator, ArrowLeft } from 'lucide-react'
import { useAdminStore } from '../../store/adminStore'

/** Widget reutilizable sin header/footer — para usar dentro del panel de usuario */
export function PrecioHoraWidget() {
  const [salarioNeto, setSalarioNeto] = useState<number | ''>('')
  const [gastosMensuales, setGastosMensuales] = useState<number | ''>('')
  const [horasSemanales, setHorasSemanales] = useState<number | ''>(40)
  const [porcentajeFacturable, setPorcentajeFacturable] = useState<number | ''>(60)
  const [vacacionesSemanas, setVacacionesSemanas] = useState<number | ''>(4)
  const pushEvent = useAdminStore(s => s.pushEvent)
  const [tracked, setTracked] = useState(false)

  const handleInput = (val: string, setter: (v: number | '') => void) => {
    setter(val === '' ? '' : Number(val))
    if (!tracked) {
      pushEvent('tool_use', 'precio-hora')
      setTracked(true)
    }
  }

  const vSalario = Number(salarioNeto) || 0
  const vGastos = Number(gastosMensuales) || 0
  const vHorasSemanales = Number(horasSemanales) || 0
  const vPorcentaje = Number(porcentajeFacturable) || 0
  const vVacaciones = Number(vacacionesSemanas) || 0
  const COSTO_IMPUESTOS_AGREGADO = 1.30
  const gastosTotalMensual = vSalario * COSTO_IMPUESTOS_AGREGADO + vGastos
  const gastosAnuales = gastosTotalMensual * 12
  const semanasLaborables = Math.max(0, 52 - vVacaciones)
  const horasTotalesAnuales = vHorasSemanales * semanasLaborables
  const horasFacturablesAnuales = horasTotalesAnuales * (vPorcentaje / 100)
  const precioHora = horasFacturablesAnuales > 0 ? (gastosAnuales / horasFacturablesAnuales) : 0

  return (
    <div className="tool-page-inner">
      <div className="tool-page-header">
        <div className="tool-icon-box" style={{ background: 'var(--color-purple-highlight)', color: 'var(--color-purple)' }}>
          <Calculator size={24} />
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800 }}>Precio por hora</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Descubre a cuánto deberías cobrar la hora para que te salgan los números.</p>
        </div>
      </div>

      <div className="card" style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="input-group">
          <label className="input-label">Sueldo neto deseado (€/mes)</label>
          <input type="number" className="input-v3" placeholder="1500" value={salarioNeto} onChange={e => handleInput(e.target.value, setSalarioNeto)} />
        </div>
        <div className="input-group">
          <label className="input-label">Gastos fijos (€/mes)</label>
          <input type="number" className="input-v3" placeholder="200" value={gastosMensuales} onChange={e => handleInput(e.target.value, setGastosMensuales)} />
        </div>
        <div className="input-group">
          <label className="input-label">Horas/sem</label>
          <input type="number" className="input-v3" placeholder="40" value={horasSemanales} onChange={e => handleInput(e.target.value, setHorasSemanales)} />
        </div>
        <div className="input-group">
          <label className="input-label">% Facturable</label>
          <input type="number" className="input-v3" placeholder="60" value={porcentajeFacturable} onChange={e => handleInput(e.target.value, setPorcentajeFacturable)} />
        </div>
        <div className="input-group">
          <label className="input-label">Vacaciones (semanas)</label>
          <input type="number" className="input-v3" placeholder="4" value={vacacionesSemanas} onChange={e => handleInput(e.target.value, setVacacionesSemanas)} />
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-3)' }}>Tu tarifa mínima recomendada</h3>
        <p className="result-highlight">
          <span className="result-value">{precioHora.toFixed(2)}€</span>
          <span className="result-unit">/ hora</span>
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Mínimo facturación mensual: <strong>{gastosTotalMensual.toFixed(2)} €</strong></p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Horas facturables al mes: <strong>{(horasFacturablesAnuales / 12).toFixed(1)} h</strong></p>
        </div>
      </div>
    </div>
  )
}

/** Página completa con header/footer — para usar como ruta standalone */
export function PrecioHoraPage() {
  return (
    <div className="page-root">
      <SiteHeader />
      <main className="page-main section-pb">
        <div className="tool-page-inner">
          <nav className="post-breadcrumb">
            <Link to="/" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={13} /> Inicio
            </Link>
          </nav>
          <PrecioHoraWidget />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
