/**
 * LegalDocEngine.tsx
 * Orquestador para documentos legales de texto estructurado.
 * Paralelo a DocumentEngine, pero orientado a cláusulas, firmantes y texto libre.
 * Lo usarán: ContratoPage, NdaPage, ReclamacionPage
 */
import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, useWatch, type DefaultValues } from 'react-hook-form'
import { ChevronLeft, Save, CheckCircle2, Mail } from 'lucide-react'
import type { LegalDoc, ParteLegal, TipoLegalDoc } from '../../types/legalDoc.types'
import { LegalDocModal } from './LegalDocModal'
import { LegalDocPreview } from './LegalDocPreview'
import { Button } from '../ui/Button'
import type { RegularClient } from '../../types/regularClient.types'
import { regularClientToParteLegal } from '../../types/regularClient.types'

export interface LegalDocEngineProps<T extends LegalDoc> {
  tipo: TipoLegalDoc
  titulo: string
  toolClass?: string
  defaultValues: T
  renderForm: (helpers: FormHelpers<T>) => React.ReactNode
  buildDoc: (values: T) => LegalDoc
  embedded?: boolean
  onBack?: () => void
  onSave?: (documento: T) => Promise<void>
  saving?: boolean
  clientes?: RegularClient[]
  clienteField?: 'cliente' | 'parteB' | 'deudor'
  onEmail?: (documento: T) => void
  estadoDoc?: string
}

export interface FormHelpers<T extends LegalDoc> {
  register: ReturnType<typeof useForm<T>>['register']
  watch: ReturnType<typeof useForm<T>>['watch']
  errors: ReturnType<typeof useForm<T>>['formState']['errors']
  setValue: ReturnType<typeof useForm<T>>['setValue']
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  marginBottom: 'var(--space-4)',
}

function setParteValue<T extends LegalDoc>(
  setValue: ReturnType<typeof useForm<T>>['setValue'],
  field: 'cliente' | 'parteB' | 'deudor',
  parte: ParteLegal
) {
  const prefix = field as string
  setValue(`${prefix}.nombre` as never, parte.nombre as never, { shouldDirty: true })
  setValue(`${prefix}.nif` as never, parte.nif as never, { shouldDirty: true })
  setValue(`${prefix}.direccion` as never, parte.direccion as never, { shouldDirty: true })
  setValue(`${prefix}.ciudad` as never, parte.ciudad as never, { shouldDirty: true })
  setValue(`${prefix}.cp` as never, parte.cp as never, { shouldDirty: true })
  setValue(`${prefix}.provincia` as never, (parte.provincia ?? '') as never, { shouldDirty: true })
  setValue(`${prefix}.email` as never, (parte.email ?? '') as never, { shouldDirty: true })
  setValue(`${prefix}.telefono` as never, (parte.telefono ?? '') as never, { shouldDirty: true })
}

