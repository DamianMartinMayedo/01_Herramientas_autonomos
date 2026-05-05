import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteHeader } from '../../components/layout/SiteHeader'
import { SiteFooter } from '../../components/layout/SiteFooter'
import { Calculator, ArrowLeft } from 'lucide-react'
import { useAdminStore } from '../../store/adminStore'
import { Seo } from '../../components/seo/Seo'

export function IvaIrpfCalculator() {
  const [baseImponible, setBaseImponible]   = useState<number | ''>('')
  const [tipoIva, setTipoIva]               = useState<number | ''>(21)
  const [retencionIrpf, setRetencionIrpf]   = useState<number | ''>(15)
  const pushEvent = useAdminStore(s => s.pushEvent)
  const [tracked, setTracked] = useState(false)

  const handleInput = (val: string, setter: (v: number | '') => void) => {
    setter(val === '' ? '' : Number(val))
    if (!tracked) { pushEvent('tool_use', 'iva-irpf'); setTracked(true) }
  }

  const vBase    = Number(baseImponible) || 0
  const vIva     = Number(tipoIva) || 0
  const vIrpf    = Number(retencionIrpf) || 0
  const cuotaIva        = vBase * (vIva / 100)
  const retencion       = vBase * (vIrpf / 100)
  const totalFactura    = vBase + cuotaIva
  const liquidoPercibir = totalFactura - retencion

  return (
    <>
      <Seo
        title="Calculadora IVA e IRPF para autónomos"
        description="Calcula el IVA a repercutir y la retención de IRPF de tus facturas. Herramienta gratuita para autónomos."
      />
      <div className="tool-page-header">
        <div className="tool-icon-box" style={{ background: 'var(--color-teal-highlight)', color: 'var(--color-teal)' }}>
          <Calculator size={24} />
        </div>
        <div>
          <h1 className="tool-title">Calculadora IVA / IRPF</h1>
          <p className="tool-sub">Calcula el IVA a repercutir y la retención de IRPF de tu factura.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <div className="input-group">
            <label className="input-label">Base imponible (€)</label>
            <input type="number" className="input-v3" placeholder="1000" value={baseImponible} onChange={e => handleInput(e.target.value, setBaseImponible)} />
          </div>
          <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: '1fr 1fr' }}>
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
        </div>

        {/* Desglose */}
        <div className="calc-summary" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>Desglose de la factura</h3>

          {[
            { label: 'Base imponible',              value: vBase,        muted: true },
            { label: `IVA (${vIva}%)`,               value: cuotaIva,     muted: true },
            { label: 'Total factura',                value: totalFactura, bold: true },
            { label: `Retención IRPF (${vIrpf}%)`,  value: -retencion,   muted: true },
          ].map(({ label, value, muted, bold }) => (
            <div key={label} className="calc-row">
              <span style={{ color: muted ? 'var(--color-text-muted)' : 'var(--color-text)', fontWeight: bold ? 700 : 400 }}>{label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: bold ? 700 : 500 }}>
                {value >= 0 ? '' : '−'}{Math.abs(value).toFixed(2)} €
              </span>
            </div>
          ))}

          <div className="calc-result" style={{
            background: 'var(--color-teal-highlight)',
            border: '2px solid var(--color-teal)',
          }}>
            <p className="calc-result-label" style={{ color: 'var(--color-teal)' }}>Líquido a percibir</p>
            <span className="calc-result-value">{liquidoPercibir.toFixed(2)}€</span>
          </div>

          <p className="calc-result-note">
            El IVA recaudado deberás ingresarlo en Hacienda trimestralmente (modelo 303). La retención la abonará directamente el cliente.
          </p>
        </div>
      </div>
    </>
  )
}

export function IvaIrpfWidget() {
  return (
    <div className="tool-page-inner">
      <IvaIrpfCalculator />
    </div>
  )
}

export function IvaIrpfPage() {
  return (
    <div className="page-root">
      <SiteHeader />
      <main className="page-main section-pb">
        <div className="tool-page-inner">
          <nav className="post-breadcrumb">
            <Link to="/" className="back-link"><ArrowLeft size={13} /> Inicio</Link>
          </nav>
          <IvaIrpfCalculator />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
