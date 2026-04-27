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

function esEmailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

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

    // TODO: conectar con servicio real de envío de email (SendGrid, Resend, etc.)
    await new Promise((resolve) => setTimeout(resolve, 1200))

    setEnviando(false)
    setEnviado(true)

    setTimeout(() => onClose(), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && puedeEnviar && !enviando) handleEnviar()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="overlay overlay-dark overlay-z60"
      onClick={(e) => e.target === e.currentTarget && !enviando && onClose()}
    >
      <div
        className="modal-box modal-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Enviar documento por correo"
      >
        {/* ── Cabecera ── */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div
              className="icon-box icon-box-md"
              style={{ background: 'var(--color-primary-highlight)', color: 'var(--color-primary)' }}
            >
              <Mail size={18} />
            </div>
            <div>
              <h3 className="modal-header-title">Enviar por correo</h3>
              {nombreDocumento && (
                <p className="modal-header-sub">{nombreDocumento}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={enviando}
            aria-label="Cerrar"
            className="modal-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Cuerpo ── */}
        <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {!enviado ? (
            <>
              <div className="input-group">
                <label htmlFor="email-destinos" className="input-label">
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
                  aria-describedby="email-hint"
                />
                <p id="email-hint" className="input-hint">
                  Separa varios correos con <strong>,</strong> (comas). El documento se enviará como PDF adjunto.
                </p>
              </div>

              {correos.length > 0 && (
                <div className="flex flex-wrap gap-2">
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

              {correosInvalidos.length > 0 && (
                <div className="error-box">
                  <AlertTriangle size={14} className="error-box-icon" />
                  <span>
                    {correosInvalidos.length === 1
                      ? `El correo "${correosInvalidos[0]}" no es válido.`
                      : `Hay ${correosInvalidos.length} correos no válidos. Revísalos antes de enviar.`}
                  </span>
                </div>
              )}

              {error && (
                <div className="error-box">
                  <AlertTriangle size={14} className="error-box-icon" />
                  <span>{error}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-4" style={{ padding: 'var(--space-6) 0', textAlign: 'center' }}>
              <div
                className="icon-box"
                style={{ width: 56, height: 56, borderRadius: 'var(--radius-full)', background: 'var(--color-success-highlight)', color: 'var(--color-success)' }}
              >
                <CheckCircle2 size={28} />
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)' }}>
                  ¡Enviado correctamente!
                </p>
                <p className="section-sub" style={{ marginTop: 'var(--space-1)' }}>
                  El documento ha sido enviado a {correos.length === 1 ? correos[0] : `${correos.length} destinatarios`}.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {!enviado && (
          <div className="modal-footer justify-end">
            <Button variant="secondary" onClick={onClose} disabled={enviando}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleEnviar}
              disabled={!puedeEnviar || enviando}
            >
              {enviando
                ? <Loader2 size={15} className="spin" />
                : <Send size={15} />}
              {enviando ? 'Enviando...' : `Enviar${correos.length > 1 ? ` (${correos.length})` : ''}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
