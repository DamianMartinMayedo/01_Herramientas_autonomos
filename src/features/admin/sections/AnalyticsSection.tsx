/**
 * AnalyticsSection.tsx
 * Métricas: estado GA4 + métricas propias (localStorage) + guía de setup.
 */
import { useState } from 'react'
import { useAdminStore } from '../../../store/adminStore'
import { BarChart3, ExternalLink, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react'

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined

function CopyBox({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    void navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex flex-col gap-2">
      {label && <p className="ga-copy-label">{label}</p>}
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

const GA_SNIPPET = `<!-- Google Analytics 4 — añadir en <head> de index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>`

const ENV_SNIPPET = `# .env.local (nunca subas este archivo a git)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_ADMIN_PIN=tu_pin_seguro`

const GUIDE_STEPS = [
  {
    n: '1',
    title: 'Crea una propiedad GA4',
    body: 'Ve a analytics.google.com → Administrar → Crear propiedad. Selecciona "Web". Copia el Measurement ID (G-XXXXXXXXXX).',
    link: { href: 'https://analytics.google.com', label: 'Ir a Google Analytics' },
  },
  { n: '2', title: 'Añade el snippet a index.html', code: GA_SNIPPET },
  {
    n: '3',
    title: 'Configura las variables de entorno',
    body: 'Crea un archivo .env.local en la raíz del proyecto (ya está en .gitignore):',
    code: ENV_SNIPPET,
  },
  {
    n: '4',
    title: 'En producción (Vercel / Netlify)',
    body: 'Añade las mismas variables en el dashboard de tu hosting. No necesitas cambiar código.',
  },
] as const

export function AnalyticsSection() {
  const events       = useAdminStore((s) => s.events)
  const herramientas = useAdminStore((s) => s.herramientas)

  const now = new Date()
  const h24 = new Date(now); h24.setDate(h24.getDate() - 1)
  const d7  = new Date(now); d7.setDate(d7.getDate() - 7)
  const d30 = new Date(now); d30.setMonth(d30.getMonth() - 1)

  const ev24h = events.filter(e => new Date(e.timestamp) > h24)
  const ev7d  = events.filter(e => new Date(e.timestamp) > d7)
  const ev30d = events.filter(e => new Date(e.timestamp) > d30)

  const pdfExports = events.filter(e => e.tipo === 'pdf_export').length
  const toolUses   = events.filter(e => e.tipo === 'tool_use').length
  const totalUsos  = herramientas.reduce((a, h) => a + h.usosRegistrados, 0)

  return (
    <div className="section-stack">

      <div>
        <h1 className="section-title">Analíticas</h1>
        <p className="section-sub">Métricas propias + integración con Google Analytics 4</p>
      </div>

      <div className={`ga-status${GA_ID ? ' is-active' : ''}`}>
        {GA_ID
          ? <CheckCircle size={18} className="ga-status-icon ga-status-icon--ok" />
          : <AlertCircle size={18} className="ga-status-icon ga-status-icon--warn" />
        }
        <div className="ga-status-body">
          <p className="ga-status-title">
            {GA_ID ? `Google Analytics conectado (${GA_ID})` : 'Google Analytics no configurado'}
          </p>
          <p className="ga-status-text">
            {GA_ID
              ? 'GA4 está activo. Los eventos de navegación se registran automáticamente.'
              : 'Sigue los pasos de abajo para activar GA4. Las métricas propias funcionan sin él.'
            }
          </p>
          {GA_ID && (
            <a
              href={`https://analytics.google.com/analytics/web/#/p${GA_ID.replace('G-', '')}/reports/intelligenthome`}
              target="_blank" rel="noopener noreferrer"
              className="btn btn-sm btn-success ga-status-link"
            >
              Abrir Google Analytics <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      <div>
        <p className="section-block-label">Métricas propias (localStorage)</p>
        <div className="kpi-grid-sm">
          <MetricBox label="Eventos 24h"      value={ev24h.length} sub="últimas 24 horas" />
          <MetricBox label="Eventos 7d"       value={ev7d.length}  sub="últimos 7 días" />
          <MetricBox label="Eventos 30d"      value={ev30d.length} sub="últimos 30 días" />
          <MetricBox label="Usos totales"     value={toolUses}     sub="apertura herramientas" />
          <MetricBox label="PDFs exportados"  value={pdfExports}   sub="desde inicio" />
          <MetricBox label="Total registros"  value={totalUsos}    sub="usos acumulados" />
        </div>
      </div>

      {!GA_ID && (
        <div className="card card-raised ga-guide-card">
          <div className="flex items-center gap-3">
            <BarChart3 size={18} className="text-primary" />
            <h2 className="ga-guide-title">Cómo activar Google Analytics 4</h2>
          </div>

          <div className="flex flex-col gap-5">
            {GUIDE_STEPS.map(step => (
              <div key={step.n} className="ga-guide-step">
                <div className="step-badge">{step.n}</div>
                <div className="ga-guide-step-body">
                  <p className="ga-guide-step-title">{step.title}</p>
                  {'body' in step && step.body && <p className="ga-guide-step-text">{step.body}</p>}
                  {'code' in step && step.code && <CopyBox code={step.code} />}
                  {'link' in step && step.link && (
                    <a href={step.link.href} target="_blank" rel="noopener noreferrer" className="ga-guide-step-link">
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
