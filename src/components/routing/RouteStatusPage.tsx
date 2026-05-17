import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react'

interface RouteStatusPageProps {
  title: string
  description: string
}

export function RouteStatusPage({ title, description }: RouteStatusPageProps) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--space-6)',
        background: 'var(--color-bg)',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '32rem',
          background: 'var(--color-surface)',
          border: '2px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '4px 4px 0 var(--color-border)',
          padding: 'var(--space-10)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '3rem',
            height: '3rem',
            margin: '0 auto var(--space-4)',
            borderRadius: '999px',
            display: 'grid',
            placeItems: 'center',
            background: 'var(--color-gold-subtle)',
            color: 'var(--color-gold)',
          }}
        >
          <AlertTriangle size={20} />
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 700,
            color: 'var(--color-text)',
            marginBottom: 'var(--space-3)',
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontSize: 'var(--text-sm)',
            lineHeight: 1.6,
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-6)',
          }}
        >
          {description}
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--space-3)',
            flexWrap: 'wrap',
          }}
        >
          <Link to="/" className="btn btn-primary btn-sm">
            <Home size={14} /> Volver al inicio
          </Link>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.history.back()}>
            <ArrowLeft size={14} /> Pagina anterior
          </button>
        </div>
      </section>
    </main>
  )
}
