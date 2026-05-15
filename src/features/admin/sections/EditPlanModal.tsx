import { useState } from 'react'
import { X, Pencil } from 'lucide-react'
import { adminPatch } from '../hooks/useAdminFetch'
import type { PlanConfig } from '../../../types/plan'

interface Props {
  plan: PlanConfig
  onClose: () => void
  onSaved: () => void
}

type FieldErrors = Partial<Record<
  'nombre' | 'precio_mensual' | 'descuento_mensual_pct' | 'descuento_anual_pct' | 'dias_prueba' | 'descripcion' | 'features',
  string
>>

function validate(values: {
  nombre: string
  precio_mensual: number
  descuento_mensual_pct: number
  descuento_anual_pct: number
  dias_prueba: number
  descripcion: string | null
  features: string[]
}): FieldErrors {
  const errors: FieldErrors = {}
  if (!values.nombre.trim() || values.nombre.length > 60) {
    errors.nombre = 'Entre 1 y 60 caracteres'
  }
  if (!Number.isFinite(values.precio_mensual) || values.precio_mensual < 0) {
    errors.precio_mensual = 'Debe ser un número ≥ 0'
  }
  if (values.descuento_mensual_pct < 0 || values.descuento_mensual_pct > 100) {
    errors.descuento_mensual_pct = 'Entre 0 y 100'
  }
  if (values.descuento_anual_pct < 0 || values.descuento_anual_pct > 100) {
    errors.descuento_anual_pct = 'Entre 0 y 100'
  }
  if (!Number.isInteger(values.dias_prueba) || values.dias_prueba < 0) {
    errors.dias_prueba = 'Entero ≥ 0'
  }
  if (values.descripcion != null && values.descripcion.length > 280) {
    errors.descripcion = 'Máximo 280 caracteres'
  }
  if (values.features.length > 12) {
    errors.features = 'Máximo 12 features'
  } else if (values.features.some((f) => f.length > 120)) {
    errors.features = 'Cada feature admite hasta 120 caracteres'
  }
  return errors
}

