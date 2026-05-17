/**
 * ContratoPage.tsx
 * Generador de contrato de prestación de servicios.
 * Usa LegalDocEngine como orquestador.
 */
import { useMemo } from 'react'
import type { FieldError } from 'react-hook-form'
import { LegalDocEngine } from '../../components/legalDoc/LegalDocEngine'
import { FormField, TextAreaField } from '../../components/ui/FormField'
import type { ContratoServiciosDoc, ParteLegal } from '../../types/legalDoc.types'
import { DEFAULT_PARTE_LEGAL, DEFAULT_METADATOS } from '../../types/legalDoc.types'
import type { RegularClient } from '../../types/regularClient.types'
import type { Empresa } from '../../types/empresa.types'
import { Seo } from '../../components/seo/Seo'

interface ContratoPageProps {
  embedded?: boolean
  onBack?: () => void
  defaultValues?: ContratoServiciosDoc
  onSave?: (documento: ContratoServiciosDoc, keepOpen?: boolean) => Promise<import('../../types/document.types').SaveResult | void>
  saving?: boolean
  clientes?: RegularClient[]
  empresa?: Empresa | null
  onEmailContrato?: (documento: ContratoServiciosDoc, saved?: import('../../types/document.types').SaveResult | null) => void
  estadoContrato?: string
  autoOpenPreview?: boolean
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

type ErrorsObj = Record<string, FieldError | undefined>

function FormParte({
  titulo,
  prefix,
  register,
  errors,
  clientes,
  selectedClientId,
  onClienteSelect,
}: {
  titulo: string
  prefix: 'prestador' | 'cliente'
  register: RegisterFn
  errors: ErrorsObj
  clientes?: RegularClient[]
  selectedClientId?: string
  onClienteSelect?: (id: string) => void
}) {
  const e = (errors[prefix] ?? {}) as Partial<Record<keyof ParteLegal, FieldError>>
  return (
    <fieldset className="fieldset-v3">
      <legend className="fieldset-legend">{titulo}</legend>
      <div className="fieldset-v3-body">
        {prefix === 'cliente' && clientes && clientes.length > 0 && onClienteSelect && (
          <div className="input-group">
            <label className="input-label">Cliente frecuente</label>
            <select
              className="select-v3"
              value={selectedClientId}
              onChange={(e) => onClienteSelect(e.target.value)}
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
        <FormField
          label="Nombre / Razón social *"
          {...register(`${prefix}.nombre`, { required: 'Obligatorio' })}
          error={e.nombre}
        />
        <div className="form-row">
          <FormField
            label="NIF / CIF / NIE *"
            {...register(`${prefix}.nif`, { required: 'Obligatorio' })}
            error={e.nif}
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
          error={e.direccion}
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
  autoOpenPreview,
}: ContratoPageProps) {
  // useMemo estabiliza la referencia para evitar que `useEffect` en LegalDocEngine
  // dispare un reset() del form cada vez que el padre re-renderiza (p.ej. cuando
  // Supabase refresca el token al volver el foco a la pestaña).
  // IMPORTANTE: `onSave` no va en deps porque UserPage lo crea inline en cada render
  // (`onSave={(d) => saveLegal(...)}`); solo nos interesa SU EXISTENCIA (modo guest vs registrado).
  const isGuest = !onSave
  const resolvedDefaults = useMemo(() => {
    const base = buildDefaultValues(empresa, defaultValues)
    if (isGuest && !base.metadatos?.referencia) {
      base.metadatos.referencia = `CON-${new Date().getFullYear()}-001`
    }
    return base
  }, [empresa, defaultValues, isGuest])

  return (
    <>
      <Seo
        title="Generador de contratos para autónomos"
        description="Crea contratos de prestación de servicios profesionales en minutos. Plantilla adaptada a la legislación española."
      />
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
        autoOpenPreview={autoOpenPreview}
      renderForm={({ register, getValues, errors, clientes, selectedClientId, onClienteSelect }) => {
        const reg = register as RegisterFn
        const err = errors as unknown as ErrorsObj
        const duracion = getValues('duracion') as string
        const metaErr = (err['metadatos'] ?? {}) as Record<string, FieldError | undefined>

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
                      error={onSave ? undefined : metaErr['referencia']}
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
                    error={metaErr['fecha']}
                  />
                </div>
                <FormField
                  label="Lugar de firma *"
                  placeholder="Ciudad donde se firma"
                  {...reg('metadatos.lugar', { required: 'Obligatorio' })}
                  error={metaErr['lugar']}
                />
              </div>
            </fieldset>

            {/* Partes */}
            <FormParte titulo="Prestador del servicio (tú)" prefix="prestador" register={reg} errors={err} />
            <FormParte
              titulo="Cliente"
              prefix="cliente"
              register={reg}
              errors={err}
              clientes={clientes}
              selectedClientId={selectedClientId}
              onClienteSelect={onClienteSelect}
            />

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
                    error={err['importeTotal']}
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
                    error={err['fechaInicio']}
                  />
                </div>
                {duracion === 'fecha_fin' && (
                  <FormField
                    label="Fecha de fin *"
                    type="date"
                    {...reg('fechaFin', { required: 'Obligatorio si hay fecha de fin' })}
                    error={err['fechaFin']}
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
                  error={err['jurisdiccion']}
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
    </>
  )
}
