import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { Calculator, ArrowLeft } from 'lucide-react'
import { useAdminStore } from '../../store/adminStore'

function PrecioHoraCalculator() {
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
    <>
      <div className="tool-page-header">
        <div className="tool-icon-box" style={{ background: 'var(--color-purple-highlight)', color: 'var(--color-purple)' }}>
          <Calculator size={24} />
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800 }}>Precio por hora</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Descubre a cuánto deberías cobrar la hora para que te salgan los números.</p>
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

          <div style={{ borderTop: '1px solid var(--color-divider)', margin: 'var(--space-2) 0' }} />

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

        <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-divider)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>Tu tarifa mínima recomendada</h3>
          <div style={{
            background: 'var(--color-purple-highlight)',
            border: '2px solid var(--color-purple)',
            padding: 'var(--space-5)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-text)',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
              {precioHora.toFixed(2)}€
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-purple)', marginLeft: 'var(--space-2)', fontWeight: 600 }}>/ hora</span>
          </div>
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Mínimo facturación mensual:</span>
            <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{gastosTotalMensual.toFixed(2)} €</span>
          </div>
          <div style={{ marginTop: 'var(--space-2)', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Horas facturables al mes:</span>
            <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{(horasFacturablesAnuales / 12).toFixed(1)} h</span>
          </div>
        </div>
      </div>
    </>
  )
}

/** Widget reutilizable sin header/footer — para usar dentro del panel de usuario */
export function PrecioHoraWidget() {
  return (
    <div className="tool-page-inner">
      <PrecioHoraCalculator />
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
          <PrecioHoraCalculator />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