export function EditPlanModal({ plan, onClose, onSaved }: Props) {
  const [nombre, setNombre] = useState(plan.nombre)
  const [precioMensual, setPrecioMensual] = useState(plan.precio_mensual)
  const [dtoMensual, setDtoMensual] = useState(plan.descuento_mensual_pct)
  const [dtoAnual, setDtoAnual] = useState(plan.descuento_anual_pct)
  const [diasPrueba, setDiasPrueba] = useState(plan.dias_prueba)
  const [descripcion, setDescripcion] = useState(plan.descripcion ?? '')
  const [featuresText, setFeaturesText] = useState((plan.features ?? []).join('\n'))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const features = featuresText
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  const values = {
    nombre,
    precio_mensual: precioMensual,
    descuento_mensual_pct: dtoMensual,
    descuento_anual_pct: dtoAnual,
    dias_prueba: diasPrueba,
    descripcion: descripcion.trim() === '' ? null : descripcion,
    features,
  }

  const errors = validate(values)
  const hasErrors = Object.keys(errors).length > 0

  const originalFeatures = plan.features ?? []
  const featuresChanged =
    features.length !== originalFeatures.length ||
    features.some((f, i) => f !== originalFeatures[i])

  const isDirty =
    nombre !== plan.nombre ||
    precioMensual !== plan.precio_mensual ||
    dtoMensual !== plan.descuento_mensual_pct ||
    dtoAnual !== plan.descuento_anual_pct ||
    diasPrueba !== plan.dias_prueba ||
    (descripcion || null) !== (plan.descripcion || null) ||
    featuresChanged

  const precioAnualBase = precioMensual * 12
  const precioAnualFinal = dtoAnual > 0 ? precioAnualBase * (1 - dtoAnual / 100) : precioAnualBase

  const handleSave = async () => {
    if (hasErrors || !isDirty) return
    setSaving(true)
    setSaveError(null)

    const res = await adminPatch('/functions/v1/admin-planes', {
      id: plan.id,
      ...values,
    })

    setSaving(false)

    if (!res.ok) {
      setSaveError(res.error ?? 'Error al guardar')
      return
    }
    onSaved()
  }

  return (
    <div className="overlay overlay-dark overlay-z200">
      <div className="admin-modal-box admin-modal-md">
        <div className="admin-modal-header">
          <Pencil size={18} className="admin-modal-header-icon admin-modal-header-icon--primary" />
          <h2 className="admin-modal-title">Editar plan {plan.nombre}</h2>
          <button onClick={onClose} className="modal-close-btn" aria-label="Cerrar" disabled={saving}>
            <X size={16} />
          </button>
        </div>

        <div className="admin-modal-body">
          <div className="input-group">
            <label className="input-label" htmlFor="edit-plan-nombre">Nombre</label>
            <input
              id="edit-plan-nombre"
              type="text"
              className={`input-v3${errors.nombre ? ' is-error' : ''}`}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={saving}
              maxLength={60}
            />
            {errors.nombre && <span className="input-error-msg">{errors.nombre}</span>}
          </div>

          <div className="edit-plan-grid">
            <div className="input-group">
              <label className="input-label" htmlFor="edit-plan-precio">Precio / mes (€)</label>
              <input
                id="edit-plan-precio"
                type="number"
                step="0.01"
                min="0"
                className={`input-v3${errors.precio_mensual ? ' is-error' : ''}`}
                value={precioMensual}
                onChange={(e) => setPrecioMensual(parseFloat(e.target.value) || 0)}
                disabled={saving}
              />
              {errors.precio_mensual && <span className="input-error-msg">{errors.precio_mensual}</span>}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="edit-plan-dias">Días de prueba</label>
              <input
                id="edit-plan-dias"
                type="number"
                min="0"
                step="1"
                className={`input-v3${errors.dias_prueba ? ' is-error' : ''}`}
                value={diasPrueba}
                onChange={(e) => setDiasPrueba(parseInt(e.target.value) || 0)}
                disabled={saving}
              />
              {errors.dias_prueba && <span className="input-error-msg">{errors.dias_prueba}</span>}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="edit-plan-dto-mes">Descuento mensual (%)</label>
              <input
                id="edit-plan-dto-mes"
                type="number"
                min="0"
                max="100"
                step="1"
                className={`input-v3${errors.descuento_mensual_pct ? ' is-error' : ''}`}
                value={dtoMensual}
                onChange={(e) => setDtoMensual(parseInt(e.target.value) || 0)}
                disabled={saving}
              />
              {errors.descuento_mensual_pct && <span className="input-error-msg">{errors.descuento_mensual_pct}</span>}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="edit-plan-dto-anual">Descuento anual (%)</label>
              <input
                id="edit-plan-dto-anual"
                type="number"
                min="0"
                max="100"
                step="1"
                className={`input-v3${errors.descuento_anual_pct ? ' is-error' : ''}`}
                value={dtoAnual}
                onChange={(e) => setDtoAnual(parseInt(e.target.value) || 0)}
                disabled={saving}
              />
              {errors.descuento_anual_pct && <span className="input-error-msg">{errors.descuento_anual_pct}</span>}
            </div>
          </div>

          <div className="edit-plan-anual-calc">
            <span className="edit-plan-anual-label">Precio anual calculado</span>
            <span className="edit-plan-anual-value">
              {precioAnualFinal.toFixed(2).replace('.', ',')} €
              {dtoAnual > 0 && (
                <span className="edit-plan-anual-base"> ({precioAnualBase.toFixed(2).replace('.', ',')} € -{dtoAnual}%)</span>
              )}
            </span>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="edit-plan-desc">
              Descripción <span className="input-label-optional">(opcional)</span>
            </label>
            <textarea
              id="edit-plan-desc"
              className={`input-v3 edit-plan-textarea${errors.descripcion ? ' is-error' : ''}`}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={saving}
              maxLength={280}
              rows={3}
            />
            {errors.descripcion && <span className="input-error-msg">{errors.descripcion}</span>}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="edit-plan-features">
              Ventajas del plan
              <span className="input-label-optional"> (una por línea — máx. 12)</span>
            </label>
            <textarea
              id="edit-plan-features"
              className={`input-v3 edit-plan-textarea${errors.features ? ' is-error' : ''}`}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              disabled={saving}
              rows={6}
              placeholder={'Acceso a todas las herramientas\nSin límite de documentos\nSoporte prioritario'}
            />
            <span className="input-hint">{features.length} / 12 elementos</span>
            {errors.features && <span className="input-error-msg">{errors.features}</span>}
          </div>

          {saveError && (
            <div className="error-box">
              <span>{saveError}</span>
            </div>
          )}
        </div>

        <div className="admin-modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { void handleSave() }}
            disabled={saving || hasErrors || !isDirty}
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
