import { useState } from 'react'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { Calculator } from 'lucide-react'
import { useAdminStore } from '../../store/adminStore'

export function IvaIrpfPage() {
  const [base, setBase] = useState<string>('')
  const [ivaPrc, setIvaPrc] = useState<number>(21)
  const [irpfPrc, setIrpfPrc] = useState<number>(15)

  const pushEvent = useAdminStore(s => s.pushEvent)
  const [tracked, setTracked] = useState(false)

  const handleBaseChange = (val: string) => {
    setBase(val)
    if (!tracked && val) {
      pushEvent('tool_use', 'iva-irpf')
      setTracked(true)
    }
  }

  const vBase = Number(base) || 0
  const importeIva = vBase * (ivaPrc / 100)
  const importeIrpf = vBase * (irpfPrc / 100)
  const total = vBase + importeIva - importeIrpf

  // Cálculo en reversa: Si ingresan el Total en vez de la base (opcional, para UI futura)
  // Base = Total / (1 + (ivaPrc/100) - (irpfPrc/100))

  return (
    <div className="page-root">
      <SiteHeader />
      <main className="page-main section-pb">
        <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
            <div className="tool-icon-box" style={{ background: 'var(--color-teal-highlight)', color: 'var(--color-teal)' }}>
              <Calculator size={24} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800 }}>Calculadora IVA / IRPF</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Desglosa un importe y descubre cuánto debes reservar para impuestos.</p>
            </div>
          </div>

          <div className="card" style={{ padding: 'var(--space-6)' }}>
            
            <div className="input-group" style={{ marginBottom: 'var(--space-5)' }}>
              <label className="input-label" style={{ fontSize: 'var(--text-base)' }}>Base Imponible (€)</label>
              <input 
                type="number" 
                className="input-v3" 
                placeholder="1000" 
                style={{ fontSize: '1.2rem', padding: 'var(--space-3)' }}
                value={base} 
                onChange={e => handleBaseChange(e.target.value)} 
              />
            </div>

            <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: '1fr 1fr' }}>
              <div className="input-group">
                <label className="input-label">% IVA</label>
                <select className="input-v3" value={ivaPrc} onChange={e => setIvaPrc(Number(e.target.value))}>
                  <option value={21}>21% (General)</option>
                  <option value={10}>10% (Reducido)</option>
                  <option value={4}>4% (Superreducido)</option>
                  <option value={0}>0% (Exento)</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">% IRPF</label>
                <select className="input-v3" value={irpfPrc} onChange={e => setIrpfPrc(Number(e.target.value))}>
                  <option value={15}>15% (General)</option>
                  <option value={7}>7% (Nuevos autónomos)</option>
                  <option value={0}>0% (Sin retención)</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-divider)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3)', background: 'var(--color-surface-offset)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>+ IVA ({ivaPrc}%)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-teal)' }}>
                    + {importeIva.toFixed(2)} €
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-3)', background: 'var(--color-surface-offset)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>- IRPF ({irpfPrc}%)</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-error)' }}>
                    - {importeIrpf.toFixed(2)} €
                  </span>
                </div>
                
                <div style={{
                  marginTop: 'var(--space-3)',
                  background: 'var(--color-teal-highlight)', border: '2px solid var(--color-teal)',
                  padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text)'
                }}>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-teal)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>Total a Facturar / Cobrar</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                    {total.toFixed(2)}€
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
