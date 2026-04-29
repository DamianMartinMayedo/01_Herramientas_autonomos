/**
 * EmailModal.tsx
 * Modal de envío por correo electrónico.
 * Usa el mismo estilo visual que el modal de autenticación.
 */
import { useState, useRef, useEffect } from 'react'
import { X, Send, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

interface EmailModalProps {
  emailCliente?: string
  nombreDocumento?: string
  onClose: () => void
  onSent?: () => Promise<void> | void
}

function esEmailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function parsearCorreos(input: string): string[] {
  return input.split(',').map((e) => e.trim()).filter(Boolean)
}

export function EmailModal({ emailCliente, nombreDocumento, onClose, onSent }: EmailModalProps) {
  const [inputCorreos, setInputCorreos] = useState(emailCliente ?? '')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !enviando) onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [enviando, onClose])

  const correos = parsearCorreos(inputCorreos)
  const correosInvalidos = correos.filter((e) => !esEmailValido(e))
  const puedeEnviar = correos.length > 0 && correosInvalidos.length === 0

  const handleEnviar = async () => {
    setSubmitted(true)
    if (!puedeEnviar) return
    setEnviando(true)
    setError(null)

    // TODO: conectar con servicio real de envío de email (SendGrid, Resend, etc.)
    await new Promise((resolve) => setTimeout(resolve, 1200))

    setEnviando(false)
    setEnviado(true)
    if (onSent) await onSent()
    setTimeout(() => onClose(), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !enviando) void handleEnviar()
  }

  const mostrarErrorCorreos = submitted && correosInvalidos.length > 0

  return (
    <div className="auth-modal-overlay" role="dialog" aria-modal="true" aria-label="Enviar documento por correo">
      <div className="auth-modal">
        <button
          onClick={onClose}
          disabled={enviando}
          aria-label="Cerrar"
          className="auth-modal__close"
        >
          <X size={18} />
        </button>

        {!enviado ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div>
              <h3 className="auth-form__title" style={{ marginBottom: 'var(--space-1)' }}>
                Enviar por correo
              </h3>
              {nombreDocumento && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  {nombreDocumento}
                </p>
              )}
            </div>

            <div className="input-group">
              <label htmlFor="email-destinos" className="input-label">Destinatarios</label>
              <input
                ref={inputRef}
                id="email-destinos"
                type="text"
                value={inputCorreos}
                onChange={(e) => { setInputCorreos(e.target.value); setSubmitted(false) }}
                onKeyDown={handleKeyDown}
                disabled={enviando}
                placeholder="correo@ejemplo.com, otro@ejemplo.com"
                className={`input-v3${mostrarErrorCorreos ? ' is-error' : ''}`}
                aria-describedby="email-hint"
              />
              <p id="email-hint" className="input-hint">
                Separa varios correos con <strong>,</strong> (comas). El documento se enviará como PDF adjunto.
              </p>
              {mostrarErrorCorreos && (
                <p className="input-error-msg">
                  {correosInvalidos.length === 1
                    ? `El correo "${correosInvalidos[0]}" no es válido.`
                    : `Hay ${correosInvalidos.length} correos no válidos. Revísalos antes de enviar.`}
                </p>
              )}
              {submitted && correos.length === 0 && (
                <p className="input-error-msg">Introduce al menos un correo electrónico.</p>
              )}
            </div>

            {error && (
              <div className="error-box">
                <AlertTriangle size={14} className="error-box-icon" />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={enviando}>
                Cancelar
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { void handleEnviar() }}
                disabled={enviando}
              >
                {enviando ? <Loader2 size={14} className="spin" /> : <Send size={14} />}
                {enviando ? 'Enviando...' : `Enviar${correos.length > 1 ? ` (${correos.length})` : ''}`}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', textAlign: 'center', padding: 'var(--space-4) 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: 'var(--radius-full)', background: 'var(--color-success-highlight)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={26} />
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
    </div>
  )
}
