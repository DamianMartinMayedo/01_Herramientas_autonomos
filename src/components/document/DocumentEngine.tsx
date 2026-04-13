/**
 * DocumentEngine — Orquestador principal del motor de documentos.
 * Combina formulario + preview en un layout de dos columnas.
 * Lo usan: FacturaPage, PresupuestoPage, AlbaranPage
 */
import { useState } from 'react'
import { useDocumentEngine } from '../../hooks/useDocumentEngine'
import type { DocumentoBase, MetodoPago } from '../../types/document.types'
import { TIPOS_IVA, TIPOS_IRPF } from '../../types/document.types'
import { DocumentPreview } from './DocumentPreview'
import { PreviewModal } from './PreviewModal'
import { FormField, TextAreaField } from '../ui/FormField'
import { Button } from '../ui/Button'
import { calcularLinea } from '../../utils/calculos'
import { validarNif } from '../../utils/validarNif'
import { Trash2, Plus, Eye, Save } from 'lucide-react'

// Título de la sección de encabezado según el tipo de documento
const TITULO_ENCABEZADO: Record<DocumentoBase['tipo'], string> = {
  factura: 'Encabezado de la factura',
  presupuesto: 'Encabezado del presupuesto',
  albaran: 'Encabezado del albarán',
}

interface DocumentEngineProps {
  tipo: DocumentoBase['tipo']
  titulo: string
}

