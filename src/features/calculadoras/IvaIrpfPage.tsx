import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { Calculator, ArrowLeft } from 'lucide-react'
import { useAdminStore } from '../../store/adminStore'

/** Widget reutilizable sin header/footer — para usar dentro del panel de usuario */
export function IvaIrpfWidget() {
  const [baseImponible, setBaseImponible] = useState<number | ''>('')
  const [tipoIva, setTipoIva] = useState<number | ''>(21)
  const [retencionIrpf, setRetencionIrpf] = useState<number | ''>(15)
  const pushEvent = useAdminStore(s => s.pushEvent)
  const [tracked, setTracked] = useState(false)

  const handleInput = (val: string, setter: (v: number | '') => void) => {
    setter(val === '' ? '' : Number(val))
    if (!tracked) {
      pushEvent('tool_use', 'iva-irpf')
      setTracked(true)
    }
  }

  const vBase = Number(baseImponible) || 0
  const vIva = Number(tipoIva) || 0
  const vIrpf = Number(retencionIrpf) || 0
  const cuotaIva = vBase * (vIva / 100)
  const retencion = vBase * (vIrpf / 100)
  const totalFactura = vBase + cuotaIva
  const liquidoPercibir = totalFactura - retencion

  return (
    <div className="tool-page-inner">
      <div className="tool-page-header">
        <div className="tool-icon-box" style={{ background: 'var(--color-teal-highlight)', color: 'var(--color-teal)' }}>
          <Calculator size={24} />
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800 }}>Calculadora IVA / IRPF</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Calcula el IVA a repercutir y la retención de IRPF de tu factura.</p>
        </div>
      </div>

      <div className="card" style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: '1fr 1fr' }}>
        <div className="input-group">
          <label className="input-label">Base imponible (€)</label>
          <input type="number" className="input-v3" placeholder="1000" value={baseImponible} onChange={e => handleInput(e.target.value, setBaseImponible)} />
        </div>
        <div className="input-group">
          <label className="input-label">Tipo de IVA (%)</label>
          <select className="select-v3" value={tipoIva} onChange={e => handleInput(e.target.value, setTipoIva)}>
            <option value={21}>21% — General</option>
            <option value={10}>10% — Reducido</option>
            <option value={4}>4% — Superreducido</option>
            <option value={0}>0% — Exento</option>
          </select>
        </div>
        <div className="input-group">
          <label className="input-label">Retención IRPF (%)</label>
          <select className="select-v3" value={retencionIrpf} onChange={e => handleInput(e.target.value, setRetencionIrpf)}>
            <option value={15}>15% — General</option>
            <option value={7}>7% — Nuevos autónomos</option>
            <option value={0}>0% — Sin retención</option>
          </select>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-3)' }}>Desglose de la factura</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {[
            { label: 'Base imponible',          value: vBase,          muted: true },
            { label: `IVA (${vIva}%)`,           value: cuotaIva,       muted: true },
            { label: 'Total factura',            value: totalFactura,   bold: true },
            { label: `Retención IRPF (${vIrpf}%)`, value: -retencion, muted: true },
          ].map(({ label, value, muted, bold }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ color: muted ? 'var(--color-text-muted)' : 'var(--color-text)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: bold ? 700 : 400 }}>{label}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: bold ? 700 : 400, color: value < 0 ? 'var(--color-error)' : 'var(--color-text)' }}>
                {value >= 0 ? '' : '−'}{Math.abs(value).toFixed(2)} €
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)' }}>Líquido a percibir</span>
          <span className="result-value">{liquidoPercibir.toFixed(2)}€</span>
        </div>
      </div>
    </div>
  )
}

/** Página completa con header/footer — para usar como ruta standalone */
export function IvaIrpfPage() {
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
          <IvaIrpfWidget />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
