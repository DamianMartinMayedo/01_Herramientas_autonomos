/**
 * ContratoPage.tsx
 * Generador de contrato de prestación de servicios.
 * Usa LegalDocEngine como orquestador.
 */
import { LegalDocEngine } from '../../components/legalDoc/LegalDocEngine'
import { FormField, TextAreaField } from '../../components/ui/FormField'
import type { ContratoServiciosDoc, ParteLegal } from '../../types/legalDoc.types'
import { DEFAULT_PARTE_LEGAL, DEFAULT_METADATOS } from '../../types/legalDoc.types'
import type { RegularClient } from '../../types/regularClient.types'
import type { Empresa } from '../../types/empresa.types'

interface ContratoPageProps {
  embedded?: boolean
  onBack?: () => void
  defaultValues?: ContratoServiciosDoc
  onSave?: (documento: ContratoServiciosDoc) => Promise<void>
  saving?: boolean
  clientes?: RegularClient[]
  empresa?: Empresa | null
  onEmailContrato?: (documento: ContratoServiciosDoc) => void
  estadoContrato?: string
}

const DEFAULT_CONTRATO: ContratoServiciosDoc = {
  tipo: 'contrato',
  metadatos: { ...DEFAULT_METADATOS, referencia: '' },
  prestador: { ...DEFAULT_PARTE_LEGAL },
  cliente:   { ...DEFAULT_PARTE_LEGAL },
  objetoContrato: '',
  importeTotal: undefined,
  periodoFacturacion: 'pago_unico',
  formaPago: '',
  duracion: 'por_proyecto',
  fechaInicio: new Date().toISOString().slice(0, 10),
  fechaFin: '',
  clausulaConfidencialidad: false,
  clausulaPropiedadIntelectual: true,
  penalizacionIncumplimiento: '',
  jurisdiccion: '',
  notas: '',
}

function buildDefaultValues(empresa: Empresa | null | undefined, existing?: ContratoServiciosDoc): ContratoServiciosDoc {
  if (existing) return existing
  const base = { ...DEFAULT_CONTRATO }
  if (empresa) {
    base.prestador = {
      ...DEFAULT_PARTE_LEGAL,
      nombre: empresa.nombre,
      nif: empresa.nif,
      direccion: empresa.direccion,
      cp: empresa.cp,
      ciudad: empresa.ciudad,
      provincia: empresa.provincia,
      email: empresa.email,
      telefono: empresa.telefono ?? '',
    }
    base.jurisdiccion = empresa.ciudad
    base.metadatos.lugar = empresa.ciudad
  }
  return base
}

// ─── Sub-formulario de parte (prestador / cliente) ─────────────────────────────

type RegisterFn = (name: string, opts?: Record<string, unknown>) => Record<string, unknown>

type ErrorsObj = Record<string, { message?: string } | undefined>

