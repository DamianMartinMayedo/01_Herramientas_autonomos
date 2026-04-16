/**
 * NdaPage.tsx
 * Generador de acuerdo de confidencialidad (NDA).
 */
import { LegalDocEngine } from '../../components/legalDoc/LegalDocEngine'
import { FormField, TextAreaField } from '../../components/ui/FormField'
import type { NdaDoc, ParteLegal } from '../../types/legalDoc.types'
import { DEFAULT_PARTE_LEGAL, DEFAULT_METADATOS } from '../../types/legalDoc.types'

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

// ─── Sub-formulario de parte ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RegisterFn = (name: any, opts?: any) => any
type ErrorsObj = Record<string, { message?: string } | undefined>

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
  const e = (errors[prefix] ?? {}) as Partial<Record<keyof ParteLegal, { message?: string }>>
  return (
    <fieldset className="fieldset-v3">
      <legend className="fieldset-legend">{titulo}</legend>
      <div className="fieldset-v3-body" style={{ marginTop: 'var(--space-4)' }}>
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
          <FormField label="Email" type="email" {...register(`${prefix}.email`)} />
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
          <FormField label="Representante" {...register(`${prefix}.representante`)} />
          <FormField label="Cargo" {...register(`${prefix}.cargo`)} />
        </div>
      </div>
    </fieldset>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export function NdaPage() {
  return (
    <LegalDocEngine<NdaDoc>
      tipo="nda"
      titulo="Acuerdo de confidencialidad (NDA)"
      toolClass="tool-nda"
      defaultValues={DEFAULT_NDA}
      buildDoc={(v) => ({ ...v, tipo: 'nda' as const })}
      renderForm={({ register, watch, errors }) => {
        const reg = register as RegisterFn
        const err = errors as ErrorsObj
        const metaErr = (err['metadatos'] ?? {}) as Record<string, { message?: string }>
        const direction = watch('direction' as never) as string

        return (
          <>
            {/* Encabezado */}
            <fieldset className="fieldset-v3">
              <legend className="fieldset-legend">Encabezado del NDA</legend>
              <div className="fieldset-v3-body" style={{ marginTop: 'var(--space-4)' }}>
                <div className="form-row">
                  <FormField
                    label="Referencia *"
                    {...reg('metadatos.referencia', { required: 'Obligatorio' })}
                    error={metaErr['referencia'] as never}
                  />
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
              <div className="fieldset-v3-body" style={{ marginTop: 'var(--space-4)' }}>
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
                    error={err['duracionMeses'] as never}
                  />
                  <FormField
                    label="Jurisdicción (ciudad)"
                    placeholder="Ciudad competente en caso de conflicto"
                    {...reg('jurisdiccion')}
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
              <div style={{ marginTop: 'var(--space-4)' }}>
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
