/**
 * ReclamacionPage.tsx
 * Generador de carta de reclamación de pago.
 */
import { LegalDocEngine } from '../../components/legalDoc/LegalDocEngine'
import { FormField, TextAreaField } from '../../components/ui/FormField'
import type { ReclamacionPagoDoc, ParteLegal } from '../../types/legalDoc.types'
import { DEFAULT_PARTE_LEGAL, DEFAULT_METADATOS } from '../../types/legalDoc.types'

// ─── Valores por defecto ─────────────────────────────────────────────────────

const DEFAULT_RECLAMACION: ReclamacionPagoDoc = {
  tipo: 'reclamacion',
  metadatos: { ...DEFAULT_METADATOS, referencia: '' },
  acreedor: { ...DEFAULT_PARTE_LEGAL },
  deudor:   { ...DEFAULT_PARTE_LEGAL },
  referenciaFactura: '',
  fechaFactura: '',
  fechaVencimiento: '',
  importeDeuda: 0,
  tono: 'amistoso',
  plazoRespuesta: 15,
  mencionAccionLegal: false,
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
  prefix: 'acreedor' | 'deudor'
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
      </div>
    </fieldset>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export function ReclamacionPage() {
  return (
    <LegalDocEngine<ReclamacionPagoDoc>
      tipo="reclamacion"
      titulo="Reclamación de pago"
      toolClass="tool-reclamacion"
      defaultValues={DEFAULT_RECLAMACION}
      buildDoc={(v) => ({ ...v, tipo: 'reclamacion' as const })}
      renderForm={({ register, watch, errors }) => {
        const reg = register as RegisterFn
        const err = errors as ErrorsObj
        const metaErr = (err['metadatos'] ?? {}) as Record<string, { message?: string }>
        const tono = watch('tono' as never) as string

        return (
          <>
            {/* Encabezado */}
            <fieldset className="fieldset-v3">
              <legend className="fieldset-legend">Encabezado de la carta</legend>
              <div className="fieldset-v3-body" style={{ marginTop: 'var(--space-4)' }}>
                <div className="form-row">
                  <FormField
                    label="Referencia (opcional)"
                    placeholder="Ej: REC-2026-001"
                    {...reg('metadatos.referencia')}
                  />
                  <FormField
                    label="Fecha de la carta *"
                    type="date"
                    {...reg('metadatos.fecha', { required: 'Obligatorio' })}
                    error={metaErr['fecha'] as never}
                  />
                </div>
                <FormField
                  label="Lugar *"
                  placeholder="Ciudad desde donde envías la carta"
                  {...reg('metadatos.lugar', { required: 'Obligatorio' })}
                  error={metaErr['lugar'] as never}
                />
              </div>
            </fieldset>

            {/* Partes */}
            <FormParte titulo="Acreedor (tú — quien reclama)" prefix="acreedor" register={reg} errors={err} />
            <FormParte titulo="Deudor (quien debe pagar)" prefix="deudor" register={reg} errors={err} />

            {/* Datos de la deuda */}
            <fieldset className="fieldset-v3">
              <legend className="fieldset-legend">Datos de la factura impagada</legend>
              <div className="fieldset-v3-body" style={{ marginTop: 'var(--space-4)' }}>
                <div className="form-row">
                  <FormField
                    label="Nº de factura *"
                    placeholder="FAC-2026-001"
                    {...reg('referenciaFactura', { required: 'Obligatorio' })}
                    error={err['referenciaFactura'] as never}
                  />
                  <FormField
                    label="Importe (€) *"
                    type="number"
                    step="0.01"
                    min={0.01}
                    {...reg('importeDeuda', {
                      valueAsNumber: true,
                      required: 'Obligatorio',
                      min: { value: 0.01, message: 'Debe ser mayor que 0' },
                    })}
                    error={err['importeDeuda'] as never}
                  />
                </div>
                <div className="form-row">
                  <FormField
                    label="Fecha de la factura *"
                    type="date"
                    {...reg('fechaFactura', { required: 'Obligatorio' })}
                    error={err['fechaFactura'] as never}
                  />
                  <FormField
                    label="Fecha de vencimiento *"
                    type="date"
                    {...reg('fechaVencimiento', { required: 'Obligatorio' })}
                    error={err['fechaVencimiento'] as never}
                  />
                </div>
              </div>
            </fieldset>

            {/* Configuración de la carta */}
            <fieldset className="fieldset-v3">
              <legend className="fieldset-legend">Tono y condiciones</legend>
              <div className="fieldset-v3-body" style={{ marginTop: 'var(--space-4)' }}>
                <div className="input-group">
                  <label className="input-label">Tono de la carta</label>
                  <select {...reg('tono')} className="select-v3">
                    <option value="amistoso">🟢 Amistoso — 1ª notificación, tono cordial</option>
                    <option value="formal">🟡 Formal — 2ª notificación, más firme</option>
                    <option value="urgente">🔴 Urgente — aviso previo a acciones legales</option>
                  </select>
                </div>
                <FormField
                  label="Plazo de respuesta (días hábiles) *"
                  type="number"
                  min={1}
                  {...reg('plazoRespuesta', {
                    valueAsNumber: true,
                    required: 'Obligatorio',
                    min: { value: 1, message: 'Mínimo 1 día' },
                  })}
                  error={err['plazoRespuesta'] as never}
                />
                {tono === 'urgente' && (
                  <label className="input-toggle">
                    <input type="checkbox" {...reg('mencionAccionLegal')} />
                    <span>Mencionar explícitamente acciones legales y registro de morosos</span>
                  </label>
                )}
              </div>
            </fieldset>

            {/* Notas */}
            <fieldset className="fieldset-v3">
              <legend className="fieldset-legend">Notas adicionales</legend>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <TextAreaField
                  label="Observaciones"
                  placeholder="Cualquier nota que quieras añadir a la carta..."
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
