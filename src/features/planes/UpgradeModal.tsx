import { useState, useEffect } from 'react'
import { X, Crown, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { usePlanes } from '../../hooks/usePlanes'
import { useProfile } from '../../hooks/useProfile'
import { supabase } from '../../lib/supabaseClient'
import type { PlanConfig } from '../../types/plan'

interface Props {
  open: boolean
  onClose: () => void
}

type Step = 'confirm' | 'loading' | 'success' | 'error'
type Billing = 'mensual' | 'anual'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

export function UpgradeModal({ open, onClose }: Props) {
  const { planes, loading: planesLoading, refetch: refetchPlanes } = usePlanes()
  const { refetch: refetchProfile } = useProfile()
  const [step, setStep] = useState<Step>('confirm')
  const [error, setError] = useState<string | null>(null)
  const [billing, setBilling] = useState<Billing>('mensual')

  useEffect(() => {
    if (open) {
      void refetchPlanes()
      setStep('confirm')
      setError(null)
      setBilling('mensual')
    }
  }, [open, refetchPlanes])

  const premiumPlan: PlanConfig | undefined = planes.find((p) => p.id === 'premium' && p.activo)

  const computedMensual = premiumPlan
    ? premiumPlan.precio_mensual * (1 - premiumPlan.descuento_mensual_pct / 100)
    : 0

  const precioAnualBase = premiumPlan ? premiumPlan.precio_mensual * 12 : 0
  const precioAnualFinal = premiumPlan && premiumPlan.descuento_anual_pct > 0
    ? precioAnualBase * (1 - premiumPlan.descuento_anual_pct / 100)
    : precioAnualBase
  const hasAnnualPricing = precioAnualBase > 0

  const selectedPrice = billing === 'anual' ? precioAnualFinal : computedMensual
  const selectedPeriod = billing === 'anual' ? '/ año' : '/ mes'
  const selectedOriginalPrice = billing === 'anual' ? precioAnualBase : premiumPlan?.precio_mensual
  const selectedDiscount = billing === 'anual'
    ? (premiumPlan?.descuento_anual_pct ?? 0)
    : (premiumPlan?.descuento_mensual_pct ?? 0)

  const handleUpgrade = async () => {
    setStep('loading')
    setError(null)

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token

    if (!token) {
      setStep('error')
      setError('No se pudo obtener la sesión. Vuelve a iniciar sesión.')
      return
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/user-upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      const json = await res.json() as { error?: string; plan?: string }

      if (!res.ok || json.error) {
        setStep('error')
        setError(json.error ?? 'Error al actualizar el plan')
        return
      }

      await refetchProfile()
      window.dispatchEvent(new CustomEvent('ha:plan-changed', { detail: { plan: 'premium' } }))
      onClose()
    } catch (err) {
      setStep('error')
      setError(err instanceof Error ? err.message : 'Error inesperado')
    }
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step !== 'loading') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, step])

  if (!open) return null

  return (
    <div
      className="auth-modal-overlay"
      role="dialog"
      aria-modal="true"
    >
      <div className={`auth-modal${step === 'confirm' && !planesLoading && !premiumPlan ? ' upgrade-modal--narrow' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          disabled={step === 'loading'}
          className="auth-modal__close"
          aria-label="Cerrar"
          style={{ display: step === 'loading' ? 'none' : undefined }}
        >
          <X size={18} />
        </button>

        {step === 'confirm' && (
          <>
            {planesLoading ? (
              <div className="empty-state">
                <Loader2 size={20} className="spin empty-state-icon text-primary" />
                <p className="empty-state-text">Cargando planes…</p>
              </div>
            ) : !premiumPlan ? (
              <div className="upgrade-unavailable">
                <Crown size={28} className="upgrade-unavailable-icon" />
                <p className="upgrade-unavailable-title">El plan Premium no está disponible en este momento</p>
                <p className="upgrade-unavailable-desc">Estamos preparando mejoras para ofrecerte la mejor experiencia. Vuelve a intentarlo más tarde.</p>
                <button className="btn btn-primary upgrade-btn-full" onClick={onClose}>
                  Entendido
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="upgrade-icon-box">
                    <Crown size={28} />
                  </div>
                  <p className="upgrade-plan-label">Plan {premiumPlan.nombre}</p>

                  {hasAnnualPricing && (
                    <div className="upgrade-billing-switch">
                      <button
                        type="button"
                        onClick={() => setBilling('mensual')}
                        className={`upgrade-switch-pill${billing === 'mensual' ? ' active' : ''}`}
                      >
                        Mensual
                      </button>
                      <button
                        type="button"
                        onClick={() => setBilling('anual')}
                        className={`upgrade-switch-pill${billing === 'anual' ? ' active' : ''}`}
                      >
                        Anual
                      </button>
                      <div
                        className="upgrade-switch-indicator"
                        style={{
                          transform: billing === 'anual' ? 'translateX(calc(100% + 8px))' : 'translateX(0)',
                        }}
                      />
                    </div>
                  )}

                  <div className="upgrade-price-row">
                    <span className="upgrade-price-value">
                      {selectedPrice != null ? `${selectedPrice.toFixed(2).replace('.', ',')} €` : '—'}
                    </span>
                    <span className="upgrade-price-period">{selectedPeriod}</span>
                  </div>

                  {selectedOriginalPrice != null && selectedDiscount > 0 && (
                    <div className="upgrade-original-row">
                      <span className="upgrade-original-price">
                        {selectedOriginalPrice.toFixed(2).replace('.', ',')} €
                      </span>
                      <span className="upgrade-original-discount ">-{selectedDiscount}%</span>
                    </div>
                  )}
                </div>

                {premiumPlan.dias_prueba > 0 && (
                  <div className="upgrade-trial-row">
                    <span>{premiumPlan.dias_prueba} días de prueba gratis</span>
                  </div>
                )}

                <p className="upgrade-feature-text">
                  Cámbiate a premium y desbloquea todas las funcionalidades actuales y futuras.
                </p>

                <button
                  className="btn btn-primary upgrade-btn-full"
                  onClick={() => { void handleUpgrade() }}
                >
                  <Crown size={14} />
                  Activar Premium
                </button>
              </>
            )}
          </>
        )}

        {step === 'loading' && (
          <div className="empty-state upgrade-state-plain" style={{ padding: 'var(--space-8) 0' }}>
            <Loader2 size={28} className="spin empty-state-icon text-primary" />
            <p className="upgrade-state-title">Activando Premium…</p>
            <p className="upgrade-state-desc">Estamos actualizando tu cuenta. Un momento, por favor.</p>
          </div>
        )}

        {step === 'success' && (
          <div className="empty-state upgrade-state-plain" style={{ padding: 'var(--space-8) 0' }}>
            <CheckCircle size={32} className="text-success" />
            <p className="upgrade-state-title">¡Plan Premium activado!</p>
            <p className="upgrade-state-desc">Ya tienes acceso a todas las herramientas y funcionalidades avanzadas.</p>
            <button className="btn btn-primary btn-sm" onClick={onClose} style={{ marginTop: 16 }}>
              ¡A trabajar!
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="empty-state upgrade-state-plain" style={{ padding: 'var(--space-8) 0' }}>
            <AlertTriangle size={28} className="text-error" />
            <p className="upgrade-state-title">Algo salió mal</p>
            <p className="upgrade-state-desc">{error ?? 'Error desconocido'}</p>
            <div className="flex items-center gap-2 justify-center" style={{ marginTop: 16 }}>
              <button className="btn btn-secondary btn-sm" onClick={onClose}>
                Cancelar
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => { void handleUpgrade() }}>
                Reintentar
              </button>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
            <AlertTriangle size={28} className="text-error" />
            <p className="upgrade-state-title">Algo salió mal</p>
            <p className="upgrade-state-desc">{error ?? 'Error desconocido'}</p>
            <div className="flex items-center gap-2 justify-center" style={{ marginTop: 16 }}>
              <button className="btn btn-secondary btn-sm" onClick={onClose}>
                Cancelar
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => { void handleUpgrade() }}>
                Reintentar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