export function LegalDocEngine<T extends LegalDoc>({
  tipo,
  titulo,
  toolClass = '',
  defaultValues,
  renderForm,
  buildDoc,
  embedded = false,
  onBack,
  onSave,
  saving = false,
  clientes = [],
  clienteField,
  onEmail,
  estadoDoc,
}: LegalDocEngineProps<T>) {
  const navigate = useNavigate()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [selectedClientId, setSelectedClientId] = useState('')

  useEffect(() => {
    const raw = defaultValues as Partial<Record<'cliente' | 'parteB' | 'deudor', { nombre?: string; nif?: string }>>
    const parteNombre = raw.cliente?.nombre ?? raw.parteB?.nombre ?? raw.deudor?.nombre
    const parteNif = raw.cliente?.nif ?? raw.parteB?.nif ?? raw.deudor?.nif
    if (!parteNombre || clientes.length === 0) return
    const match = clientes.find(
      (c) =>
        c.nombre.trim().toLowerCase() === parteNombre.trim().toLowerCase() ||
        (c.nif && parteNif && c.nif.trim().toLowerCase() === parteNif.trim().toLowerCase())
    )
    if (match) setSelectedClientId(match.id)
  }, [defaultValues, clientes])

  const form = useForm<T>({
    defaultValues: defaultValues as DefaultValues<T>,
  })
  const {
    register,
    watch,
    formState: { errors },
    setValue,
    handleSubmit,
    reset,
  } = form

  useEffect(() => {
    reset(defaultValues as DefaultValues<T>)
  }, [defaultValues, reset])

  const rawValues = useWatch({ control: form.control }) as T
  const docPreview = buildDoc(rawValues) as T

  const raw = rawValues as Partial<Record<'cliente' | 'parteB' | 'deudor', { email?: string }>>
  const clienteEmail =
    raw.cliente?.email ||
    raw.parteB?.email ||
    raw.deudor?.email ||
    undefined

  const showFeedback = (message: string) => {
    setFeedbackMessage(message)
    setTimeout(() => setFeedbackMessage(null), 2500)
  }

  const handleExportar = handleSubmit(() => setModalAbierto(true))

  const handleEnviarEmail = handleSubmit(async (values) => {
    if (!onEmail) return
    onEmail(values as T)
  })

  const handleGuardarDatos = useCallback(() => {
    try {
      const values = form.getValues()
      const source =
        (values as Partial<Record<'prestador' | 'parteA' | 'acreedor', unknown>>).prestador ??
        (values as Partial<Record<'prestador' | 'parteA' | 'acreedor', unknown>>).parteA ??
        (values as Partial<Record<'prestador' | 'parteA' | 'acreedor', unknown>>).acreedor

      if (source) {
        localStorage.setItem(`ha-legal-emisor-${tipo}`, JSON.stringify(source))
      }
    } catch {
      // localStorage puede estar bloqueado
    }
    showFeedback('Datos guardados')
  }, [form, tipo])

  const handleGuardarDocumento = handleSubmit(async (values) => {
    if (!onSave) return
    setSaveError(null)
    try {
      await onSave(values as T)
      showFeedback('Documento guardado')
    } catch (error) {
      console.error(error)
      setSaveError('No se pudo guardar el documento. Inténtalo de nuevo.')
    }
  })

  const handleSeleccionCliente = (clientId: string) => {
    setSelectedClientId(clientId)
    const client = clientes.find((item) => item.id === clientId)
    if (!client || !clienteField) return

    setParteValue(setValue, clienteField, regularClientToParteLegal(client))
  }

  const helpers: FormHelpers<T> = {
    register,
    watch,
    errors,
    setValue,
  }

  return (
    <div
      className={toolClass}
      style={{ minHeight: embedded ? 'auto' : '100vh', background: 'var(--color-bg)', transition: 'background var(--transition-slow)' }}
    >
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'oklch(from var(--color-surface) l c h / 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-divider)',
        padding: 'var(--space-3) var(--space-6)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {(!embedded || onBack) && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (onBack) {
                    onBack()
                    return
                  }
                  navigate(-1)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                  fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  transition: 'color var(--transition)',
                  fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
                aria-label="Volver"
              >
                <ChevronLeft size={15} />
                <span className="show-sm">Volver</span>
              </button>

              <span style={{ color: 'var(--color-divider)', userSelect: 'none' }}>|</span>
            </>
          )}

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            fontWeight: 700,
            color: 'var(--color-text)',
          }}>
            {!onSave
              ? (tipo === 'contrato' ? 'Nuevo contrato' : tipo === 'nda' ? 'Nuevo NDA' : 'Nueva reclamación')
              : titulo}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          {feedbackMessage && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              fontSize: 'var(--text-sm)', fontWeight: 600,
              color: 'var(--color-success)',
            }}>
              <CheckCircle2 size={15} />
              {feedbackMessage}
            </span>
          )}
          {!embedded && (
            <Button variant="secondary" size="sm" type="button" onClick={handleGuardarDatos}>
              <Save size={14} />
              Guardar mis datos
            </Button>
          )}
          {onSave && (
            <Button variant="secondary" size="sm" type="button" onClick={handleGuardarDocumento} disabled={saving}>
              <Save size={14} />
              {saving ? 'Guardando...' : 'Guardar documento'}
            </Button>
          )}
          {onEmail && (
            <Button variant="secondary" size="sm" type="button" onClick={handleEnviarEmail} disabled={saving}>
              <Mail size={14} />
              {estadoDoc && estadoDoc !== 'borrador' ? 'Reenviar' : 'Enviar por correo'}
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={handleExportar} type="button">
            Exportar
          </Button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 560px), 1fr))',
        gap: 'var(--space-6)',
        padding: 'var(--space-6)',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {clientes.length > 0 && clienteField && (
            <fieldset className="fieldset-v3">
              <legend className="fieldset-legend">Cliente frecuente</legend>
              <div className="fieldset-v3-body">
                <div className="input-group">
                  <label className="input-label">Selecciona un cliente guardado</label>
                  <select
                    className="select-v3"
                    value={selectedClientId}
                    onChange={(event) => handleSeleccionCliente(event.target.value)}
                  >
                    <option value="">Selecciona un cliente guardado</option>
                    {clientes.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>
          )}

          {renderForm(helpers)}
        </div>

        <div className="show-xl" style={{ flexDirection: 'column', position: 'sticky', top: '72px', height: 'fit-content' }}>
          <p style={sectionLabelStyle}>Vista previa en tiempo real</p>
          <div style={{
            overflow: 'hidden',
            borderRadius: 'var(--radius-xl)',
            border: '2px solid var(--color-border)',
            background: 'white',
            display: 'flex',
            justifyContent: 'center',
          }}>
            <div style={{ zoom: 0.75 }}>
              <LegalDocPreview documento={docPreview} />
            </div>
          </div>
          {saveError && (
            <p className="input-error-msg" style={{ marginTop: 'var(--space-3)' }}>
              {saveError}
            </p>
          )}
        </div>
      </div>

      {modalAbierto && (
        <LegalDocModal
          documento={docPreview}
          clienteEmail={clienteEmail}
          onClose={() => setModalAbierto(false)}
          onSent={async () => {
            await onEmail?.(docPreview)
            setModalAbierto(false)
          }}
        />
      )}
    </div>
  )
}
