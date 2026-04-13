/**
 * DocumentEngine — Orquestador principal del motor de documentos.
 * Combina formulario + preview en un layout de dos columnas.
 * Lo usan: FacturaPage, PresupuestoPage, AlbaranPage
 *
 * Flujo de exportación:
 *   1. Usuario rellena el formulario
 *   2. Pulsa "Vista previa y exportar" → se valida el formulario
 *   3. Se abre un modal con la preview del documento
 *   4. Usuario confirma → se abre nueva pestaña con botón de imprimir/guardar PDF
 *   5. O vuelve a editar cerrando el modal
 */
import { useState } from 'react'
import { useDocumentEngine } from '../../hooks/useDocumentEngine'
import type { DocumentoBase } from '../../types/document.types'
import { TIPOS_IVA, TIPOS_IRPF } from '../../types/document.types'
import { DocumentPreview } from './DocumentPreview'
import { PreviewModal } from './PreviewModal'
import { FormField, TextAreaField } from '../ui/FormField'
import { Button } from '../ui/Button'
import { calcularLinea } from '../../utils/calculos'
import { validarNif } from '../../utils/validarNif'
import { Trash2, Plus, Eye, Save, FileText } from 'lucide-react'

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

  // Abre el modal solo si el formulario es válido
  const handleAbrirPrevia = form.handleSubmit(() => {
    setModalAbierto(true)
  })

  return (
    <div className="min-h-screen bg-stone-50">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-700" />
          <h1 className="text-base font-semibold text-stone-800">{titulo}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={guardarEmisor}>
            <Save className="w-4 h-4" />
            Guardar mis datos
          </Button>
          <Button size="sm" onClick={handleAbrirPrevia}>
            <Eye className="w-4 h-4" />
            Vista previa y exportar
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-0 min-h-[calc(100vh-57px)]">

        {/* ── COLUMNA IZQUIERDA — Formulario ───────────────────────────── */}
        <div className="p-6 overflow-y-auto border-r border-stone-200">
          <form className="space-y-6 max-w-xl mx-auto">

            {/* Número y fechas */}
            <section>
              <h2 className="text-sm font-semibold text-stone-700 mb-3">Encabezado de la factura</h2>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Número"
                  {...register('numero', { required: 'El número es obligatorio' })}
                  error={errors.numero}
                />
                <FormField
                  label="Fecha de creación"
                  type="date"
                  {...register('fecha', { required: 'La fecha es obligatoria' })}
                  error={errors.fecha}
                />
                {esFinanciero && (
                  <FormField
                    label="Fecha de vencimiento"
                    type="date"
                    {...register('fechaVencimiento', {
                      validate: (v) => {
                        if (!v) return true
                        const fechaDoc = form.getValues('fecha')
                        if (!fechaDoc) return true
                        return v >= fechaDoc || 'El vencimiento no puede ser anterior a la fecha del documento'
                      },
                    })}
                    error={errors.fechaVencimiento}
                    className="col-span-2"
                  />
                )}
              </div>
            </section>

            {/* Tus datos (emisor) */}
            <section>
              <h2 className="text-sm font-semibold text-stone-700 mb-3">Tus datos</h2>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Nombre / Razón social"
                  {...register('emisor.nombre', {
                    required: 'El nombre es obligatorio',
                    minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                  })}
                  error={errors.emisor?.nombre}
                  className="col-span-2"
                />
                <FormField
                  label="NIF / CIF"
                  placeholder="12345678Z o B12345674"
                  {...register('emisor.nif', {
                    required: 'El NIF/CIF es obligatorio',
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
                      message: 'Introduce un email válido',
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
                  label="CP"
                  maxLength={5}
                  placeholder="41001"
                  {...register('emisor.cp', {
                    required: 'El CP es obligatorio',
                    pattern: { value: /^\d{5}$/, message: 'Debe tener 5 dígitos' },
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
                  {...register('emisor.provincia', { required: 'La provincia es obligatoria' })}
                  error={errors.emisor?.provincia}
                />
                <FormField
                  label="Teléfono"
                  placeholder="Opcional"
                  {...register('emisor.telefono')}
                />
              </div>
            </section>

            {/* Datos del cliente */}
            <section>
              <h2 className="text-sm font-semibold text-stone-700 mb-3">Datos del cliente</h2>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Nombre / Razón social"
                  {...register('cliente.nombre', {
                    required: 'El nombre del cliente es obligatorio',
                    minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                  })}
                  error={errors.cliente?.nombre}
                  className="col-span-2"
                />

                {/* ── NIF del cliente: OBLIGATORIO ────────────────────── */}
                <FormField
                  label="NIF / CIF"
                  placeholder="12345678Z o B12345674"
                  {...register('cliente.nif', {
                    required: 'El NIF/CIF del cliente es obligatorio',
                    validate: (v) => validarNif(v),
                  })}
                  error={errors.cliente?.nif}
                />

                <FormField
                  label="Email"
                  type="email"
                  placeholder="Opcional"
                  {...register('cliente.email', {
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Introduce un email válido',
                    },
                  })}
                  error={errors.cliente?.email}
                />
                <FormField
                  label="Dirección"
                  placeholder="Opcional"
                  {...register('cliente.direccion')}
                  className="col-span-2"
                />
                <FormField
                  label="CP"
                  placeholder="Opcional"
                  maxLength={5}
                  {...register('cliente.cp', {
                    pattern: { value: /^(\d{5})?$/, message: 'Debe tener 5 dígitos' },
                  })}
                  error={errors.cliente?.cp}
                />
                <FormField label="Ciudad" placeholder="Opcional" {...register('cliente.ciudad')} />
                <FormField label="Provincia" placeholder="Opcional" {...register('cliente.provincia')} />
              </div>
            </section>

            {/* Conceptos / líneas */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-stone-700">Conceptos</h2>
                {esFinanciero && (
                  <label className="flex items-center gap-2 text-xs text-stone-500 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('mostrarIrpf')}
                      className="rounded border-stone-300 text-teal-700 focus:ring-teal-600"
                    />
                    Incluir IRPF
                  </label>
                )}
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => {
                  const linea = documento.lineas?.[index]
                  const { base } = linea ? calcularLinea(linea) : { base: 0 }

                  return (
                    <div
                      key={field.id}
                      className="bg-white border border-stone-200 rounded-xl p-3 space-y-2"
                    >
                      <div className="flex gap-2">
                        <FormField
                          label="Descripción"
                          placeholder="Descripción del servicio o producto"
                          className="flex-1"
                          {...register(`lineas.${index}.descripcion`, {
                            required: 'La descripción es obligatoria',
                          })}
                          error={errors.lineas?.[index]?.descripcion}
                        />
                        <button
                          type="button"
                          onClick={() => eliminarLinea(index)}
                          className="mt-5 p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Eliminar línea"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          label="Cantidad"
                          type="number"
                          step="0.01"
                          min="0.01"
                          {...register(`lineas.${index}.cantidad`, {
                            valueAsNumber: true,
                            required: 'Obligatorio',
                            min: { value: 0.01, message: 'Debe ser mayor que 0' },
                          })}
                          error={errors.lineas?.[index]?.cantidad}
                        />
                        <FormField
                          label="Precio unitario (€)"
                          type="number"
                          step="0.01"
                          min="0"
                          {...register(`lineas.${index}.precioUnitario`, {
                            valueAsNumber: true,
                            required: 'Obligatorio',
                            min: { value: 0, message: 'No puede ser negativo' },
                          })}
                          error={errors.lineas?.[index]?.precioUnitario}
                        />
                        {esFinanciero && (
                          <>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-medium text-stone-600">IVA</label>
                              <select
                                {...register(`lineas.${index}.iva`, { valueAsNumber: true })}
                                className="rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
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
                                  className="rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                                >
                                  {TIPOS_IRPF.map((t) => (
                                    <option key={t} value={t}>{t}%</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-stone-400">Importe: </span>
                        <span className="text-sm font-semibold text-stone-700">{fmt(base)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={agregarLinea}
                className="mt-3"
              >
                <Plus className="w-4 h-4" />
                Añadir concepto
              </Button>
            </section>

            {/* Totales */}
            {esFinanciero && (
              <section className="bg-teal-50 border border-teal-100 rounded-xl p-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-stone-600">
                    <span>Base imponible</span>
                    <span>{fmt(totales.baseImponible)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>IVA</span>
                    <span>+ {fmt(totales.totalIva)}</span>
                  </div>
                  {mostrarIrpf && totales.totalIrpf > 0 && (
                    <div className="flex justify-between text-stone-600">
                      <span>IRPF</span>
                      <span className="text-red-600">− {fmt(totales.totalIrpf)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-teal-800 pt-2 border-t border-teal-200">
                    <span>TOTAL</span>
                    <span>{fmt(totales.total)}</span>
                  </div>
                </div>
              </section>
            )}

            {/* Notas */}
            <TextAreaField
              label="Notas (opcional)"
              placeholder="Condiciones de pago, agradecimiento, etc."
              {...register('notas')}
            />
          </form>
        </div>

        {/* ── COLUMNA DERECHA — Preview estática ─────────────────────── */}
        <div className="bg-stone-100 p-6 overflow-y-auto hidden xl:flex items-start justify-center">
          <div className="shadow-lg overflow-hidden" style={{ width: '210mm' }}>
            <DocumentPreview documento={documento} totales={totales} />
          </div>
        </div>
      </div>

      {/* ── Modal de vista previa ─────────────────────────────────────── */}
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
