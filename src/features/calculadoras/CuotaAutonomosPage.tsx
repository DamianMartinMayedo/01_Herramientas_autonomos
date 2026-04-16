import { useState } from 'react'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { Calculator } from 'lucide-react'
import { useAdminStore } from '../../store/adminStore'

// Tramos aproximados 2024
const TRAMOS_2024 = [
  { min: 0,    max: 670,  cuota: 225 },
  { min: 670,  max: 900,  cuota: 250 },
  { min: 900,  max: 1166, cuota: 267 },
  { min: 1166, max: 1300, cuota: 291 },
  { min: 1300, max: 1500, cuota: 294 },
  { min: 1500, max: 1700, cuota: 294 },
  { min: 1700, max: 1850, cuota: 310 },
  { min: 1850, max: 2030, cuota: 315 },
  { min: 2030, max: 2330, cuota: 320 },
  { min: 2330, max: 2760, cuota: 330 },
  { min: 2760, max: 3190, cuota: 350 },
  { min: 3190, max: 3620, cuota: 370 },
  { min: 3620, max: 4050, cuota: 390 },
  { min: 4050, max: 6000, cuota: 415 },
  { min: 6000, max: Infinity, cuota: 500 },
]

export function CuotaAutonomosPage() {
  const [ingresos, setIngresos] = useState<number | ''>('')
  const [gastos, setGastos] = useState<number | ''>('')

  // Track event on first interaction
  const pushEvent = useAdminStore(s => s.pushEvent)
  const [tracked, setTracked] = useState(false)

  const handleInput = (val: string, setter: (v: number | '') => void) => {
    setter(val === '' ? '' : Number(val))
    if (!tracked) {
      pushEvent('tool_use', 'cuota-autonomos')
      setTracked(true)
    }
  }

  const vIngresos = Number(ingresos) || 0
  const vGastos = Number(gastos) || 0

  // Cálculo de rendimiento neto previo (Ingresos - Gastos)
  const rendimientoNetoPrevio = Math.max(0, vIngresos - vGastos)
  // Deducción por gastos de difícil justificación (7% con tope, simplificado aquí al 7% directo)
  const deduccion = rendimientoNetoPrevio * 0.07 
  const rendimientoNeto = Math.max(0, rendimientoNetoPrevio - deduccion)

  const tramo = TRAMOS_2024.find(t => rendimientoNeto <= t.max) || TRAMOS_2024[TRAMOS_2024.length - 1]

  return (
    <div className="page-root">
      <SiteHeader />
      <main className="page-main section-pb">
        <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            <div className="tool-icon-box" style={{ background: 'var(--color-copper-highlight)', color: 'var(--color-copper)' }}>
              <Calculator size={24} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800 }}>Cuota de autónomos</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Calcula tu cuota mensual estimada según el nuevo sistema de tramos.</p>
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: '1fr 1fr' }}>
              <div className="input-group">
                <label className="input-label">Ingresos mensuales (€)</label>
                <input 
                  type="number" 
                  className="input-v3" 
                  placeholder="0" 
                  value={ingresos} 
                  onChange={e => handleInput(e.target.value, setIngresos)} 
                />
              </div>
              <div className="input-group">
                <label className="input-label">Gastos mensuales (€)</label>
                <input 
                  type="number" 
                  className="input-v3" 
                  placeholder="0" 
                  value={gastos} 
                  onChange={e => handleInput(e.target.value, setGastos)} 
                />
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--color-surface-offset)', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
                Rendimiento neto computable (incl. 7% deduc.):
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-lg)', fontWeight: 600 }}>
                {rendimientoNeto.toFixed(2)} € / mes
              </p>
            </div>

            <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-divider)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>Tu cuota estimada (2024)</h3>
              
              <div style={{
                background: 'var(--color-copper-highlight)',
                border: '2px solid var(--color-copper)',
                padding: 'var(--space-5)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--color-text)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                  {tramo.cuota}€
                </span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-copper)', marginLeft: 'var(--space-2)', fontWeight: 600 }}>/ mes</span>
              </div>
              
              <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                Esta es una estimación basada en los tramos de rendimiento neto vigentes. La cuota final puede variar según circunstancias personales (tarifa plana, bonificaciones, etc.).
              </p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
