/**
 * DocumentEngine — Orquestador principal del motor de documentos.
 * Combina formulario + preview en un layout de dos columnas.
 * Lo usan: FacturaPage, PresupuestoPage, AlbaranPage
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocumentEngine } from '../../hooks/useDocumentEngine'
import type { DocumentoBase, MetodoPago } from '../../types/document.types'
import { TIPOS_IVA, TIPOS_IRPF } from '../../types/document.types'
import { DocumentPreview } from './DocumentPreview'
import { PreviewModal } from './PreviewModal'
import { FormField, TextAreaField } from '../ui/FormField'
import { Button } from '../ui/Button'
import { ThemeToggle } from '../ui/ThemeToggle'
import { calcularLinea } from '../../utils/calculos'
import { validarNif } from '../../utils/validarNif'
import { Trash2, Plus, Eye, Save, CheckCircle2, ChevronLeft, ArrowRight,AlertTriangle } from 'lucide-react'
import { useDocumentStore } from '../../store/documentStore'


const TITULO_ENCABEZADO: Record<DocumentoBase['tipo'], string> = {
  factura: 'Encabezado de la factura',
  presupuesto: 'Encabezado del presupuesto',
  albaran: 'Encabezado del albarán',
}

interface DocumentEngineProps {
  tipo: DocumentoBase['tipo']
  titulo: string
  toolClass?: string
}

export function DocumentEngine({ tipo, titulo, toolClass = '' }: DocumentEngineProps) {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [savedFeedback, setSavedFeedback] = useState(false)
  const navigate = useNavigate()
  const { setPresupuestoPendiente } = useDocumentStore()

  const {
    form,
    fields,
    totales,
    mostrarIrpf,
    agregarLinea,
    eliminarLinea,
    guardarEmisor,
    formatEuro: fmt,
  } = useDocumentEngine(tipo)

  const { register, watch, formState: { errors } } = form
  const documento = watch() as DocumentoBase
  const esFinanciero = tipo !== 'albaran'
  const metodoPago = watch('formaPago.metodo') as MetodoPago
  const clienteExterior = watch('cliente.clienteExterior') as boolean

  const handleAbrirPrevia = form.handleSubmit(() => setModalAbierto(true))

  const handleGuardarEmisor = () => {
    guardarEmisor()
    setSavedFeedback(true)
    setTimeout(() => setSavedFeedback(false), 2500)
  }

  const handleConvertirAFactura = () => {
    const datos = form.getValues()
    setPresupuestoPendiente({
      cliente: datos.cliente,
      lineas: datos.lineas,
      notas: datos.notas,
      mostrarIrpf: datos.mostrarIrpf,
    })
    navigate('/factura')
  }

  /* ── Estilos inline reutilizables ──────────────────────────────────────────── */
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
      style={{ minHeight: '100vh', background: 'var(--color-bg)', transition: 'background var(--transition-slow)' }}
    >

      {/* ── Top bar ─────────────────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'oklch(from var(--color-surface) l c h / 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-divider)',
        padding: 'var(--space-3) var(--space-6)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)',
              background: 'none', border: 'none', cursor: 'pointer',
              transition: 'color var(--transition)',
              fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            aria-label="Volver al inicio"
          >
            <ChevronLeft size={15} />
            <span className="hidden sm:inline">Volver</span>
          </button>

          <span style={{ color: 'var(--color-divider)', userSelect: 'none' }}>|</span>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            fontWeight: 700,
            color: 'var(--color-text)',
          }}>
            {titulo}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          {savedFeedback && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              fontSize: 'var(--text-sm)', fontWeight: 600,
              color: 'var(--color-success)',
            }}>
              <CheckCircle2 size={15} />
              Datos guardados
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={handleGuardarEmisor} type="button">
            <Save size={14} />
            Guardar mis datos
          </Button>
          {tipo === 'presupuesto' && (
            <Button variant="secondary" size="sm" onClick={handleConvertirAFactura} type="button">
              <ArrowRight size={14} />
              Convertir a factura
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={handleAbrirPrevia} type="button">
            Exportar
          </Button>
          <ThemeToggle />
        </div>
      </div>

       {/* ── Banner disclaimer (solo para factura) ──────────────────────────────────── */}
      {tipo === 'factura' && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/30 px-6 py-4">
          <div className="max-w-[1400px] mx-auto flex gap-5">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-3" />
            <div>
              <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">
                Por el momento esta factura no esta conectada con el sistema Verifactu
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                Es solo para referencia interna. Para facturación legal, consulta con tu gestor o usa software certificado Verifactu.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Layout dos columnas ────────────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 560px), 1fr))',
        gap: 'var(--space-6)',
        padding: 'var(--space-6)',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>

        {/* ── COLUMNA IZQUIERDA — Formulario ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {/* ENCABEZADO */}
          <fieldset className="fieldset-v3">
            <legend className="fieldset-legend">{TITULO_ENCABEZADO[tipo]}</legend>
            <div className="fieldset-v3-body" style={{ marginTop: 'var(--space-4)' }}>
              <div className="form-row">
                <FormField
                  label="Número"
                  {...register('numero', { required: 'El número es obligatorio' })}
                  error={errors.numero}
                />
                <FormField
                  label="Fecha"
                  type="date"
                  {...register('fecha', { required: 'La fecha es obligatoria' })}
                  error={errors.fecha}
                />
              </div>
              {esFinanciero && (
                <FormField
                  label="Vencimiento (opcional)"
                  type="date"
                  {...register('fechaVencimiento', {
                    validate: (v) => {
                      if (!v) return true
                      const fechaDoc = form.getValues('fecha')
                      if (!fechaDoc) return true
                      return (
                        v >= fechaDoc ||
                        'El vencimiento no puede ser anterior a la fecha del documento'
                      )
                    },
                  })}
                  error={errors.fechaVencimiento}
                />
              )}
            </div>
          </fieldset>

          {/* TUS DATOS */}
          <fieldset className="fieldset-v3">
            <legend className="fieldset-legend">Tus datos</legend>
            <div className="fieldset-v3-body" style={{ marginTop: 'var(--space-4)' }}>
              <FormField
                label="Nombre / Razón social"
                {...register('emisor.nombre', { required: 'El nombre es obligatorio' })}
                error={errors.emisor?.nombre}
              />
              <div className="form-row">
                <FormField
                  label="NIF / CIF / NIE"
                  {...register('emisor.nif', {
                    required: 'El NIF es obligatorio',
                    validate: (v) => validarNif(v),
                  })}
                  error={errors.emisor?.nif}
                />
                <FormField
                  label="Email"
                  type="email"
                  {...register('emisor.email', {
                    required: 'El email es obligatorio',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email no válido' },
                  })}
                  error={errors.emisor?.email}
                />
              </div>
              <FormField
                label="Dirección"
                {...register('emisor.direccion', { required: 'La dirección es obligatoria' })}
                error={errors.emisor?.direccion}
              />
              <div className="form-row">
                <FormField
                  label="Código postal"
                  {...register('emisor.cp', {
                    required: 'El CP es obligatorio',
                    pattern: { value: /^\d{5}$/, message: 'El CP debe tener 5 dígitos' },
                  })}
                  error={errors.emisor?.cp}
                />
                <FormField
                  label="Ciudad"
                  {...register('emisor.ciudad', { required: 'La ciudad es obligatoria' })}
                  error={errors.emisor?.ciudad}
                />
              </div>
              <div className="form-row">
                <FormField label="Provincia" {...register('emisor.provincia')} />
                <FormField label="Teléfono (opcional)" type="tel" {...register('emisor.telefono')} />
              </div>
            </div>
          </fieldset>

          {/* DATOS DEL CLIENTE */}
          <fieldset className="fieldset-v3">
            <legend className="fieldset-legend">Datos del cliente</legend>
            <div className="fieldset-v3-body" style={{ marginTop: 'var(--space-4)' }}>

              {/* Checkbox cliente exterior */}
              <label className="input-toggle" style={{ marginBottom: 'var(--space-3)' }}>
                <input
                  type="checkbox"
                  {...register('cliente.clienteExterior')}
                />
                <span>Cliente fuera de España</span>
              </label>

              <FormField
                label="Nombre / Razón social"
                {...register('cliente.nombre', { required: 'El nombre del cliente es obligatorio' })}
                error={errors.cliente?.nombre}
              />
              <div className="form-row">
                <FormField
                  label={clienteExterior ? 'Número de identificación (opcional)' : 'NIF / CIF / NIE'}
                  {...register('cliente.nif', {
                    required: clienteExterior ? false : 'El NIF del cliente es obligatorio',
                    validate: (v) => {
                      if (clienteExterior) return true
                      return validarNif(v)
                    },
                  })}
                  error={errors.cliente?.nif}
                />
                <FormField
                  label="Email (opcional)"
                  type="email"
                  {...register('cliente.email', {
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email no válido' },
                  })}
                  error={errors.cliente?.email}
                />
              </div>
              <FormField label="Dirección (opcional)" {...register('cliente.direccion')} />
              <div className="form-row">
                <FormField
                  label={clienteExterior ? 'Código postal (opcional)' : 'Código postal'}
                  {...register('cliente.cp', {
                    pattern: clienteExterior
                      ? undefined
                      : { value: /^\d{5}$/, message: 'El CP debe tener 5 dígitos' },
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
            </div>
          </fieldset>

          {/* CONCEPTOS */}
          <fieldset className="fieldset-v3">
            <legend className="fieldset-legend">Conceptos</legend>

            {esFinanciero && (
              <label className="input-toggle" style={{ marginTop: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                <input
                  type="checkbox"
                  {...register('mostrarIrpf')}
                />
                <span>Incluir IRPF</span>
              </label>
            )}

            <div className="fieldset-v3-body" style={{ marginTop: 'var(--space-4)' }}>
              {fields.map((field, index) => {
                const linea = documento.lineas?.[index]
                const { base } = linea ? calcularLinea(linea) : { base: 0 }

                return (
                  <div key={field.id} className="linea-concepto">
                    <FormField
                      label="Descripción"
                      {...register(`lineas.${index}.descripcion`, {
                        required: 'La descripción es obligatoria',
                      })}
                      error={errors.lineas?.[index]?.descripcion}
                    />

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 'var(--space-3)' }}>
                      <FormField
                        label="Cantidad"
                        type="number"
                        step="any"
                        {...register(`lineas.${index}.cantidad`, {
                          valueAsNumber: true,
                          required: true,
                          min: { value: 0.01, message: 'Debe ser mayor que 0' },
                        })}
                        error={errors.lineas?.[index]?.cantidad}
                        className="w-24"
                        style={{ width: '6rem' }}
                      />
                      <FormField
                        label="Precio/ud (€)"
                        type="number"
                        step="0.01"
                        {...register(`lineas.${index}.precioUnitario`, {
                          valueAsNumber: true,
                          required: true,
                          min: { value: 0, message: 'No puede ser negativo' },
                        })}
                        error={errors.lineas?.[index]?.precioUnitario}
                        style={{ width: '7rem' }}
                      />

                      {esFinanciero && (
                        <>
                          <div className="input-group">
                            <label className="input-label">IVA</label>
                            <select
                              {...register(`lineas.${index}.iva`, { valueAsNumber: true })}
                              className="select-v3"
                              style={{ width: '6.5rem' }}
                            >
                              {TIPOS_IVA.map((t) => (
                                <option key={t} value={t}>{t}%</option>
                              ))}
                            </select>
                          </div>

                          {mostrarIrpf && (
                            <div className="input-group">
                              <label className="input-label">IRPF</label>
                              <select
                                {...register(`lineas.${index}.irpf`, { valueAsNumber: true })}
                                className="select-v3"
                                style={{ width: '6.5rem' }}
                              >
                                {TIPOS_IRPF.map((t) => (
                                  <option key={t} value={t}>{t}%</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </>
                      )}

                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)', marginLeft: 'auto' }}>
                        {/* <span style={{
                          fontSize: 'var(--text-sm)', fontWeight: 600,
                          color: 'var(--color-text)', paddingBottom: '0.5rem',
                          whiteSpace: 'nowrap',
                        }}>
                          {fmt(base)}
                        </span> */}
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
                            // opacity: fields.length === 1 ? 0.5 : 1,
                            transition: 'color var(--transition), background var(--transition)',
                            fontFamily: 'var(--font-body)',
                          }}
                          onMouseEnter={e => {
                            if (fields.length > 1) {
                              e.currentTarget.style.color = 'var(--color-error)'
                              e.currentTarget.style.background = 'var(--color-error-highlight)'
                            }
                          }}
                          onMouseLeave={e => {
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
                )
              })}
            </div>

            <Button
              variant="ghost"
              type="button"
              onClick={agregarLinea}
              style={{ width: '100%', marginTop: 'var(--space-3)', justifyContent: 'center' }}
            >
              <Plus size={15} />
              Añadir concepto
            </Button>

            {/* Totales */}
            {esFinanciero && (
              <div style={{
                borderTop: '1px solid var(--color-divider)',
                marginTop: 'var(--space-4)',
                paddingTop: 'var(--space-4)',
                display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
              }}>
                <div style={totalRowStyle}>
                  <span>Base imponible</span>
                  <span>{fmt(totales.baseImponible)}</span>
                </div>
                <div style={totalRowStyle}>
                  <span>IVA</span>
                  <span>+ {fmt(totales.totalIva)}</span>
                </div>
                {mostrarIrpf && totales.totalIrpf > 0 && (
                  <div style={totalRowStyle}>
                    <span>IRPF</span>
                    <span>− {fmt(totales.totalIrpf)}</span>
                  </div>
                )}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 'var(--text-base)', fontWeight: 700,
                  color: 'var(--color-text)',
                  paddingTop: 'var(--space-2)',
                  borderTop: '2px solid var(--color-border)',
                  marginTop: 'var(--space-1)',
                }}>
                  <span>TOTAL</span>
                  <span>{fmt(totales.total)}</span>
                </div>
              </div>
            )}
          </fieldset>

          {/* FORMA DE PAGO */}
          {esFinanciero && (
            <fieldset className="fieldset-v3">
              <legend className="fieldset-legend">Forma de pago</legend>
              <div className="fieldset-v3-body" style={{ marginTop: 'var(--space-4)' }}>
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
                      label="Teléfono (opcional)"
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

          {/* NOTAS */}
          <fieldset className="fieldset-v3">
            <legend className="fieldset-legend">Notas (opcional)</legend>
            <div style={{ marginTop: 'var(--space-4)' }}>
              <TextAreaField
                label="Observaciones"
                placeholder="Condiciones, agradecimiento, notas legales..."
                {...register('notas')}
                rows={3}
              />
            </div>
          </fieldset>

        </div>

        {/* ── COLUMNA DERECHA — Preview estática ────────────────────────────────────────────── */}
        <div className="hidden xl:flex" style={{ flexDirection: 'column', position: 'sticky', top: '72px', height: 'fit-content' }}>
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

      {/* ── Modal ────────────────────────────────────────────────────────────────────────── */}
      {modalAbierto && (
        <PreviewModal
          documento={documento}
          totales={totales}
          onClose={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
}