export function DocumentEngine({ tipo, titulo }: DocumentEngineProps) {
  const [modalAbierto, setModalAbierto] = useState(false)

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

  // Valida el form antes de abrir el modal
  const handleAbrirPrevia = form.handleSubmit(() => setModalAbierto(true))

  // Clases reutilizables para secciones tipo card
  const card = 'bg-white rounded-xl border border-stone-200 p-5 space-y-4 shadow-sm'
  const cardTitle = 'text-xs font-semibold uppercase tracking-widest text-stone-400'
  const selectCls =
    'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-teal-600'

  return (
    <div className="min-h-screen bg-stone-50">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-200 px-6 py-3 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-stone-900">{titulo}</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={guardarEmisor} type="button">
            <Save size={16} />
            Guardar mis datos
          </Button>
          <Button variant="primary" onClick={handleAbrirPrevia} type="button">
            <Eye size={16} />
            Vista previa y exportar
          </Button>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6 p-6 max-w-[1400px] mx-auto">

        {/* ── COLUMNA IZQUIERDA — Formulario ────────────────────────────────── */}
        <div className="space-y-5">

          {/* ENCABEZADO */}
          <div className={card}>
            <h2 className={cardTitle}>{TITULO_ENCABEZADO[tipo]}</h2>
            <div className="grid grid-cols-2 gap-4">
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
                  className="col-span-2"
                />
              )}
            </div>
          </div>

          {/* TUS DATOS */}
          <div className={card}>
            <h2 className={cardTitle}>Tus datos</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Nombre / Razón social"
                {...register('emisor.nombre', { required: 'El nombre es obligatorio' })}
                error={errors.emisor?.nombre}
                className="col-span-2"
              />
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
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Email no válido',
                  },
                })}
                error={errors.emisor?.email}
              />
              <FormField
                label="Dirección"
                {...register('emisor.direccion', { required: 'La dirección es obligatoria' })}
                error={errors.emisor?.direccion}
                className="col-span-2"
              />
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
              <FormField
                label="Provincia"
                {...register('emisor.provincia')}
              />
              <FormField
                label="Teléfono (opcional)"
                type="tel"
                {...register('emisor.telefono')}
              />
            </div>
          </div>

          {/* DATOS DEL CLIENTE */}
          <div className={card}>
            <h2 className={cardTitle}>Datos del cliente</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Nombre / Razón social"
                {...register('cliente.nombre', { required: 'El nombre del cliente es obligatorio' })}
                error={errors.cliente?.nombre}
                className="col-span-2"
              />
              <FormField
                label="NIF / CIF / NIE"
                {...register('cliente.nif', {
                  required: 'El NIF del cliente es obligatorio',
                  validate: (v) => validarNif(v),
                })}
                error={errors.cliente?.nif}
              />
              <FormField
                label="Email (opcional)"
                type="email"
                {...register('cliente.email', {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Email no válido',
                  },
                })}
                error={errors.cliente?.email}
              />
              <FormField
                label="Dirección (opcional)"
                {...register('cliente.direccion')}
                className="col-span-2"
              />
              <FormField
                label="Código postal"
                {...register('cliente.cp', {
                  pattern: { value: /^\d{5}$/, message: 'El CP debe tener 5 dígitos' },
                })}
                error={errors.cliente?.cp}
              />
              <FormField
                label="Ciudad"
                {...register('cliente.ciudad')}
              />
              <FormField
                label="Provincia"
                {...register('cliente.provincia')}
              />
            </div>
          </div>

          {/* CONCEPTOS */}
          <div className={card}>
            <div className="flex items-center justify-between">
              <h2 className={cardTitle}>Conceptos</h2>
              {esFinanciero && (
                <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...register('mostrarIrpf')}
                    className="rounded border-stone-300 text-teal-700 focus:ring-teal-600"
                  />
                  Incluir IRPF
                </label>
              )}
            </div>

            {/* Lista de líneas */}
            <div className="space-y-3">
              {fields.map((field, index) => {
                const linea = documento.lineas?.[index]
                const { base } = linea ? calcularLinea(linea) : { base: 0 }

                return (
                  <div
                    key={field.id}
                    className="bg-stone-50 border border-stone-200 rounded-lg p-4 space-y-3"
                  >
                    {/* Fila 1 — Descripción ocupa todo el ancho */}
                    <FormField
                      label="Descripción"
                      {...register(`lineas.${index}.descripcion`, {
                        required: 'La descripción es obligatoria',
                      })}
                      error={errors.lineas?.[index]?.descripcion}
                    />

                    {/* Fila 2 — Campos numéricos en una sola línea */}
                    <div className="flex flex-wrap items-end gap-3">
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
                        className="w-32"
                      />

                      {esFinanciero && (
                        <>
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-stone-600">IVA</label>
                            <select
                              {...register(`lineas.${index}.iva`, { valueAsNumber: true })}
                              className="rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 w-[4.5rem]"
                            >
                              {TIPOS_IVA.map((t) => (
                                <option key={t} value={t}>{t}%</option>
                              ))}
                            </select>
                          </div>

                          {mostrarIrpf && (
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-medium text-stone-600">IRPF</label>
                              <select
                                {...register(`lineas.${index}.irpf`, { valueAsNumber: true })}
                                className="rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 w-[4.5rem]"
                              >
                                {TIPOS_IRPF.map((t) => (
                                  <option key={t} value={t}>{t}%</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </>
                      )}

                      {/* Importe + botón eliminar alineados a la derecha */}
                      <div className="flex items-end gap-2 ml-auto">
                        <span className="text-sm font-semibold text-stone-700 pb-2 whitespace-nowrap">
                          {fmt(base)}
                        </span>
                        <button
                          type="button"
                          onClick={() => eliminarLinea(index)}
                          disabled={fields.length === 1}
                          className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          aria-label="Eliminar línea"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <Button variant="ghost" type="button" onClick={agregarLinea} className="w-full mt-1">
              <Plus size={16} />
              Añadir concepto
            </Button>

            {/* Totales */}
            {esFinanciero && (
              <div className="border-t border-stone-200 pt-4 space-y-1.5">
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Base imponible</span>
                  <span>{fmt(totales.baseImponible)}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-600">
                  <span>IVA</span>
                  <span>+ {fmt(totales.totalIva)}</span>
                </div>
                {mostrarIrpf && totales.totalIrpf > 0 && (
                  <div className="flex justify-between text-sm text-stone-600">
                    <span>IRPF</span>
                    <span>− {fmt(totales.totalIrpf)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold text-stone-900 pt-1.5 border-t border-stone-200">
                  <span>TOTAL</span>
                  <span>{fmt(totales.total)}</span>
                </div>
              </div>
            )}
          </div>

          {/* FORMA DE PAGO */}
          {esFinanciero && (
            <div className={card}>
              <h2 className={cardTitle}>Forma de pago</h2>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-stone-600">Método de pago</label>
                  <select {...register('formaPago.metodo')} className={selectCls}>
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
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label="Email de PayPal"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      {...register('formaPago.email')}
                      className="col-span-2"
                    />
                    <FormField
                      label="Teléfono (opcional)"
                      type="tel"
                      placeholder="600 000 000"
                      {...register('formaPago.telefono')}
                      className="col-span-2"
                    />
                  </div>
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
            </div>
          )}

          {/* NOTAS */}
          <div className={card}>
            <h2 className={cardTitle}>Notas (opcional)</h2>
            <TextAreaField
              label="Observaciones"
              placeholder="Condiciones, agradecimiento, notas legales..."
              {...register('notas')}
              rows={3}
            />
          </div>

        </div>

        {/* ── COLUMNA DERECHA — Preview estática ────────────────────────────── */}
        <div className="hidden xl:flex flex-col sticky top-24 h-fit">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
            Vista previa en tiempo real
          </p>
          {/*
            DocumentPreview tiene width: 210mm (~794px).
            La columna tiene ~640-700px disponibles según el viewport.
            Usamos zoom CSS para escalar → reduce tanto el rendering como el
            espacio en layout, y centrar con margin:auto.
          */}
          <div className="overflow-hidden rounded-xl shadow-lg border border-stone-200 bg-white flex justify-center">
            <div style={{ zoom: 0.82 }}>
              <DocumentPreview documento={documento} totales={totales} />
            </div>
          </div>
        </div>

      </div>

      {/* ── Modal de vista previa ──────────────────────────────────────────── */}
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
