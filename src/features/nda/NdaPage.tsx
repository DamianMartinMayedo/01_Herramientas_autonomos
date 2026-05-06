/**
 * NdaPage.tsx
 * Generador de acuerdo de confidencialidad (NDA).
 */
import type { FieldError } from 'react-hook-form'
import { LegalDocEngine } from '../../components/legalDoc/LegalDocEngine'
import { FormField, TextAreaField } from '../../components/ui/FormField'
import type { NdaDoc, ParteLegal } from '../../types/legalDoc.types'
import { DEFAULT_PARTE_LEGAL, DEFAULT_METADATOS } from '../../types/legalDoc.types'
import type { RegularClient } from '../../types/regularClient.types'
import type { Empresa } from '../../types/empresa.types'
import { Seo } from '../../components/seo/Seo'

// ─── Valores por defecto ─────────────────────────────────────────────────────

const DEFAULT_NDA: NdaDoc = {
  tipo: 'nda',
  metadatos: { ...DEFAULT_METADATOS, referencia: '' },
  parteA: { ...DEFAULT_PARTE_LEGAL },
  parteB: { ...DEFAULT_PARTE_LEGAL },
  direction: 'unilateral',
  objetoConfidencialidad: '',
  excepciones: '',
  duracionMeses: 24,
  penalizacion: '',
  jurisdiccion: '',
  notas: '',
}

function buildDefaultValues(empresa: Empresa | null | undefined, existing?: NdaDoc): NdaDoc {
  if (existing) return existing
  const base = { ...DEFAULT_NDA }
  if (empresa) {
    base.parteA = {
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

// ─── Sub-formulario de parte ────────────────────────────────────────────────────
type RegisterFn = (name: string, opts?: Record<string, unknown>) => Record<string, unknown>
type ErrorsObj = Record<string, FieldError | undefined>

function FormParte({
  titulo,
  prefix,
  register,
  errors,
}: {
  titulo: string
  prefix: 'parteA' | 'parteB'
  register: RegisterFn
  errors: ErrorsObj
}) {
  const e = (errors[prefix] ?? {}) as Partial<Record<keyof ParteLegal, FieldError>>
  return (
    <fieldset className="fieldset-v3">
      <legend className="fieldset-legend">{titulo}</legend>
      <div className="fieldset-v3-body">
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
          <FormField label="Email" type="email" {...register(`${prefix}.email`)} />
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

interface NdaPageProps {
  embedded?: boolean
  onBack?: () => void
  defaultValues?: NdaDoc
  onSave?: (documento: NdaDoc) => Promise<void>
  saving?: boolean
  clientes?: RegularClient[]
  empresa?: Empresa | null
  onEmailNda?: (documento: NdaDoc) => void
  estadoNda?: string
  autoOpenPreview?: boolean
}

export function NdaPage({
  embedded = false,
  onBack,
  defaultValues,
  onSave,
  saving = false,
  clientes = [],
  empresa,
  onEmailNda,
  estadoNda,
  autoOpenPreview,
}: NdaPageProps) {
  const resolvedDefaults = buildDefaultValues(empresa, defaultValues)

  if (!onSave && !resolvedDefaults.metadatos?.referencia) {
    resolvedDefaults.metadatos.referencia = `NDA-${new Date().getFullYear()}-001`
  }

  return (
    <>
      <Seo
        title="Generador de NDA online"
        description="Crea acuerdos de confidencialidad (NDA) unilaterales o bilaterales en minutos. Válido en España."
      />
      <LegalDocEngine<NdaDoc>
        tipo="nda"
        titulo="Acuerdo de confidencialidad (NDA)"
        toolClass="tool-nda"
        defaultValues={resolvedDefaults}
        buildDoc={(v) => ({ ...v, tipo: 'nda' as const })}
        embedded={embedded}
        onBack={onBack}
        onSave={onSave}
        saving={saving}
        clientes={clientes}
        clienteField="parteB"
        onEmail={onEmailNda}
        estadoDoc={estadoNda}
        autoOpenPreview={autoOpenPreview}
      renderForm={({ register, getValues, errors }) => {
        const reg = register as RegisterFn
        const err = errors as unknown as ErrorsObj
        const metaErr = (err['metadatos'] ?? {}) as Record<string, FieldError | undefined>
        const direction = getValues('direction') as string

        return (
          <>
            {/* Encabezado */}
            <fieldset className="fieldset-v3">
              <legend className="fieldset-legend">Encabezado del NDA</legend>
              <div className="fieldset-v3-body">
                <div className="form-row">
                  <div>
                    <FormField
                      label={onSave ? 'Nº NDA' : 'Nº NDA *'}
                      readOnly={!!onSave}
                      placeholder={onSave ? 'NDA-YYYY-XXX' : 'NDA-2026-001'}
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
                        Se asignará al guardar
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
                <div className="input-group">
                  <label className="input-label">Tipo de acuerdo</label>
                  <select {...reg('direction')} className="select-v3">
                    <option value="unilateral">Unilateral (solo una parte se obliga)</option>
                    <option value="bilateral">Bilateral (ambas partes se obligan)</option>
                  </select>
                </div>
              </div>
            </fieldset>

            {/* Partes */}
            <FormParte
              titulo={direction === 'bilateral' ? 'Parte A' : 'Parte divulgadora (tú)'}
              prefix="parteA"
              register={reg}
              errors={err}
            />
            <FormParte
              titulo={direction === 'bilateral' ? 'Parte B' : 'Parte receptora'}
              prefix="parteB"
              register={reg}
              errors={err}
            />

            {/* Contenido del NDA */}
            <fieldset className="fieldset-v3">
              <legend className="fieldset-legend">Alcance de la confidencialidad</legend>
              <div className="fieldset-v3-body">
                <TextAreaField
                  label="Qué información es confidencial *"
                  placeholder="Ej: toda la información técnica, comercial, financiera y estratégica intercambiada entre las partes..."
                  {...reg('objetoConfidencialidad', { required: 'Obligatorio' })}
                  rows={4}
                />
                <TextAreaField
                  label="Excepciones (opcional)"
                  placeholder="Ej: información ya disponible públicamente, información recibida de terceros..."
                  {...reg('excepciones')}
                  rows={3}
                />
                <div className="form-row">
                  <FormField
                    label="Duración (meses) *"
                    type="number"
                    min={1}
                    {...reg('duracionMeses', { valueAsNumber: true, required: 'Obligatorio', min: { value: 1, message: 'Mínimo 1 mes' } })}
                    error={err['duracionMeses']}
                  />
                  <FormField
                    label="Jurisdicción (ciudad) *"
                    placeholder="Ciudad competente en caso de conflicto"
                    {...reg('jurisdiccion', { required: 'Obligatorio' })}
                    error={err['jurisdiccion']}
                  />
                </div>
                <TextAreaField
                  label="Penalización por incumplimiento (opcional)"
                  placeholder="Describe las consecuencias..."
                  {...reg('penalizacion')}
                  rows={2}
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
