/**
 * AnalyticsSection.tsx
 * Métricas: GA4 setup + enlace al dashboard real + eventos locales propios.
 */
import { useState } from 'react'
import { useAdminStore } from '../../../store/adminStore'
import { BarChart3, ExternalLink, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react'

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined

function CopyBox({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex flex-col gap-2">
      {label && <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</p>}
      <div className="code-box">
        <pre>{code}</pre>
        <button onClick={copy} className="code-box-copy">
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
    </div>
  )
}

function MetricBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card card-raised-sm">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  )
}

export function AnalyticsSection() {
  const events       = useAdminStore((s) => s.events)
  const herramientas = useAdminStore((s) => s.herramientas)

  const now  = new Date()
  const h24  = new Date(now); h24.setDate(h24.getDate() - 1)
  const d7   = new Date(now); d7.setDate(d7.getDate() - 7)
  const d30  = new Date(now); d30.setMonth(d30.getMonth() - 1)

  const ev24h = events.filter(e => new Date(e.timestamp) > h24)
  const ev7d  = events.filter(e => new Date(e.timestamp) > d7)
  const ev30d = events.filter(e => new Date(e.timestamp) > d30)

  const pdfExports = events.filter(e => e.tipo === 'pdf_export').length
  const toolUses   = events.filter(e => e.tipo === 'tool_use').length
  const totalUsos  = herramientas.reduce((a, h) => a + h.usosRegistrados, 0)

  const gaSnippet = `<!-- Google Analytics 4 — añadir en <head> de index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>`

  const envSnippet = `# .env.local (nunca subas este archivo a git)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_ADMIN_PIN=tu_pin_seguro`

  return (
    <div className="section-stack">

      <div>
        <h1 className="section-title">Analíticas</h1>
        <p className="section-sub">Métricas propias + integración con Google Analytics 4</p>
      </div>

      {/* Estado GA4 — colores dinámicos según GA_ID */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)',
        padding: 'var(--space-5)',
        background: GA_ID ? 'var(--color-success-subtle)' : 'var(--color-surface)',
        border: `2px solid ${GA_ID ? 'var(--color-success)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: `3px 3px 0px 0px ${GA_ID ? 'var(--color-success-active)' : 'var(--color-border)'}`,
      }}>
        {GA_ID
          ? <CheckCircle size={18} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
          : <AlertCircle size={18} style={{ color: 'var(--color-copper)', flexShrink: 0, marginTop: '2px' }} />
        }
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>
            {GA_ID ? `Google Analytics conectado (${GA_ID})` : 'Google Analytics no configurado'}
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            {GA_ID
              ? 'GA4 está activo. Los eventos de navegación se registran automáticamente.'
              : 'Sigue los pasos de abajo para activar GA4. Las métricas propias funcionan sin él.'
            }
          </p>
          {GA_ID && (
            <a
              href={`https://analytics.google.com/analytics/web/#/p${GA_ID.replace('G-', '')}/reports/intelligenthome`}
              target="_blank" rel="noopener noreferrer"
              className="btn btn-sm btn-success"
              style={{ marginTop: 'var(--space-3)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', textDecoration: 'none' }}
            >
              Abrir Google Analytics <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* Métricas propias */}
      <div>
        <p className="section-block-label">Métricas propias (localStorage)</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--space-4)' }}>
          <MetricBox label="Eventos 24h"      value={ev24h.length}  sub="últimas 24 horas" />
          <MetricBox label="Eventos 7d"       value={ev7d.length}   sub="últimos 7 días" />
          <MetricBox label="Eventos 30d"      value={ev30d.length}  sub="últimos 30 días" />
          <MetricBox label="Usos totales"     value={toolUses}      sub="apertura herramientas" />
          <MetricBox label="PDFs exportados"  value={pdfExports}    sub="desde inicio" />
          <MetricBox label="Total registros"  value={totalUsos}     sub="usos acumulados" />
        </div>
      </div>

      {/* Guía de configuración GA4 */}
      {!GA_ID && (
        <div className="card card-raised" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="flex items-center gap-3">
            <BarChart3 size={18} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)' }}>
              Cómo activar Google Analytics 4
            </h2>
          </div>

          <div className="flex flex-col gap-5">
            {[
              {
                n: '1',
                title: 'Crea una propiedad GA4',
                body: 'Ve a analytics.google.com → Administrar → Crear propiedad. Selecciona "Web". Copia el Measurement ID (G-XXXXXXXXXX).',
                link: { href: 'https://analytics.google.com', label: 'Ir a Google Analytics' },
              },
              {
                n: '2',
                title: 'Añade el snippet a index.html',
                code: gaSnippet,
              },
              {
                n: '3',
                title: 'Configura las variables de entorno',
                body: 'Crea un archivo .env.local en la raíz del proyecto (ya está en .gitignore):',
                code: envSnippet,
              },
              {
                n: '4',
                title: 'En producción (Vercel / Netlify)',
                body: 'Añade las mismas variables en el dashboard de tu hosting. No necesitas cambiar código.',
              },
            ].map(step => (
              <div key={step.n} className="flex gap-4">
                <div className="step-badge">{step.n}</div>
                <div className="flex flex-col gap-3" style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{step.title}</p>
                  {step.body && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{step.body}</p>}
                  {step.code && <CopyBox code={step.code} label="" />}
                  {step.link && (
                    <a href={step.link.href} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
                    >
                      {step.link.label} <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
