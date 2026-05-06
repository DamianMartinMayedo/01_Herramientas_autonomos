/**
 * ReclamacionPage.tsx
 * Generador de carta de reclamación de pago.
 */
import { useEffect, useState } from 'react'
import type { FieldError, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { LegalDocEngine } from '../../components/legalDoc/LegalDocEngine'
import { FormField, TextAreaField } from '../../components/ui/FormField'
import type { ReclamacionPagoDoc, ParteLegal } from '../../types/legalDoc.types'
import { DEFAULT_PARTE_LEGAL, DEFAULT_METADATOS } from '../../types/legalDoc.types'
import type { RegularClient } from '../../types/regularClient.types'
import type { Empresa } from '../../types/empresa.types'
import { Seo } from '../../components/seo/Seo'
import { getFacturasEmitidas } from '../../lib/userDocuments'
import type { DocRow } from '../../types/docRow.types'

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

function buildDefaultValues(empresa: Empresa | null | undefined, existing?: ReclamacionPagoDoc): ReclamacionPagoDoc {
  if (existing) return existing
  const base = { ...DEFAULT_RECLAMACION }
  if (empresa) {
    base.acreedor = {
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
    base.metadatos.lugar = empresa.ciudad
  }
  return base
}

// ─── Sub-formulario de parte ─────────────────────────────────────────────────
type RegisterFn = (name: string, opts?: Record<string, unknown>) => Record<string, unknown>
type ErrorsObj = Record<string, FieldError | undefined>

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
      </div>
    </fieldset>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

interface ReclamacionPageProps {
  embedded?: boolean
  onBack?: () => void
  defaultValues?: ReclamacionPagoDoc
  onSave?: (documento: ReclamacionPagoDoc) => Promise<void>
  saving?: boolean
  clientes?: RegularClient[]
  empresa?: Empresa | null
  onEmailReclamacion?: (documento: ReclamacionPagoDoc) => void
  estadoReclamacion?: string
  autoOpenPreview?: boolean
  userId?: string
}

export function ReclamacionPage({
  embedded = false,
  onBack,
  defaultValues,
  onSave,
  saving = false,
  clientes = [],
  empresa,
  onEmailReclamacion,
  estadoReclamacion,
  autoOpenPreview,
  userId,
}: ReclamacionPageProps) {
  const resolvedDefaults = buildDefaultValues(empresa, defaultValues)

  if (!onSave && !resolvedDefaults.metadatos?.referencia) {
    resolvedDefaults.metadatos.referencia = `REC-${new Date().getFullYear()}-001`
  }

  return (
    <>
      <Seo
        title="Carta de reclamación de pago"
        description="Genera cartas de reclamación de pago profesionales para cobrar facturas vencidas. Válido en España."
      />
      <LegalDocEngine<ReclamacionPagoDoc>
        tipo="reclamacion"
        titulo="Reclamación de pago"
        toolClass="tool-reclamacion"
        defaultValues={resolvedDefaults}
        buildDoc={(v) => ({ ...v, tipo: 'reclamacion' as const })}
        embedded={embedded}
        onBack={onBack}
        onSave={onSave}
        saving={saving}
        clientes={clientes}
        clienteField="deudor"
        onEmail={onEmailReclamacion}
        estadoDoc={estadoReclamacion}
        autoOpenPreview={autoOpenPreview}
      renderForm={({ register, getValues, errors, watch, setValue }) => {
        const reg = register as RegisterFn
        const err = errors as unknown as ErrorsObj
        const metaErr = (err['metadatos'] ?? {}) as Record<string, FieldError | undefined>
        const tono = getValues('tono') as string
        const w = watch as UseFormWatch<ReclamacionPagoDoc>
        const sv = setValue as UseFormSetValue<ReclamacionPagoDoc>

        return (
          <ReclamacionFormFields
            reg={reg}
            err={err}
            metaErr={metaErr}
            tono={tono}
            onSave={onSave}
            defaultValues={defaultValues}
            userId={userId}
            watch={w}
            setValue={sv}
          />
        )
      }}
    />
    </>
  )
}

// ─── Campos del formulario ───────────────────────────────────────────────────

function ReclamacionFormFields({
  reg,
  err,
  metaErr,
  tono,
  onSave,
  defaultValues,
  userId,
  watch,
  setValue,
}: {
  reg: RegisterFn
  err: ErrorsObj
  metaErr: Record<string, FieldError | undefined>
  tono: string
  onSave: ReclamacionPageProps['onSave']
  defaultValues: ReclamacionPageProps['defaultValues']
  userId: ReclamacionPageProps['userId']
  watch: UseFormWatch<ReclamacionPagoDoc>
  setValue: UseFormSetValue<ReclamacionPagoDoc>
}) {
  const [facturasOptions, setFacturasOptions] = useState<DocRow[]>([])
  const [selectedFacturaId, setSelectedFacturaId] = useState('')
  const facturaDeudorNombre = watch('deudor.nombre')
  const facturaDeudorEmail = watch('deudor.email')
  const tonoValue = watch('tono')

  useEffect(() => {
    if (tonoValue === 'urgente') {
      setValue('mencionAccionLegal', true)
    }
  }, [tonoValue, setValue])

  useEffect(() => {
    if (!userId) {
      setFacturasOptions([])
      return
    }
    const timer = setTimeout(async () => {
      const { data } = await getFacturasEmitidas(
        userId,
        facturaDeudorNombre || undefined,
        facturaDeudorEmail || undefined,
      )
      setFacturasOptions(data ?? [])
    }, 300)
    return () => clearTimeout(timer)
  }, [userId, facturaDeudorNombre, facturaDeudorEmail])

  const handleFacturaSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const facturaId = e.target.value
    setSelectedFacturaId(facturaId)
    if (!facturaId) return
    const selected = facturasOptions.find((f) => f.id === facturaId)
    if (!selected) return
    const datosJson = selected.datos_json as Record<string, unknown> | undefined
    setValue('referenciaFactura', (selected.numero as string) ?? '')
    setValue('fechaFactura', (selected.fecha as string) ?? '')
    setValue('fechaVencimiento', (datosJson?.fechaVencimiento as string) ?? '')
    setValue('importeDeuda', Number(selected.total) || 0)
  }

  return (
    <>
      {/* Encabezado */}
      <fieldset className="fieldset-v3">
        <legend className="fieldset-legend">Encabezado de la carta</legend>
        <div className="fieldset-v3-body">
          <div className="form-row">
            <div>
              <FormField
                label={onSave ? 'Nº reclamación' : 'Nº reclamación *'}
                readOnly={!!onSave}
                placeholder={onSave ? 'REC-YYYY-XXX' : 'REC-2026-001'}
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
              label="Fecha de la carta *"
              type="date"
              {...reg('metadatos.fecha', { required: 'Obligatorio' })}
              error={metaErr['fecha']}
            />
          </div>
          <FormField
            label="Lugar *"
            placeholder="Ciudad desde donde envías la carta"
            {...reg('metadatos.lugar', { required: 'Obligatorio' })}
            error={metaErr['lugar']}
          />
        </div>
      </fieldset>

      {/* Partes */}
      <FormParte titulo="Acreedor (tú — quien reclama)" prefix="acreedor" register={reg} errors={err} />
      <FormParte titulo="Deudor (quien debe pagar)" prefix="deudor" register={reg} errors={err} />

      {/* Datos de la deuda */}
      <fieldset className="fieldset-v3">
        <legend className="fieldset-legend">Datos de la factura impagada</legend>
        <div className="fieldset-v3-body">
          <div className="form-row">
            {onSave && userId ? (
              <div className="input-group">
                <label className="input-label">Nº de factura *</label>
                <select
                  className="select-v3"
                  value={selectedFacturaId}
                  onChange={handleFacturaSelect}
                >
                  <option value="">
                    {facturasOptions.length === 0
                      ? 'Cargando facturas…'
                      : 'Selecciona una factura emitida'}
                  </option>
                  {facturasOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.numero as string ?? '—'} — {f.cliente_nombre as string ?? '—'} — {Number(f.total).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <FormField
                label="Nº de factura *"
                placeholder="FAC-2026-001"
                {...reg('referenciaFactura', { required: 'Obligatorio' })}
                error={err['referenciaFactura']}
              />
            )}
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
              error={err['importeDeuda']}
            />
          </div>
          <div className="form-row">
            <FormField
              label="Fecha de la factura *"
              type="date"
              {...reg('fechaFactura', { required: 'Obligatorio' })}
              error={err['fechaFactura']}
            />
            <FormField
              label="Fecha de vencimiento"
              type="date"
              {...reg('fechaVencimiento')}
              error={err['fechaVencimiento']}
            />
          </div>
        </div>
      </fieldset>

      {/* Configuración de la carta */}
      <fieldset className="fieldset-v3">
        <legend className="fieldset-legend">Tono y condiciones</legend>
        <div className="fieldset-v3-body">
          <div className="input-group">
            <label className="input-label">Tono de la carta</label>
            <select {...reg('tono')} className="select-v3">
              <option value="amistoso">Amistoso — 1ª notificación, tono cordial</option>
              <option value="formal">Formal — 2ª notificación, más firme</option>
              <option value="urgente">Urgente — aviso previo a acciones legales</option>
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
            error={err['plazoRespuesta']}
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
        <div>
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
}
