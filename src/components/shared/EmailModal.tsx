/**
 * EmailModal.tsx
 * Modal de envío por correo electrónico.
 * Componente compartido para DocumentEngine y LegalDocEngine.
 * Acepta uno o varios correos separados por comas.
 * El campo se autorellena con el email del cliente/receptor si está disponible.
 */
import { useState, useRef, useEffect } from 'react'
import { X, Mail, Send, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '../ui/Button'

interface EmailModalProps {
  /** Email del cliente/receptor para autorellenar (opcional) */
  emailCliente?: string
  /** Nombre del documento para mostrarlo en el texto de ayuda */
  nombreDocumento?: string
  onClose: () => void
}

/** Valida un email individual */
function esEmailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/** Parsea el input de correos separados por comas y devuelve lista limpia */
function parsearCorreos(input: string): string[] {
  return input
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
}

export function EmailModal({ emailCliente, nombreDocumento, onClose }: EmailModalProps) {
  const [inputCorreos, setInputCorreos] = useState(emailCliente ?? '')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus automático al abrir
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const correos = parsearCorreos(inputCorreos)
  const correosInvalidos = correos.filter((e) => !esEmailValido(e))
  const puedeEnviar = correos.length > 0 && correosInvalidos.length === 0

  const handleEnviar = async () => {
    if (!puedeEnviar) return
    setEnviando(true)
    setError(null)

    // ── Mock: simula llamada async al backend ──
    // TODO: conectar con servicio real de envío de email (SendGrid, Resend, etc.)
    await new Promise((resolve) => setTimeout(resolve, 1200))

    setEnviando(false)
    setEnviado(true)

    // Cierra automáticamente tras 2s de confirmación
    setTimeout(() => onClose(), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && puedeEnviar && !enviando) handleEnviar()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="fixed inset-0 z-60 bg-black/40 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !enviando && onClose()}
      style={{ zIndex: 60 }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-label="Enviar documento por correo"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {/* ── Cabecera ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-5) var(--space-6)',
          borderBottom: '1px solid var(--color-divider)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary-highlight)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
              flexShrink: 0,
            }}>
              <Mail size={18} />
            </div>
            <div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                color: 'var(--color-text)',
                lineHeight: 1.2,
              }}>
                Enviar por correo
              </h3>
              {nombreDocumento && (
                <p style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  marginTop: 2,
                }}>
                  {nombreDocumento}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={enviando}
            aria-label="Cerrar"
            style={{
              padding: 'var(--space-2)',
              borderRadius: 'var(--radius-md)',
              background: 'none',
              border: 'none',
              cursor: enviando ? 'not-allowed' : 'pointer',
              color: 'var(--color-text-muted)',
              transition: 'background var(--transition-interactive)',
            }}
            onMouseEnter={e => { if (!enviando) e.currentTarget.style.background = 'var(--color-surface-offset)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Cuerpo ── */}
        <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {!enviado ? (
            <>
              {/* Input de correos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <label
                  htmlFor="email-destinos"
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                  }}
                >
                  Destinatarios
                </label>
                <input
                  ref={inputRef}
                  id="email-destinos"
                  type="text"
                  value={inputCorreos}
                  onChange={(e) => {
                    setInputCorreos(e.target.value)
                    setError(null)
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={enviando}
                  placeholder="correo@ejemplo.com, otro@ejemplo.com"
                  className="input-v3"
                  style={{
                    width: '100%',
                    fontFamily: 'var(--font-body)',
                  }}
                  aria-describedby="email-hint"
                />
                <p
                  id="email-hint"
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.5,
                  }}
                >
                  Separa varios correos con <strong>,</strong> (comas). El documento se enviará como PDF adjunto.
                </p>
              </div>

              {/* Chips de correos parseados */}
              {correos.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {correos.map((correo, i) => {
                    const valido = esEmailValido(correo)
                    return (
                      <span
                        key={i}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                          padding: 'var(--space-1) var(--space-3)',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 500,
                          background: valido
                            ? 'var(--color-primary-highlight)'
                            : 'var(--color-error-highlight)',
                          color: valido
                            ? 'var(--color-primary)'
                            : 'var(--color-error)',
                          border: `1px solid ${valido ? 'oklch(from var(--color-primary) l c h / 0.2)' : 'oklch(from var(--color-error) l c h / 0.2)'}`,
                        }}
                      >
                        <Mail size={11} />
                        {correo}
                        {!valido && <AlertTriangle size={11} />}
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Error de correos inválidos */}
              {correosInvalidos.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3)',
                  background: 'var(--color-error-highlight)',
                  border: '1px solid oklch(from var(--color-error) l c h / 0.2)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-error)',
                }}>
                  <AlertTriangle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                  <span>
                    {correosInvalidos.length === 1
                      ? `El correo "${correosInvalidos[0]}" no es válido.`
                      : `Hay ${correosInvalidos.length} correos no válidos. Revísalos antes de enviar.`}
                  </span>
                </div>
              )}

              {/* Error de envío */}
              {error && (
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-3)',
                  background: 'var(--color-error-highlight)',
                  border: '1px solid oklch(from var(--color-error) l c h / 0.2)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-error)',
                }}>
                  <AlertTriangle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            /* ── Estado: enviado con éxito ── */
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-4)',
              padding: 'var(--space-6) 0',
              textAlign: 'center',
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-full)',
                background: 'var(--color-success-highlight)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-success)',
              }}>
                <CheckCircle2 size={28} />
              </div>
              <div>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                }}>
                  ¡Enviado correctamente!
                </p>
                <p style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-muted)',
                  marginTop: 'var(--space-1)',
                }}>
                  El documento ha sido enviado a {correos.length === 1 ? correos[0] : `${correos.length} destinatarios`}.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {!enviado && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 'var(--space-3)',
            padding: 'var(--space-4) var(--space-6)',
            borderTop: '1px solid var(--color-divider)',
          }}>
            <Button variant="secondary" onClick={onClose} disabled={enviando}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleEnviar}
              disabled={!puedeEnviar || enviando}
            >
              {enviando
                ? <Loader2 size={15} className="animate-spin" />
                : <Send size={15} />}
              {enviando ? 'Enviando...' : `Enviar${correos.length > 1 ? ` (${correos.length})` : ''}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
