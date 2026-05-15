import { useState, type FormEvent } from 'react'
import { X, AlertTriangle, CheckCircle2, FileKey, ShieldCheck, Loader2 } from 'lucide-react'
import type { Empresa } from '../../../types/empresa.types'
import type {
  VerifactuCertMetadata,
  VerifactuEntorno,
  VerifactuModo,
} from '../../../types/verifactu.types'
import { validateCertificate, saveVerifactuConfig } from '../../../lib/verifactu'
import { validarNif } from '../../../utils/validarNif'

interface Props {
  empresa: Empresa | null
  onClose: () => void
  onSaved: () => void
  onGoToEmpresa: () => void
}

type Step = 1 | 2 | 3 | 4

const STEP_LABELS = ['Datos fiscales', 'Certificado', 'Modo', 'Confirmación']

export function VerifactuWizard({ empresa, onClose, onSaved, onGoToEmpresa }: Props) {
  const [step, setStep] = useState<Step>(1)

  // Paso 2 — certificado
  const [certFile, setCertFile] = useState<File | null>(null)
  const [certPassword, setCertPassword] = useState('')
  const [validating, setValidating] = useState(false)
  const [validateError, setValidateError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<VerifactuCertMetadata | null>(null)

  // Paso 3 — modo y entorno
  const [modo, setModo] = useState<VerifactuModo>('no_verificable')
  const [entorno, setEntorno] = useState<VerifactuEntorno>('test')

  // Paso 4 — confirmación
  const [legalAccepted, setLegalAccepted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const empresaCompleta = Boolean(
    empresa?.nombre?.trim() && empresa?.nif?.trim() && empresa?.direccion?.trim(),
  )
  const nifValido = empresa?.nif ? validarNif(empresa.nif) === true : false

  const handleValidate = async (e: FormEvent) => {
    e.preventDefault()
    if (!certFile || !empresa?.nif) return
    setValidating(true)
    setValidateError(null)
    const res = await validateCertificate({
      cert_file: certFile,
      cert_password: certPassword,
      nif_empresa: empresa.nif,
    })
    setValidating(false)
    if (!res.ok || !res.metadata) {
      setValidateError(res.error ?? 'No se pudo validar el certificado.')
      setMetadata(null)
      return
    }
    setMetadata(res.metadata)
    setStep(3)
  }

  const handleSave = async () => {
    if (!certFile) return
    setSaving(true)
    setSaveError(null)
    const res = await saveVerifactuConfig({
      cert_file: certFile,
      cert_password: certPassword,
      modo,
      entorno,
    })
    setSaving(false)
    if (!res.ok) {
      setSaveError(res.error ?? 'No se pudo activar VeriFactu.')
      return
    }
    onSaved()
  }

  return (
    <div className="overlay overlay-dark overlay-z200">
      <div className="admin-modal-box admin-modal-lg verifactu-wizard-box">

        <div className="admin-modal-header">
          <ShieldCheck size={18} className="admin-modal-header-icon admin-modal-header-icon--gold" />
          <h2 className="admin-modal-title">Configurar VeriFactu</h2>
          <button onClick={onClose} className="modal-close-btn" aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>

        <div className="verifactu-wizard-steps">
          {STEP_LABELS.map((label, i) => {
            const n = (i + 1) as Step
            const active = step === n
            const done = step > n
            return (
              <button
                key={label}
                type="button"
                className={`verifactu-wizard-step${active ? ' is-active' : ''}${done ? ' is-done' : ''}`}
                onClick={() => setStep(n)}
              >
                <span className="verifactu-wizard-step-num">{done ? <CheckCircle2 size={14} /> : n}</span>
                <span className="verifactu-wizard-step-label">{label}</span>
              </button>
            )
          })}
        </div>

        <div className="admin-modal-body">

          {step === 1 && (
            <>
              <p className="modal-body-text">
                Para emitir registros VeriFactu necesitas tener tus datos fiscales completos
                y válidos en <strong>Mi empresa</strong>. El NIF debe coincidir con el del
                certificado que vas a usar.
              </p>

              <div className="verifactu-data-summary">
                <SummaryRow label="Razón social" value={empresa?.nombre} required />
                <SummaryRow label="NIF / CIF" value={empresa?.nif} required hint={
                  empresa?.nif && !nifValido ? 'El formato del NIF no es válido' : undefined
                } />
                <SummaryRow label="Dirección" value={empresa?.direccion} required />
                <SummaryRow label="Email" value={empresa?.email} required />
              </div>

              {(!empresaCompleta || !nifValido) && (
                <div className="error-box" style={{ marginTop: 'var(--space-3)' }}>
                  <AlertTriangle size={16} className="error-box-icon" />
                  <span>
                    Faltan datos obligatorios o el NIF no es válido. Completa tu empresa antes de continuar.
                  </span>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <form onSubmit={handleValidate}>
              <p className="modal-body-text">
                Sube tu certificado digital (<code>.pfx</code> o <code>.p12</code>) y escribe su
                contraseña. Validaremos que está en buen estado y que su NIF coincide con el tuyo.
                <br />
                <span style={{ color: 'var(--color-text-muted)' }}>
                  El certificado se cifra antes de almacenarse. Solo se usa para firmar tus propias facturas.
                </span>
              </p>

              <div className="input-group" style={{ marginTop: 'var(--space-4)' }}>
                <label className="input-label">Archivo del certificado *</label>
                <input
                  type="file"
                  accept=".pfx,.p12,application/x-pkcs12,application/pkcs12"
                  onChange={(e) => {
                    setCertFile(e.target.files?.[0] ?? null)
                    setValidateError(null)
                  }}
                  className="input-v3"
                />
                {certFile && (
                  <p className="input-hint">
                    {certFile.name} · {(certFile.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">Contraseña del certificado *</label>
                <input
                  type="password"
                  className="input-v3"
                  value={certPassword}
                  onChange={(e) => {
                    setCertPassword(e.target.value)
                    setValidateError(null)
                  }}
                  autoComplete="off"
                  placeholder="••••••••"
                />
              </div>

              {validateError && (
                <div className="error-box">
                  <AlertTriangle size={16} className="error-box-icon" />
                  <span>{validateError}</span>
                </div>
              )}
            </form>
          )}

          {step === 3 && (
            <>
              <p className="modal-body-text">
                {metadata
                  ? 'Certificado validado correctamente. Elige cómo quieres que funcione VeriFactu.'
                  : 'Aún no has validado el certificado. Puedes revisar las opciones, pero tendrás que volver al paso 2 antes de activar.'}
              </p>

              <div className="verifactu-data-summary">
                <SummaryRow label="Titular" value={metadata?.cert_subject ?? 'Pendiente de validar'} />
                <SummaryRow label="Emisor" value={metadata?.cert_issuer ?? '—'} />
                <SummaryRow
                  label="Caduca"
                  value={metadata ? new Date(metadata.cert_expires_at).toLocaleDateString('es-ES') : '—'}
                />
              </div>

              <fieldset className="verifactu-fieldset">
                <legend className="verifactu-fieldset-legend">Modo de registro</legend>
                <RadioRow
                  name="modo"
                  value="no_verificable"
                  checked={modo === 'no_verificable'}
                  onChange={() => setModo('no_verificable')}
                  title="No verificable (recomendado para empezar)"
                  description="Generamos el registro VeriFactu localmente con XML y QR, pero no se envía a la AEAT. Válido legalmente."
                />
                <RadioRow
                  name="modo"
                  value="veri_factu"
                  checked={modo === 'veri_factu'}
                  onChange={() => setModo('veri_factu')}
                  title="VeriFactu (envío en tiempo real)"
                  description="Próximamente. Enviaremos cada factura a la AEAT al emitirla."
                  disabled
                />
              </fieldset>

              <fieldset className="verifactu-fieldset">
                <legend className="verifactu-fieldset-legend">Entorno AEAT</legend>
                <RadioRow
                  name="entorno"
                  value="test"
                  checked={entorno === 'test'}
                  onChange={() => setEntorno('test')}
                  title="Pruebas (preproducción)"
                  description="El QR enlaza al cotejo de pruebas. Recomendado mientras validas el flujo."
                />
                <RadioRow
                  name="entorno"
                  value="produccion"
                  checked={entorno === 'produccion'}
                  onChange={() => setEntorno('produccion')}
                  title="Producción"
                  description="El QR enlaza al cotejo real de la AEAT."
                />
              </fieldset>
            </>
          )}

          {step === 4 && (
            <>
              <p className="modal-body-text">
                Revisa el resumen antes de activar VeriFactu. Una vez activado, todas las
                facturas que emitas generarán su registro automáticamente.
              </p>

              {!metadata && (
                <div className="error-box" style={{ marginBottom: 'var(--space-3)' }}>
                  <AlertTriangle size={16} className="error-box-icon" />
                  <span>
                    Aún no has validado el certificado en el paso 2. Vuelve atrás para subirlo
                    antes de activar VeriFactu.
                  </span>
                </div>
              )}

              <div className="verifactu-data-summary">
                <SummaryRow label="NIF titular" value={metadata?.nif_titular ?? empresa?.nif ?? '—'} />
                <SummaryRow label="Modo" value={modo === 'no_verificable' ? 'No verificable' : 'VeriFactu (tiempo real)'} />
                <SummaryRow label="Entorno" value={entorno === 'test' ? 'Pruebas (preproducción)' : 'Producción'} />
                <SummaryRow
                  label="Caducidad cert."
                  value={metadata ? new Date(metadata.cert_expires_at).toLocaleDateString('es-ES') : '—'}
                />
              </div>

              <label className="verifactu-legal-check">
                <input
                  type="checkbox"
                  checked={legalAccepted}
                  onChange={(e) => setLegalAccepted(e.target.checked)}
                />
                <span>
                  Confirmo que soy titular del NIF {empresa?.nif} y autorizo a HerramientasAutónomas
                  a usar el certificado únicamente para generar y, en su caso, remitir mis registros
                  VeriFactu a la AEAT.
                </span>
              </label>

              {saveError && (
                <div className="error-box">
                  <AlertTriangle size={16} className="error-box-icon" />
                  <span>{saveError}</span>
                </div>
              )}
            </>
          )}

        </div>

        <div className="admin-modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving || validating}>
            Cancelar
          </button>

          {step === 1 && (
            <>
              {(!empresaCompleta || !nifValido) ? (
                <button className="btn btn-primary btn-sm" onClick={onGoToEmpresa}>
                  Ir a Mi empresa
                </button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => setStep(2)}>
                  Siguiente
                </button>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setStep(3)}
                disabled={validating}
                title="Saltar la validación (modo provisional para revisar la UI)"
              >
                Saltar paso
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={(e) => { void handleValidate(e as unknown as FormEvent) }}
                disabled={!certFile || !certPassword || validating}
              >
                {validating
                  ? <><Loader2 size={14} className="spin" /> Validando…</>
                  : <><FileKey size={14} /> Validar y continuar</>}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setStep(2)}>
                Atrás
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setStep(4)}>
                Siguiente
              </button>
            </>
          )}

          {step === 4 && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setStep(3)} disabled={saving}>
                Atrás
              </button>
              <button
                className="btn btn-success btn-sm"
                onClick={() => { void handleSave() }}
                disabled={!legalAccepted || saving}
              >
                {saving
                  ? <><Loader2 size={14} className="spin" /> Activando…</>
                  : <><ShieldCheck size={14} /> Activar VeriFactu</>}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  required,
  hint,
}: {
  label: string
  value?: string | null
  required?: boolean
  hint?: string
}) {
  const missing = required && !value?.trim()
  return (
    <div className="verifactu-summary-row">
      <span className="verifactu-summary-label">{label}</span>
      <span className={`verifactu-summary-value${missing ? ' is-missing' : ''}`}>
        {value?.trim() || (missing ? 'Pendiente' : '—')}
      </span>
      {hint && <span className="verifactu-summary-hint">{hint}</span>}
    </div>
  )
}

function RadioRow({
  name, value, checked, onChange, title, description, disabled,
}: {
  name: string
  value: string
  checked: boolean
  onChange: () => void
  title: string
  description: string
  disabled?: boolean
}) {
  return (
    <label className={`verifactu-radio-row${checked ? ' is-checked' : ''}${disabled ? ' is-disabled' : ''}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className="verifactu-radio-content">
        <span className="verifactu-radio-title">{title}</span>
        <span className="verifactu-radio-desc">{description}</span>
      </span>
    </label>
  )
}
