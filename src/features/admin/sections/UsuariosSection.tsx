/**
 * UsuariosSection.tsx
 * Sección de usuarios. Placeholder con roadmap para cuando haya auth real.
 */
import { useAdminStore } from '../../../store/adminStore'
import { Users, Shield, Clock, TrendingUp, ExternalLink } from 'lucide-react'

export function UsuariosSection() {
  const events = useAdminStore((s) => s.events)

  // Sesiones únicas aproximadas (eventos en ventanas de 30min)
  const uniqueSessions = (() => {
    if (events.length === 0) return 0
    let sessions = 1
    for (let i = 1; i < events.length; i++) {
      const diff = new Date(events[i - 1].timestamp).getTime() - new Date(events[i].timestamp).getTime()
      if (diff > 30 * 60 * 1000) sessions++
    }
    return sessions
  })()

  const toolEvents = events.filter(e => e.tipo === 'tool_use' || e.tipo === 'pdf_export')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>

      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>
          Usuarios
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          HerramientasAutonomos no tiene sistema de cuentas actualmente — la app es completamente anónima.
        </p>
      </div>

      {/* Estado actual */}
      <div style={{
        background: 'var(--color-surface)', border: '2px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)', padding: 'var(--space-8)',
        boxShadow: '4px 4px 0 var(--color-border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-5)',
        textAlign: 'center',
      }}>
        <div style={{
          width: '56px', height: '56px',
          background: 'var(--color-surface-offset)',
          border: '2px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Users size={22} style={{ color: 'var(--color-text-muted)' }} />
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
            Sin sistema de autenticación
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', maxWidth: '420px', lineHeight: 1.7 }}>
            Los usuarios usan la plataforma de forma anónima, sin registro. Todos los datos se procesan en su navegador — nunca llegan a ningún servidor.
          </p>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-4)',
          background: 'var(--color-success-highlight)',
          border: '1.5px solid var(--color-success)',
          borderRadius: 'var(--radius-full)',
          fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-success)',
        }}>
          <Shield size={12} />
          Privacidad total para el usuario final
        </div>
      </div>

      {/* Métricas de sesiones aproximadas */}
      <div>
        <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 'var(--space-4)' }}>
          Métricas de sesiones (estimación local)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 'var(--space-4)' }}>
          {[
            { label: 'Sesiones aprox.', value: uniqueSessions, icon: Users, sub: 'en este navegador' },
            { label: 'Interacciones', value: toolEvents.length, icon: TrendingUp, sub: 'usos y exportaciones' },
            { label: 'Eventos totales', value: events.length, icon: Clock, sub: 'últimos 30 días' },
          ].map(({ label, value, icon: Icon, sub }) => (
            <div key={label} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <Icon size={16} style={{ color: 'var(--color-text-faint)' }} />
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 'var(--space-1)' }}>{label}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1 }}>{value}</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap */}
      <div style={{
        background: 'var(--color-surface)', border: '2px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)',
        boxShadow: '4px 4px 0 var(--color-border)',
      }}>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-5)' }}>
          Roadmap: autenticación (cuando sea necesario)
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {[
            { title: 'Google / GitHub OAuth via Supabase', desc: 'Una sola línea de configuración. Sin contraseñas que gestionar. El usuario se registra con su cuenta existente.', tag: 'Recomendado' },
            { title: 'Guardado de documentos en la nube', desc: 'Con auth activo, cada usuario tiene su propia tabla de facturas y presupuestos en Supabase. Row Level Security garantiza que solo ven sus datos.' },
            { title: 'Historial de exportaciones', desc: 'Registro de todos los PDFs generados por usuario, con posibilidad de regenerarlos.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <div style={{ width: '20px', height: '20px', flexShrink: 0, borderRadius: 'var(--radius-full)', background: 'var(--color-surface-offset)', border: '2px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--color-text-faint)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                {i + 1}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text)' }}>{item.title}</span>
                  {item.tag && <span className="badge badge-primary" style={{ fontSize: '10px', padding: '1px 7px' }}>{item.tag}</span>}
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <a href="https://supabase.com/docs/guides/auth" target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: 'var(--space-5)', fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
          Documentación de Supabase Auth <ExternalLink size={11} />
        </a>
      </div>
    </div>
  )
}