function FormParte({
  titulo,
  prefix,
  register,
  errors,
}: {
  titulo: string
  prefix: 'prestador' | 'cliente'
  register: RegisterFn
  errors: ErrorsObj
}) {
  const e = (errors[prefix] ?? {}) as Partial<Record<keyof ParteLegal, { message?: string }>>
  return (
    <fieldset className="fieldset-v3">
      <legend className="fieldset-legend">{titulo}</legend>
      <div className="fieldset-v3-body">
        <FormField
          label="Nombre / Razón social *"
          {...register(`${prefix}.nombre`, { required: 'Obligatorio' })}
          error={e.nombre as never}
        />
        <div className="form-row">
          <FormField
            label="NIF / CIF / NIE *"
            {...register(`${prefix}.nif`, { required: 'Obligatorio' })}
            error={e.nif as never}
          />
          <FormField
            label="Email"
            type="email"
            {...register(`${prefix}.email`)}
          />
        </div>
        <FormField
          label="Dirección *"
          {...register(`${prefix}.direccion`, { required: 'Obligatorio' })}
          error={e.direccion as never}
        />
        <div className="form-row">
          <FormField label="Código postal" {...register(`${prefix}.cp`)} />
          <FormField label="Ciudad" {...register(`${prefix}.ciudad`)} />
        </div>
        <div className="form-row">
          <FormField label="Provincia" {...register(`${prefix}.provincia`)} />
          <FormField label="Teléfono" type="tel" {...register(`${prefix}.telefono`)} />
        </div>
        <div className="form-row">
          <FormField label="Representante" {...register(`${prefix}.representante`)} />
          <FormField label="Cargo" {...register(`${prefix}.cargo`)} />
        </div>
      </div>
    </fieldset>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export function ContratoPage({
  embedded = false,
  onBack,
  defaultValues,
  onSave,
  saving = false,
  clientes = [],
  empresa,
  onEmailContrato,
  estadoContrato,
}: ContratoPageProps) {
  const resolvedDefaults = buildDefaultValues(empresa, defaultValues)

  // Modo guest: inyectar número editable
  if (!onSave && !resolvedDefaults.metadatos?.referencia) {
    resolvedDefaults.metadatos.referencia = `CON-${new Date().getFullYear()}-001`
  }

  return (
    <LegalDocEngine<ContratoServiciosDoc>
      tipo="contrato"
      titulo="Contratos de servicios"
      toolClass="tool-contrato"
      defaultValues={resolvedDefaults}
      buildDoc={(v) => ({ ...v, tipo: 'contrato' as const })}
      embedded={embedded}
      onBack={onBack}
      onSave={onSave}
      saving={saving}
      clientes={clientes}
      clienteField="cliente"
      onEmail={onEmailContrato}
      estadoDoc={estadoContrato}
      renderForm={({ register, watch, errors }) => {
        const reg = register as RegisterFn
        const err = errors as ErrorsObj
        const duracion = (watch('duracion' as never) as unknown) as string
        const metaErr = (err['metadatos'] ?? {}) as Record<string, { message?: string }>

        return (
          <>
            {/* Encabezado del documento */}
            <fieldset className="fieldset-v3">
              <legend className="fieldset-legend">Encabezado de contrato</legend>
              <div className="fieldset-v3-body">
                <div className="form-row">
                  <div>
                    <FormField
                      label={onSave ? 'Nº contrato' : 'Nº contrato *'}
                      readOnly={!!onSave}
                      placeholder={onSave ? 'CON-YYYY-XXX' : 'CON-2026-001'}
                      style={onSave ? {
                        opacity: 0.55,
                        cursor: 'default',
                        borderStyle: 'dashed',
                        boxShadow: 'none',
                        transform: 'none',
                        background: 'var(--color-surface-offset)',
                      } : undefined}
                      {...reg('metadatos.referencia', onSave ? {} : { required: 'Obligatorio' })}
                      error={onSave ? undefined : metaErr['referencia'] as never}
                    />
                    {onSave && !defaultValues?.metadatos?.referencia && (
                      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-faint)', marginTop: 'var(--space-1)' }}>
                        Se asignará al finalizar
                      </p>
                    )}
                  </div>
                  <FormField
                    label="Fecha *"
                    type="date"
                    {...reg('metadatos.fecha', { required: 'Obligatorio' })}
                    error={metaErr['fecha'] as never}
                  />
                </div>
                <FormField
                  label="Lugar de firma *"
                  placeholder="Ciudad donde se firma"
                  {...reg('metadatos.lugar', { required: 'Obligatorio' })}
                  error={metaErr['lugar'] as never}
                />
              </div>
            </fieldset>

            {/* Partes */}
            <FormParte titulo="Prestador del servicio (tú)" prefix="prestador" register={reg} errors={err} />
            <FormParte titulo="Cliente" prefix="cliente" register={reg} errors={err} />

            {/* Objeto y condiciones */}
            <fieldset className="fieldset-v3">
              <legend className="fieldset-legend">Objeto y condiciones económicas</legend>
              <div className="fieldset-v3-body">
                <TextAreaField
                  label="Objeto del contrato *"
                  placeholder="Describe los servicios que vas a prestar..."
                  {...reg('objetoContrato', { required: 'Obligatorio' })}
                  rows={4}
                />
                <div className="form-row">
                  <FormField
                    label="Importe total (€) *"
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                    error={err['importeTotal'] as never}
                    {...reg('importeTotal', { required: 'Obligatorio', valueAsNumber: true })}
                  />
                  <div className="input-group">
                    <label className="input-label">Periodo de facturación</label>
                    <select {...reg('periodoFacturacion')} className="select-v3">
                      <option value="pago_unico">Pago único</option>
                      <option value="mensual">Mensual</option>
                      <option value="quincenal">Quincenal</option>
                      <option value="semanal">Semanal</option>
                      <option value="por_hito">Por hito / entregable</option>
                    </select>
                  </div>
                </div>
                <FormField
                  label="Forma de pago"
                  placeholder="Ej: transferencia bancaria a 30 días"
                  {...reg('formaPago')}
                />
              </div>
            </fieldset>

            {/* Duración */}
            <fieldset className="fieldset-v3">
              <legend className="fieldset-legend">Duración</legend>
              <div className="fieldset-v3-body">
                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Tipo de duración</label>
                    <select {...reg('duracion')} className="select-v3">
                      <option value="por_proyecto">Por proyecto</option>
                      <option value="indefinido">Indefinida</option>
                      <option value="fecha_fin">Con fecha de fin</option>
                    </select>
                  </div>
                  <FormField
                    label="Fecha de inicio *"
                    type="date"
                    {...reg('fechaInicio', { required: 'Obligatorio' })}
                    error={err['fechaInicio'] as never}
                  />
                </div>
                {duracion === 'fecha_fin' && (
                  <FormField
                    label="Fecha de fin *"
                    type="date"
                    {...reg('fechaFin', { required: 'Obligatorio si hay fecha de fin' })}
                    error={err['fechaFin'] as never}
                  />
                )}
              </div>
            </fieldset>

            {/* Cláusulas opcionales */}
            <fieldset className="fieldset-v3">
              <legend className="fieldset-legend">Cláusulas opcionales</legend>
              <div className="fieldset-v3-body" style={{ gap: 'var(--space-3)' }}>
                <label className="input-toggle">
                  <input type="checkbox" {...reg('clausulaConfidencialidad')} />
                  <span>Incluir cláusula de confidencialidad</span>
                </label>
                <label className="input-toggle">
                  <input type="checkbox" {...reg('clausulaPropiedadIntelectual')} />
                  <span>Incluir cláusula de propiedad intelectual (los entregables son del cliente)</span>
                </label>
                <TextAreaField
                  label="Penalización por incumplimiento (opcional)"
                  placeholder="Describe las consecuencias en caso de incumplimiento..."
                  {...reg('penalizacionIncumplimiento')}
                  rows={2}
                />
                <FormField
                  label="Jurisdicción (ciudad) *"
                  placeholder="Ciudad competente en caso de conflicto"
                  error={err['jurisdiccion'] as never}
                  {...reg('jurisdiccion', { required: 'Obligatorio' })}
                />
              </div>
            </fieldset>

            {/* Notas */}
            <fieldset className="fieldset-v3">
              <legend className="fieldset-legend">Notas</legend>
              <div>
                <TextAreaField
                  label="Observaciones"
                  placeholder="Cualquier nota adicional..."
                  {...reg('notas')}
                  rows={3}
                />
              </div>
            </fieldset>
          </>
        )
      }}
    />
  )
}
