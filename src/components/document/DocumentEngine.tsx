/**
 * DocumentEngine — Orquestador principal del motor de documentos.
 * Combina formulario + preview en un layout de dos columnas.
 * Lo usan: FacturaPage, PresupuestoPage, AlbaranPage
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocumentEngine } from '../../hooks/useDocumentEngine'
import type { DocumentoBase, MetodoPago, TotalesDocumento } from '../../types/document.types'
import { TIPOS_IVA, TIPOS_IRPF } from '../../types/document.types'
import { DocumentPreview } from './DocumentPreview'
import { PreviewModal } from './PreviewModal'
import { FormField, TextAreaField } from '../ui/FormField'
import { Button } from '../ui/Button'
import { validarNif } from '../../utils/validarNif'
import { Trash2, Plus, Save, CheckCircle2, ChevronLeft, AlertTriangle, X, Loader2, Building2, Mail, Copy, PenLine, Download, Lock, Send, Undo2, Info } from 'lucide-react'
import { EmailModal } from '../shared/EmailModal'
import { formatFecha } from '../../utils/formatters'
import type { RegularClient, RegularClientInput } from '../../types/regularClient.types'
import { regularClientToClienteInfo } from '../../types/regularClient.types'
import type { Empresa } from '../../types/empresa.types'

const TITULO_ENCABEZADO: Record<DocumentoBase['tipo'], string> = {
  factura: 'Fechas',
  presupuesto: 'Número y fechas',
  albaran: 'Número y fechas',
}

interface ViewOnlyActions {
  onRectificar?: () => void
  onMarcarCobrada?: () => void
  onMarcarNoCobrada?: () => void
  onDuplicar?: () => void
  estadoActual?: string
}

interface DocumentEngineProps {
  tipo: DocumentoBase['tipo']
  titulo: string
  toolClass?: string
  embedded?: boolean
  onBack?: () => void
  initialData?: DocumentoBase | null
  onSave?: (documento: DocumentoBase, totales: TotalesDocumento, finalizar?: boolean) => Promise<void>
  saving?: boolean
  clientes?: RegularClient[]
  empresa?: Empresa | null
  onNavPerfil?: () => void
  onClienteGuardado?: (payload: RegularClientInput) => Promise<void>
  viewOnlyActions?: ViewOnlyActions
  autoOpenPreview?: boolean
  onEmailPresupuesto?: (doc: DocumentoBase, totales: TotalesDocumento) => void
  estadoPresupuesto?: string
  onAprobarPresupuesto?: () => void
  onConvertirAFactura?: () => void
}

export function DocumentEngine({
  tipo,
  titulo,
  toolClass = '',
  embedded = false,
  onBack,
  initialData,
  onSave,
  saving = false,
  clientes = [],
  empresa,
  onNavPerfil,
  onClienteGuardado,
  viewOnlyActions,
  autoOpenPreview = false,
  onEmailPresupuesto,
  estadoPresupuesto,
  onAprobarPresupuesto,
  onConvertirAFactura,
}: DocumentEngineProps) {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [finalizarModalAbierto, setFinalizarModalAbierto] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  useEffect(() => {
    if (autoOpenPreview) setModalAbierto(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [selectedClientId, setSelectedClientId] = useState('')
  const [savingCliente, setSavingCliente] = useState(false)
  const navigate = useNavigate()
  const {
    form,
    fields,
    totales,
    mostrarIrpf,
    agregarLinea,
    eliminarLinea,
    guardarEmisor,
    formatEuro: fmt,
  } = useDocumentEngine(tipo, initialData, empresa)

  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form

  const documento = watch() as DocumentoBase
  const esFinanciero = tipo !== 'albaran'
  const metodoPago = watch('formaPago.metodo') as MetodoPago
  const clienteExterior = watch('cliente.clienteExterior') as boolean


  const handleAbrirPrevia = form.handleSubmit(() => setModalAbierto(true))

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text: message, type })
    setTimeout(() => setFeedbackMessage(null), 2500)
  }

  const handleGuardarEmisor = () => {
    guardarEmisor()
    showFeedback('Datos guardados')
  }

  const handleGuardarBorrador = form.handleSubmit(async (values) => {
    if (!onSave) return
    try {
      await onSave(values as DocumentoBase, totales, false)
      showFeedback('Borrador guardado')
    } catch {
      showFeedback('No se pudo guardar. Inténtalo de nuevo.')
    }
  }, () => showFeedback('Revisa los campos obligatorios antes de guardar.', 'error'))

  const handleAbrirFinalizar = form.handleSubmit(() => {
    setFinalizarModalAbierto(true)
  }, () => showFeedback('Revisa los campos obligatorios antes de finalizar.', 'error'))

  const handleConfirmarFinalizar = async () => {
    if (!onSave) return
    try {
      await onSave(form.getValues() as DocumentoBase, totales, true)
      setFinalizarModalAbierto(false)
    } catch {
      showFeedback('No se pudo finalizar. Inténtalo de nuevo.')
      setFinalizarModalAbierto(false)
    }
  }

  const handleEnviarPresupuesto = form.handleSubmit((values) => {
    onEmailPresupuesto?.(values as DocumentoBase, totales)
  }, () => showFeedback('Revisa los campos obligatorios antes de enviar.', 'error'))

  const handleGuardarDocumento = form.handleSubmit(async (values) => {
    if (!onSave) return
    try {
      await onSave(values as DocumentoBase, totales)
      showFeedback('Documento guardado')
    } catch {
      showFeedback('No se pudo guardar. Inténtalo de nuevo.')
    }
  }, () => showFeedback('Revisa los campos obligatorios antes de guardar.', 'error'))

  const handleSeleccionCliente = (clientId: string) => {
    setSelectedClientId(clientId)
    const client = clientes.find((item) => item.id === clientId)
    if (!client) {
      setValue('cliente.clienteExterior', false, { shouldDirty: true })
      setValue('cliente.pais', '', { shouldDirty: true })
      return
    }

    const cliente = regularClientToClienteInfo(client)
    setValue('cliente.nombre', cliente.nombre, { shouldDirty: true })
    setValue('cliente.nif', cliente.nif, { shouldDirty: true })
    setValue('cliente.direccion', cliente.direccion, { shouldDirty: true })
    setValue('cliente.ciudad', cliente.ciudad, { shouldDirty: true })
    setValue('cliente.cp', cliente.cp, { shouldDirty: true })
    setValue('cliente.provincia', cliente.provincia, { shouldDirty: true })
    setValue('cliente.email', cliente.email ?? '', { shouldDirty: true })
    setValue('cliente.pais', cliente.pais ?? '', { shouldDirty: true })
    setValue('cliente.clienteExterior', Boolean(cliente.clienteExterior), { shouldDirty: true })
  }

  const handleGuardarClienteHabitual = async () => {
    if (!onClienteGuardado) return
    const c = form.getValues('cliente') as DocumentoBase['cliente']
    setSavingCliente(true)
    try {
      await onClienteGuardado({
        nombre: c.nombre,
        nif: c.nif,
        email: c.email || undefined,
        direccion: c.direccion,
        cp: c.cp,
        ciudad: c.ciudad,
        provincia: c.provincia || '',
        pais: c.pais || undefined,
        cliente_exterior: Boolean(c.clienteExterior),
      })
      showFeedback('Cliente guardado como habitual')
    } catch {
      showFeedback('No se pudo guardar el cliente')
    } finally {
      setSavingCliente(false)
    }
  }

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: 'var(--text-xs)',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--color-text-muted)',
    marginBottom: 'var(--space-4)',
  }

  const totalRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 'var(--text-sm)',
    color: 'var(--color-text-muted)',
  }

  return (
    <div
      className={toolClass}
      style={{ minHeight: embedded ? 'auto' : '100vh', background: 'var(--color-bg)', transition: 'background var(--transition-slow)' }}
    >
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'oklch(from var(--color-bg) l c h / 0.97)',
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

          {tipo === 'factura' || tipo === 'presupuesto' ? (
            <div>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-lg)',
                fontWeight: 700,
                color: documento.numero ? 'var(--color-text)' : 'var(--color-text-faint)',
              }}>
                {documento.numero || (tipo === 'factura'
                  ? (initialData?.esRectificativa ? 'R-XXX-XXXX' : 'FAC-XXX-XXXX')
                  : 'PRE-XXX-XXXX')}
              </h1>
              {!documento.numero && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginTop: 2 }}>
                  {tipo === 'factura' ? 'Se asignará al emitir' : 'Se asignará al enviar'}
                </p>
              )}
            </div>
          ) : (
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-lg)',
              fontWeight: 700,
              color: 'var(--color-text)',
            }}>
              {titulo}
            </h1>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          {feedbackMessage && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              fontSize: 'var(--text-sm)', fontWeight: 600,
              color: feedbackMessage.type === 'error' ? 'var(--color-error)' : 'var(--color-success)',
            }}>
              <CheckCircle2 size={15} />
              {feedbackMessage.text}
            </span>
          )}
          {!embedded && !viewOnlyActions && (
            <Button variant="secondary" size="sm" onClick={handleGuardarEmisor} type="button">
              <Save size={14} />
              Guardar mis datos
            </Button>
          )}
          {viewOnlyActions && tipo === 'factura' && (
            <>
              {!initialData?.esRectificativa && (
                <Button variant="secondary" size="sm" type="button" onClick={viewOnlyActions.onRectificar}>
                  <PenLine size={14} />
                  Rectificar
                </Button>
              )}
              {!initialData?.esRectificativa && viewOnlyActions.estadoActual !== 'cobrada' && (
                <Button variant="secondary" size="sm" type="button" onClick={viewOnlyActions.onMarcarCobrada}>
                  <CheckCircle2 size={14} />
                  Cobrada
                </Button>
              )}
              {!initialData?.esRectificativa && viewOnlyActions.estadoActual === 'cobrada' && (
                <Button variant="secondary" size="sm" type="button" onClick={viewOnlyActions.onMarcarNoCobrada}>
                  <Undo2 size={14} />
                  Desmarcar cobrada
                </Button>
              )}
              <Button variant="secondary" size="sm" type="button" onClick={() => setEmailModalOpen(true)}>
                <Mail size={14} />
                Enviar
              </Button>
              {!initialData?.esRectificativa && (
                <Button variant="secondary" size="sm" type="button" onClick={viewOnlyActions.onDuplicar}>
                  <Copy size={14} />
                  Duplicar
                </Button>
              )}
              <Button variant="primary" size="sm" type="button" onClick={handleAbrirPrevia}>
                <Download size={14} />
                Descargar
              </Button>
            </>
          )}
          {viewOnlyActions && tipo === 'presupuesto' && (
            <>
              <Button variant="secondary" size="sm" type="button" onClick={() => setEmailModalOpen(true)}>
                <Mail size={14} />
                Enviar
              </Button>
              <Button variant="primary" size="sm" type="button" onClick={handleAbrirPrevia}>
                <Download size={14} />
                Descargar
              </Button>
            </>
          )}
          {!viewOnlyActions && onSave && tipo === 'factura' && (
            <>
              <Button variant="secondary" size="sm" onClick={handleGuardarBorrador} type="button" disabled={saving}>
                <Save size={14} />
                {saving ? 'Guardando...' : 'Guardar como borrador'}
              </Button>
              <Button variant="primary" size="sm" onClick={handleAbrirFinalizar} type="button" disabled={saving}>
                <CheckCircle2 size={14} />
                Finalizar
              </Button>
            </>
          )}
          {!viewOnlyActions && (onSave || onEmailPresupuesto) && tipo === 'presupuesto' && (
            <>
              {onSave && (
                <Button variant="secondary" size="sm" onClick={handleGuardarBorrador} type="button" disabled={saving}>
                  <Save size={14} />
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              )}
              {onAprobarPresupuesto && estadoPresupuesto === 'enviado' && (
                <Button variant="secondary" size="sm" type="button" onClick={onAprobarPresupuesto}>
                  <CheckCircle2 size={14} />
                  Marcar aprobado
                </Button>
              )}
              {onConvertirAFactura && (estadoPresupuesto === 'enviado' || estadoPresupuesto === 'aprobado') && (
                <Button variant="secondary" size="sm" type="button" onClick={onConvertirAFactura}>
                  Convertir a factura
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={handleEnviarPresupuesto} type="button" disabled={saving}>
                <Send size={14} />
                {estadoPresupuesto && estadoPresupuesto !== 'borrador' ? 'Reenviar' : 'Enviar presupuesto'}
              </Button>
            </>
          )}
          {!viewOnlyActions && onSave && tipo !== 'factura' && tipo !== 'presupuesto' && (
            <Button variant="secondary" size="sm" onClick={handleGuardarDocumento} type="button" disabled={saving}>
              <Save size={14} />
              {saving ? 'Guardando...' : 'Guardar albarán'}
            </Button>
          )}
          {!viewOnlyActions && !(onSave && (tipo === 'factura' || tipo === 'presupuesto')) && (
            <Button variant="primary" size="sm" onClick={handleAbrirPrevia} type="button">
              Exportar
            </Button>
          )}
        </div>
      </div>

      {tipo === 'factura' && (
        <div className="warning-banner">
          <div className="warning-banner-inner">
            <AlertTriangle size={20} className="warning-banner-icon" />
            <div>
              <p className="warning-banner-title">
                Por el momento esta factura no está conectada con el sistema Verifactu
              </p>
              <p className="warning-banner-desc">
                Es solo para referencia interna. Para facturación legal, consulta con tu gestor o usa software certificado Verifactu.
              </p>
            </div>
          </div>
        </div>
      )}

      {viewOnlyActions && (
        <div style={{
          background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--color-primary) 25%, var(--color-border))',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-3) var(--space-4)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          margin: 'var(--space-4) var(--space-6) 0',
        }}>
          <Lock size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <span>
            {tipo === 'presupuesto'
              ? <><strong style={{ color: 'var(--color-text)' }}>Presupuesto {viewOnlyActions.estadoActual ?? 'enviado'} · Solo lectura.</strong>{' '}Gestiona las acciones desde el listado.</>
              : initialData?.esRectificativa
                ? <>
                    <strong style={{ color: 'var(--color-text)' }}>Factura rectificativa emitida · Solo lectura.</strong>
                    {' '}No se puede volver a rectificar.{' '}
                    <span className="tooltip-wrap" style={{ verticalAlign: 'middle' }}>
                      <Info size={13} style={{ color: 'var(--color-primary)', cursor: 'help' }} />
                      <div className="tooltip-content">
                        Hacienda exige que cada corrección se haga mediante una factura rectificativa independiente. Rectificar una rectificativa crearía una cadena de documentos incorrecta que podría derivar en sanciones fiscales.
                        <div className="tooltip-arrow" />
                      </div>
                    </span>
                  </>
                : <>
                    <strong style={{ color: 'var(--color-text)' }}>Factura emitida · Solo lectura.</strong>
                    {' '}Para modificarla usa <strong style={{ color: 'var(--color-text)' }}>Rectificar</strong>.{' '}
                    <span className="tooltip-wrap" style={{ verticalAlign: 'middle' }}>
                      <Info size={13} style={{ color: 'var(--color-primary)', cursor: 'help' }} />
                      <div className="tooltip-content">
                        Por normativa de Hacienda, una factura emitida no puede modificarse directamente. Cualquier corrección debe hacerse mediante una <strong>factura rectificativa</strong>, que anula o corrige la original. Modificar una factura emitida directamente puede derivar en sanciones fiscales.
                        <div className="tooltip-arrow" />
                      </div>
                    </span>
                  </>
            }
          </span>
        </div>
      )}

      {initialData?.esRectificativa && (
        <div style={{
          background: 'color-mix(in srgb, var(--color-gold) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--color-gold) 30%, var(--color-border))',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-3) var(--space-4)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          margin: 'var(--space-4) var(--space-6) 0',
        }}>
          <AlertTriangle size={14} style={{ color: 'var(--color-gold)', flexShrink: 0 }} />
          <span>
            <strong style={{ color: 'var(--color-text)' }}>Factura rectificativa.</strong>{' '}
            {initialData.facturaOriginalNumero
              ? <>Rectifica la Nº <strong style={{ color: 'var(--color-text)' }}>{initialData.facturaOriginalNumero}</strong>{initialData.facturaOriginalFecha ? ` de fecha ${formatFecha(initialData.facturaOriginalFecha)}` : ''}. Las cantidades negativas anulan los importes de la original.</>
              : 'Las cantidades negativas anulan los importes de la factura original. Ajústalas si la corrección es parcial.'}
          </span>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 560px), 1fr))',
        gap: 'var(--space-6)',
        padding: 'var(--space-6)',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>
        <div className={viewOnlyActions ? 'form-view-only' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <fieldset className="fieldset-v3">
            <legend className="fieldset-legend">
              {TITULO_ENCABEZADO[tipo]}
            </legend>
            <div className="fieldset-v3-body">
              {empresa && tipo === 'factura' ? (
                <div className="form-row">
                  <FormField
                    label="Fecha *"
                    type="date"
                    {...register('fecha', { required: 'La fecha es obligatoria' })}
                    error={errors.fecha}
                  />
                  <FormField
                    label="Vencimiento"
                    type="date"
                    {...register('fechaVencimiento', {
                      validate: (value) => {
                        if (!value) return true
                        const fechaDoc = form.getValues('fecha')
                        if (!fechaDoc) return true
                        return value >= fechaDoc || 'El vencimiento no puede ser anterior a la fecha del documento'
                      },
                    })}
                    error={errors.fechaVencimiento}
                  />
                </div>
              ) : (
                <>
                  <div className="form-row">
                    <FormField
                      label="Número *"
                      {...register('numero', tipo === 'factura' ? {} : { required: 'El número es obligatorio' })}
                      error={errors.numero}
                      readOnly={tipo === 'factura'}
                      disabled={tipo === 'factura'}
                      placeholder={tipo === 'factura' ? 'Se asignará al finalizar' : undefined}
                      style={tipo === 'factura'
                        ? {
                            background: 'var(--color-surface-offset)',
                            color: 'var(--color-text-faint)',
                            cursor: 'not-allowed',
                            opacity: 0.9,
                          }
                        : undefined}
                    />
                    <FormField
                      label="Fecha *"
                      type="date"
                      {...register('fecha', { required: 'La fecha es obligatoria' })}
                      error={errors.fecha}
                    />
                  </div>
                  {esFinanciero && (
                    <FormField
                      label="Vencimiento"
                      type="date"
                      {...register('fechaVencimiento', {
                        validate: (value) => {
                          if (!value) return true
                          const fechaDoc = form.getValues('fecha')
                          if (!fechaDoc) return true
                          return value >= fechaDoc || 'El vencimiento no puede ser anterior a la fecha del documento'
                        },
                      })}
                      error={errors.fechaVencimiento}
                    />
                  )}
                </>
              )}
            </div>
          </fieldset>

          {empresa ? (
            <div style={{
              background: 'var(--color-primary-highlight)',
              border: '1px solid var(--color-primary)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-3) var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              fontSize: 'var(--text-sm)',
            }}>
              <Building2 size={15} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{empresa.nombre}</span>
                <span style={{ color: 'var(--color-text-muted)' }}> · {empresa.nif}</span>
                {empresa.email && (
                  <span style={{ color: 'var(--color-text-muted)' }}> · {empresa.email}</span>
                )}
              </div>
              {onNavPerfil && (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', flexShrink: 0 }}>
                  Editable en tu perfil
                </span>
              )}
            </div>
          ) : (
            <fieldset className="fieldset-v3">
              <legend className="fieldset-legend">Tus datos</legend>
              <div className="fieldset-v3-body">
                <FormField
                  label="Nombre / Razón social *"
                  {...register('emisor.nombre', { required: 'El nombre es obligatorio' })}
                  error={errors.emisor?.nombre}
                />
                <div className="form-row">
                  <FormField
                    label="NIF / CIF / NIE *"
                    {...register('emisor.nif', {
                      required: 'El NIF es obligatorio',
                      validate: (value) => validarNif(value),
                    })}
                    error={errors.emisor?.nif}
                  />
                  <FormField
                    label="Email *"
                    type="email"
                    {...register('emisor.email', {
                      required: 'El email es obligatorio',
                      pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email no válido' },
                    })}
                    error={errors.emisor?.email}
                  />
                </div>
                <FormField
                  label="Dirección *"
                  {...register('emisor.direccion', { required: 'La dirección es obligatoria' })}
                  error={errors.emisor?.direccion}
                />
                <div className="form-row">
                  <FormField
                    label="Código postal *"
                    {...register('emisor.cp', {
                      required: 'El CP es obligatorio',
                      pattern: { value: /^\d{5}$/, message: 'El CP debe tener 5 dígitos' },
                    })}
                    error={errors.emisor?.cp}
                  />
                  <FormField
                    label="Ciudad *"
                    {...register('emisor.ciudad', { required: 'La ciudad es obligatoria' })}
                    error={errors.emisor?.ciudad}
                  />
                </div>
                <div className="form-row">
                  <FormField label="Provincia" {...register('emisor.provincia')} />
                  <FormField label="Teléfono" type="tel" {...register('emisor.telefono')} />
                </div>
              </div>
            </fieldset>
          )}

          {initialData?.esRectificativa && (
            <fieldset className="fieldset-v3">
              <legend className="fieldset-legend">Motivo de la rectificación</legend>
              <div className="fieldset-v3-body">
                <TextAreaField
                  label="Motivo *"
                  placeholder="Describe qué se corrige y por qué (p.ej. error en el NIF del cliente, importe incorrecto…)"
                  {...register('motivoRectificacion', { required: 'El motivo es obligatorio en una factura rectificativa' })}
                  error={errors.motivoRectificacion}
                  rows={2}
                />
              </div>
            </fieldset>
          )}

          <fieldset className="fieldset-v3">
            <legend className="fieldset-legend">Datos del cliente</legend>
            <div className="fieldset-v3-body">
              {clientes.length > 0 && (
                <div className="input-group">
                  <label className="input-label">Cliente frecuente</label>
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
              )}

              <label className="input-toggle" style={{ marginBottom: 'var(--space-3)' }}>
                <input type="checkbox" {...register('cliente.clienteExterior')} />
                <span>Cliente fuera de España</span>
              </label>

              <FormField
                label="Nombre / Razón social *"
                {...register('cliente.nombre', { required: 'El nombre del cliente es obligatorio' })}
                error={errors.cliente?.nombre}
              />
              <div className="form-row">
                <FormField
                  label={clienteExterior ? 'Número de identificación *' : 'NIF / CIF / NIE *'}
                  {...register('cliente.nif', {
                    required: clienteExterior
                      ? 'El número de identificación del cliente es obligatorio'
                      : 'El NIF del cliente es obligatorio',
                    validate: (value) => {
                      if (clienteExterior) return true
                      return validarNif(value)
                    },
                  })}
                  error={errors.cliente?.nif}
                />
                <FormField
                  label="Email"
                  type="email"
                  {...register('cliente.email', {
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email no válido' },
                  })}
                  error={errors.cliente?.email}
                />
              </div>
              <FormField
                label="Dirección *"
                {...register('cliente.direccion', { required: 'La dirección del cliente es obligatoria' })}
                error={errors.cliente?.direccion}
              />
              <div className="form-row">
                <FormField
                  label="Código postal"
                  {...register('cliente.cp', {
                    pattern: clienteExterior ? undefined : { value: /^\d{5}$/, message: 'El CP debe tener 5 dígitos' },
                  })}
                  error={errors.cliente?.cp}
                />
                <FormField label="Ciudad" {...register('cliente.ciudad')} />
              </div>
              <div className="form-row">
                <FormField label="Provincia" {...register('cliente.provincia')} />
                {clienteExterior && (
                  <FormField
                    label="País"
                    {...register('cliente.pais')}
                  />
                )}
              </div>

              {!viewOnlyActions && empresa && onClienteGuardado && !selectedClientId && Boolean(documento.cliente?.nombre) && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => { void handleGuardarClienteHabitual() }}
                    disabled={savingCliente}
                  >
                    <Plus size={13} />
                    {savingCliente ? 'Guardando...' : 'Guardar como cliente habitual'}
                  </Button>
                </div>
              )}
            </div>
          </fieldset>

          <fieldset className="fieldset-v3">
            <legend className="fieldset-legend">Conceptos</legend>

            {esFinanciero && (
              <label className="input-toggle" style={{ marginBottom: 'var(--space-2)' }}>
                <input type="checkbox" {...register('mostrarIrpf')} />
                <span>Incluir IRPF</span>
              </label>
            )}

            <div className="fieldset-v3-body">
              {fields.map((field, index) => (
                <div key={field.id} className="linea-concepto">
                  <FormField
                    label="Descripción *"
                    {...register(`lineas.${index}.descripcion`, { required: 'La descripción es obligatoria' })}
                    error={errors.lineas?.[index]?.descripcion}
                  />

                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
                    <FormField
                      label="Cantidad *"
                      type="number"
                      step="any"
                      {...register(`lineas.${index}.cantidad`, {
                        valueAsNumber: true,
                        required: true,
                        ...(initialData?.esRectificativa ? {} : { min: { value: 0.01, message: 'Debe ser mayor que 0' } }),
                      })}
                      error={errors.lineas?.[index]?.cantidad}
                      style={{ width: '6rem' }}
                    />
                    <FormField
                      label="Precio/ud (€) *"
                      type="number"
                      step="0.01"
                      {...register(`lineas.${index}.precioUnitario`, {
                        valueAsNumber: true,
                        required: true,
                        ...(initialData?.esRectificativa ? {} : { min: { value: 0, message: 'No puede ser negativo' } }),
                      })}
                      error={errors.lineas?.[index]?.precioUnitario}
                      style={{ width: '7rem' }}
                    />

                    {esFinanciero && (
                      <>
                        {clienteExterior ? (
                          <div className="input-group">
                            <label className="input-label">IVA</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                              <input
                                type="number"
                                step="any"
                                {...register(`lineas.${index}.iva`, {
                                  valueAsNumber: true,
                                  min: { value: 0, message: 'No puede ser negativo' },
                                })}
                                className="input-v3"
                                style={{ width: '6.5rem' }}
                              />
                              <span
                                style={{
                                  paddingBottom: '0.55rem',
                                  fontSize: 'var(--text-sm)',
                                  color: 'var(--color-text-muted)',
                                }}
                              >
                                %
                              </span>
                            </div>
                            {errors.lineas?.[index]?.iva && (
                              <p className="input-error-msg">{errors.lineas[index]?.iva?.message}</p>
                            )}
                          </div>
                        ) : (
                          <div className="input-group">
                            <label className="input-label">IVA</label>
                            <select
                              {...register(`lineas.${index}.iva`, { valueAsNumber: true })}
                              className="select-v3"
                              style={{ width: '6.5rem' }}
                            >
                              {TIPOS_IVA.map((item) => (
                                <option key={item} value={item}>{item}%</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {mostrarIrpf && (
                          <div className="input-group">
                            <label className="input-label">IRPF</label>
                            <select
                              {...register(`lineas.${index}.irpf`, { valueAsNumber: true })}
                              className="select-v3"
                              style={{ width: '6.5rem' }}
                            >
                              {TIPOS_IRPF.map((item) => (
                                <option key={item} value={item}>{item}%</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </>
                    )}

                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)', marginLeft: 'auto' }}>
                      <button
                        type="button"
                        onClick={() => eliminarLinea(index)}
                        disabled={fields.length === 1}
                        style={{
                          padding: 'var(--space-2)',
                          color: 'var(--color-error)',
                          background: 'none',
                          border: '1.5px solid transparent',
                          borderRadius: 'var(--radius-md)',
                          cursor: fields.length === 1 ? 'not-allowed' : 'pointer',
                          transition: 'color var(--transition), background var(--transition)',
                          fontFamily: 'var(--font-body)',
                        }}
                        onMouseEnter={(e) => {
                          if (fields.length > 1) {
                            e.currentTarget.style.color = 'var(--color-error)'
                            e.currentTarget.style.background = 'var(--color-error-highlight)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'none'
                          e.currentTarget.style.background = 'none'
                        }}
                        aria-label="Eliminar línea"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!viewOnlyActions && (
              <Button
                variant="ghost"
                type="button"
                onClick={agregarLinea}
                style={{ width: '100%', marginTop: 'var(--space-3)', justifyContent: 'center' }}
              >
                <Plus size={15} />
                Añadir concepto
              </Button>
            )}

          </fieldset>

          {esFinanciero && (
            <fieldset className="fieldset-v3">
              <legend className="fieldset-legend">Forma de pago</legend>
              <div className="fieldset-v3-body">
                <div className="input-group">
                  <label className="input-label">Método de pago</label>
                  <select {...register('formaPago.metodo')} className="select-v3">
                    <option value="transferencia">Transferencia bancaria</option>
                    <option value="bizum">Bizum</option>
                    <option value="paypal">PayPal</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="cheque">Cheque</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                {metodoPago === 'transferencia' && (
                  <FormField
                    label="IBAN / Número de cuenta"
                    placeholder="ES00 0000 0000 00 0000000000"
                    {...register('formaPago.cuenta')}
                  />
                )}
                {metodoPago === 'bizum' && (
                  <FormField
                    label="Teléfono Bizum"
                    type="tel"
                    placeholder="600 000 000"
                    {...register('formaPago.telefono')}
                  />
                )}
                {metodoPago === 'paypal' && (
                  <>
                    <FormField
                      label="Email de PayPal"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      {...register('formaPago.email')}
                    />
                    <FormField
                      label="Teléfono"
                      type="tel"
                      placeholder="600 000 000"
                      {...register('formaPago.telefono')}
                    />
                  </>
                )}
                {metodoPago === 'otro' && (
                  <TextAreaField
                    label="Detalle"
                    placeholder="Indica cómo se realizará el pago..."
                    {...register('formaPago.detalle')}
                    rows={2}
                  />
                )}
              </div>
            </fieldset>
          )}

          <fieldset className="fieldset-v3">
            <legend className="fieldset-legend">Notas</legend>
            <div className="fieldset-v3-body">
              <TextAreaField
                label="Observaciones"
                placeholder="Condiciones, agradecimiento, notas legales..."
                {...register('notas')}
                rows={3}
              />
            </div>
          </fieldset>
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
            <div style={{ zoom: 0.82 }}>
              <DocumentPreview documento={documento} totales={totales} />
            </div>
          </div>
        </div>
      </div>

      {emailModalOpen && (
        <EmailModal
          emailCliente={documento.cliente?.email}
          nombreDocumento={documento.numero ? `Factura ${documento.numero}` : 'Factura'}
          onClose={() => setEmailModalOpen(false)}
        />
      )}

      {modalAbierto && (
        <PreviewModal
          documento={documento}
          totales={totales}
          onClose={() => setModalAbierto(false)}
        />
      )}

      {finalizarModalAbierto && (
        <div
          className="overlay overlay-dark overlay-z60"
        >
          <div className="modal-box modal-sm" role="dialog" aria-modal="true" aria-label="Finalizar factura">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div
                  className="icon-box icon-box-md"
                  style={{ background: 'var(--color-gold-highlight)', color: 'var(--color-gold)' }}
                >
                  <AlertTriangle size={18} />
                </div>
                <h3 className="modal-header-title">Finalizar factura</h3>
              </div>
              <button
                onClick={() => setFinalizarModalAbierto(false)}
                disabled={saving}
                className="modal-close-btn"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 'var(--space-6)' }}>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Si finalizas la factura, se guardará de forma permanente y{' '}
                <strong style={{ color: 'var(--color-text)' }}>no se podrá editar</strong>.
                Los errores se corrigen a través de una{' '}
                <strong style={{ color: 'var(--color-text)' }}>factura rectificativa</strong>.
                Esto evitará problemas con Hacienda.
              </p>
            </div>
            <div className="modal-footer justify-end">
              <Button variant="secondary" onClick={() => setFinalizarModalAbierto(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={() => { void handleConfirmarFinalizar() }} disabled={saving}>
                {saving ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />}
                {saving ? 'Finalizando...' : 'Finalizar factura'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
