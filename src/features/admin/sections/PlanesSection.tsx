import { useState } from 'react'
import { useAdminFetch, adminPatch } from '../hooks/useAdminFetch'
import { Tag, Crown, Loader2, Pencil } from 'lucide-react'
import { ConfirmModal } from '../components/ConfirmModal'
import { EditPlanModal } from './EditPlanModal'
import type { PlanConfig } from '../../../types/plan'

interface ApiPayload { planes: PlanConfig[] }

export function PlanesSection() {
  const { data: planes, loading, error, refetch } = useAdminFetch<PlanConfig[]>(
    '/functions/v1/admin-planes',
    { transform: (raw) => (raw as ApiPayload).planes ?? [] },
  )

  const [confirmTarget, setConfirmTarget] = useState<{ planId: string; value: boolean } | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<PlanConfig | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)

  const handleConfirmToggle = async () => {
    if (!confirmTarget) return
    setTogglingId(confirmTarget.planId)
    setToggleError(null)
    const res = await adminPatch('/functions/v1/admin-planes', {
      id: confirmTarget.planId,
      activo: confirmTarget.value,
    })
    setTogglingId(null)
    setConfirmTarget(null)
    if (res.ok) {
      await refetch()
    } else {
      setToggleError(res.error ?? 'Error al cambiar el estado del plan')
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

      {toggleError && (
        <div className="error-box">
          <span>{toggleError}</span>
        </div>
      )}

      <div className="card card-no-pad">
        <table className="data-table data-table--responsive">
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
              const isFree = plan.id === 'free'
              const busy = togglingId === plan.id
              const precioAnualBase = plan.precio_mensual * 12
              const precioAnualFinal = plan.descuento_anual_pct > 0
                ? precioAnualBase * (1 - plan.descuento_anual_pct / 100)
                : precioAnualBase

              return (
                <tr key={plan.id} className={`data-tr${isFree ? ' data-tr--muted' : ''}`}>
                  <td className="data-td data-td--bold">
                    <span className="flex items-center gap-2">
                      {plan.id === 'premium'
                        ? <Crown size={14} className="text-gold" />
                        : <Tag size={14} className="text-muted" />
                      }
                      {plan.nombre}
                      {isFree && <span className="badge badge-muted badge-xs">Estatus</span>}
                    </span>
                  </td>
                  {isFree ? (
                    <>
                      <td className="data-td-right data-td--faint">Gratuito</td>
                      <td className="data-td-right data-td--faint">—</td>
                      <td className="data-td-right data-td--faint">—</td>
                      <td className="data-td-right data-td--faint">—</td>
                      <td className="data-td-right data-td--faint">—</td>
                      <td className="data-td data-td--faint">Siempre</td>
                      <td className="data-td-right"></td>
                    </>
                  ) : (
                    <>
                      <td className="data-td-right">
                        {plan.precio_mensual.toFixed(2).replace('.', ',')} €
                      </td>
                      <td className="data-td-right">
                        {plan.descuento_mensual_pct > 0 ? `${plan.descuento_mensual_pct}%` : '—'}
                      </td>
                      <td className="data-td-right data-td--computed">
                        {precioAnualFinal.toFixed(2).replace('.', ',')} €
                      </td>
                      <td className="data-td-right">
                        {plan.descuento_anual_pct > 0 ? `${plan.descuento_anual_pct}%` : '—'}
                      </td>
                      <td className="data-td-right">
                        {plan.dias_prueba}
                      </td>
                      <td className="data-td">
                        <label className={`plan-switch${plan.activo ? ' is-on' : ''}${busy ? ' is-busy' : ''}`}>
                          <input
                            type="checkbox"
                            role="switch"
                            checked={plan.activo}
                            disabled={busy}
                            onChange={() => setConfirmTarget({ planId: plan.id, value: !plan.activo })}
                            aria-label={plan.activo ? 'Desactivar plan' : 'Activar plan'}
                          />
                          <span className="plan-switch-track" aria-hidden="true">
                            <span className="plan-switch-thumb" />
                          </span>
                          <span className="plan-switch-text">{plan.activo ? 'Activo' : 'Inactivo'}</span>
                        </label>
                      </td>
                      <td className="data-td-right">
                        <button
                          type="button"
                          className="icon-btn icon-btn--primary"
                          onClick={() => setEditTarget(plan)}
                          aria-label={`Editar plan ${plan.nombre}`}
                          title="Editar"
                          disabled={busy}
                        >
                          <Pencil size={14} />
                        </button>
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

      {editTarget && (
        <EditPlanModal
          plan={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null)
            void refetch()
          }}
        />
      )}
    </div>
  )
}
