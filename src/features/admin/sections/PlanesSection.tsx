import { useState } from 'react'
import { useAdminFetch, adminPatch } from '../hooks/useAdminFetch'
import { Tag, Crown, Loader2, Save, AlertTriangle } from 'lucide-react'
import { ConfirmModal } from '../components/ConfirmModal'
import type { PlanConfig } from '../../../types/plan'

interface ApiPayload { planes: PlanConfig[] }

export function PlanesSection() {
  const { data: planes, loading, error, refetch } = useAdminFetch<PlanConfig[]>(
    '/functions/v1/admin-planes',
    { transform: (raw) => (raw as ApiPayload).planes ?? [] },
  )

  const [edits, setEdits] = useState<Record<string, Partial<PlanConfig>>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saveError, setSaveError] = useState<Record<string, string>>({})
  const [confirmTarget, setConfirmTarget] = useState<{ planId: string; value: boolean } | null>(null)

  const cancelEdit = (planId: string) => {
    setEdits((prev) => {
      const next = { ...prev }
      delete next[planId]
      return next
    })
    setSaveError((prev) => {
      const next = { ...prev }
      delete next[planId]
      return next
    })
  }

  const updateField = (planId: string, field: keyof PlanConfig, value: string | number | boolean | null) => {
    setEdits((prev) => ({
      ...prev,
      [planId]: { ...prev[planId], [field]: value },
    }))
  }

  const handleSave = async (planId: string) => {
    const patch = edits[planId]
    if (!patch) return

    setSaving((prev) => ({ ...prev, [planId]: true }))
    setSaveError((prev) => { const n = { ...prev }; delete n[planId]; return n })

    const res = await adminPatch('/functions/v1/admin-planes', { id: planId, ...patch })
    setSaving((prev) => ({ ...prev, [planId]: false }))

    if (!res.ok) {
      setSaveError((prev) => ({ ...prev, [planId]: res.error ?? 'Error al guardar' }))
      return
    }
    cancelEdit(planId)
    await refetch()
  }

  const getEdit = (planId: string, plan: PlanConfig): PlanConfig => {
    return (edits[planId] as PlanConfig) ?? plan
  }

  const handleConfirmToggle = async () => {
    if (!confirmTarget) return
    setSaving((prev) => ({ ...prev, [confirmTarget.planId]: true }))
    const res = await adminPatch('/functions/v1/admin-planes', {
      id: confirmTarget.planId,
      activo: confirmTarget.value,
    })
    setSaving((prev) => ({ ...prev, [confirmTarget.planId]: false }))
    setConfirmTarget(null)
    if (res.ok) {
      await refetch()
    } else {
      setSaveError((prev) => ({ ...prev, [confirmTarget.planId]: res.error ?? 'Error al guardar' }))
    }
  }

  if (loading) {
    return (
      <div className="section-stack">
        <div>
          <h1 className="section-title">Planes</h1>
          <p className="section-sub">Cargando configuración de planes…</p>
        </div>
        <div className="empty-state">
          <Loader2 size={20} className="spin empty-state-icon text-primary" />
          <p className="empty-state-text">Obteniendo planes…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="section-stack">
        <div>
          <h1 className="section-title">Planes</h1>
          <p className="section-sub">No se pudo cargar la configuración de planes</p>
        </div>
        <div className="error-box">
          <span>{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="section-stack">
      <div>
        <h1 className="section-title">Planes</h1>
        <p className="section-sub">Configura precios, descuentos y días de prueba del plan Premium. Los cambios se reflejan en el modal de upgrade del usuario.</p>
      </div>

      <div className="card card-no-pad">
        <table className="data-table">
          <thead>
            <tr className="data-thead-row">
              <th className="data-th">Plan</th>
              <th className="data-th-right">Precio / mes</th>
              <th className="data-th-right">Dto. mes</th>
              <th className="data-th-right">Precio / año</th>
              <th className="data-th-right">Dto. año</th>
              <th className="data-th-right">Días prueba</th>
              <th className="data-th">Activo</th>
              <th className="data-th-right"></th>
            </tr>
          </thead>
          <tbody>
            {(planes ?? []).map((plan) => {
              const edit = getEdit(plan.id, plan)
              const isDirty = !!edits[plan.id]
              const isFree = plan.id === 'free'
              const busy = saving[plan.id]
              const err = saveError[plan.id]
              const precioAnualCalc = edit.precio_mensual * 12
              const precioAnualFinal = edit.descuento_anual_pct > 0
                ? precioAnualCalc * (1 - edit.descuento_anual_pct / 100)
                : precioAnualCalc

              return (
                <tr key={plan.id} className={`data-tr${isFree ? ' data-tr--muted' : ''}`}>
                  <td className="data-td data-td--bold">
                    <span className="flex items-center gap-2">
                      {plan.id === 'premium'
                        ? <Crown size={14} className="text-gold" />
                        : <Tag size={14} className="text-muted" />
                      }
                      {edit.nombre}
                      {isFree && <span className="badge badge-muted badge-xs">Estatus</span>}
                    </span>
                  </td>
                  {isFree ? (
                    <>
                      <td className="data-td-right" style={{ color: 'var(--color-text-faint)' }}>Gratuito</td>
                      <td className="data-td-right" style={{ color: 'var(--color-text-faint)' }}>—</td>
                      <td className="data-td-right" style={{ color: 'var(--color-text-faint)' }}>—</td>
                      <td className="data-td-right" style={{ color: 'var(--color-text-faint)' }}>—</td>
                      <td className="data-td-right" style={{ color: 'var(--color-text-faint)' }}>—</td>
                      <td className="data-td" style={{ color: 'var(--color-text-faint)' }}>Siempre</td>
                      <td className="data-td-right"></td>
                    </>
                  ) : (
                    <>
                      <td className="data-td-right">
                        <div className="editable-cell">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="input-v3 input-v3--cell"
                            value={edit.precio_mensual}
                            onChange={(e) => updateField(plan.id, 'precio_mensual', parseFloat(e.target.value) || 0)}
                            disabled={busy}
                          />
                          <span>€</span>
                        </div>
                      </td>
                      <td className="data-td-right">
                        <div className="editable-cell">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="input-v3 input-v3--cell"
                            value={edit.descuento_mensual_pct}
                            onChange={(e) => updateField(plan.id, 'descuento_mensual_pct', parseInt(e.target.value) || 0)}
                            disabled={busy}
                          />
                          <span>%</span>
                        </div>
                      </td>
                      <td className="data-td-right" style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>
                        {precioAnualFinal.toFixed(2).replace('.', ',')} €
                      </td>
                      <td className="data-td-right">
                        <div className="editable-cell">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="input-v3 input-v3--cell"
                            value={edit.descuento_anual_pct}
                            onChange={(e) => updateField(plan.id, 'descuento_anual_pct', parseInt(e.target.value) || 0)}
                            disabled={busy}
                          />
                          <span>%</span>
                        </div>
                      </td>
                      <td className="data-td-right">
                        <input
                          type="number"
                          min="0"
                          className="input-v3 input-v3--cell"
                          style={{ width: 72 }}
                          value={edit.dias_prueba}
                          onChange={(e) => updateField(plan.id, 'dias_prueba', parseInt(e.target.value) || 0)}
                          disabled={busy}
                        />
                      </td>
                      <td className="data-td">
                        <button
                          type="button"
                          onClick={() => setConfirmTarget({ planId: plan.id, value: !edit.activo })}
                          className={`toggle-btn ${edit.activo ? 'toggle-btn--active' : 'toggle-btn--inactive'}`}
                          disabled={busy}
                        >
                          {edit.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="data-td-right">
                        <div className="flex items-center gap-1 justify-end">
                          {err && (
                            <span title={err} className="flex items-center shrink-0">
                              <AlertTriangle size={14} className="text-error" />
                            </span>
                          )}
                          {isDirty ? (
                            <>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => cancelEdit(plan.id)}
                                disabled={busy}
                              >
                                Cancelar
                              </button>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => { void handleSave(plan.id) }}
                                disabled={busy}
                              >
                                <Save size={12} />
                                {busy ? 'Guardando…' : 'Guardar'}
                              </button>
                            </>
                          ) : (
                            <span className="save-indicator" />
                          )}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {confirmTarget && (
        <ConfirmModal
          title={confirmTarget.value ? 'Activar plan' : 'Desactivar plan'}
          description={confirmTarget.value
            ? '¿Seguro que quieres activar este plan? Los usuarios podrán verlo y suscribirse.'
            : '¿Seguro que quieres desactivar este plan? Los usuarios actuales mantendrán su suscripción pero no podrán renovarla.'}
          confirmLabel={confirmTarget.value ? 'Activar' : 'Desactivar'}
          confirmVariant={confirmTarget.value ? 'success' : 'danger'}
          onConfirm={() => { void handleConfirmToggle() }}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  )
}
