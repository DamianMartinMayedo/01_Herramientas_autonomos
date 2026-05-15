import { useState, useEffect, useRef } from 'react'
import { X, Crown, Loader2, AlertTriangle, Check, ShieldCheck } from 'lucide-react'
import { usePlanes } from '../../hooks/usePlanes'
import { useProfile } from '../../hooks/useProfile'
import { supabase } from '../../lib/supabaseClient'
import type { PlanConfig } from '../../types/plan'

interface Props {
  open: boolean
  onClose: () => void
}

type Step = 'confirm' | 'loading' | 'error'
type Billing = 'mensual' | 'anual'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

export function UpgradeModal({ open, onClose }: Props) {
  const { planes, loading: planesLoading, refetch: refetchPlanes } = usePlanes()
  const { refetch: refetchProfile } = useProfile()
  const [step, setStep] = useState<Step>('confirm')
  const [error, setError] = useState<string | null>(null)
  const [billing, setBilling] = useState<Billing>('mensual')
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const primaryActionRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null
      void refetchPlanes()
      setStep('confirm')
      setError(null)
      setBilling('mensual')
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [open, refetchPlanes])

  const premiumPlan: PlanConfig | undefined = planes.find((p) => p.id === 'premium' && p.activo)

  useEffect(() => {
    if (open && step === 'confirm' && primaryActionRef.current) {
      primaryActionRef.current.focus()
    }
  }, [open, step, premiumPlan])

  const computedMensual = premiumPlan
    ? premiumPlan.precio_mensual * (1 - premiumPlan.descuento_mensual_pct / 100)
    : 0

  const precioAnualBase = premiumPlan ? premiumPlan.precio_mensual * 12 : 0
  const precioAnualFinal = premiumPlan && premiumPlan.descuento_anual_pct > 0
    ? precioAnualBase * (1 - premiumPlan.descuento_anual_pct / 100)
    : precioAnualBase
  const ahorroAnual = precioAnualBase - precioAnualFinal
  const equivalenteMensualAnual = precioAnualFinal / 12
  const hasAnnualPricing = precioAnualBase > 0

  const selectedPrice = billing === 'anual' ? precioAnualFinal : computedMensual
  const selectedPeriod = billing === 'anual' ? '/ año' : '/ mes'

  const hasTrial = (premiumPlan?.dias_prueba ?? 0) > 0
  const features = premiumPlan?.features ?? []

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

  const isFirstLoad = planesLoading && planes.length === 0
  const showCloseBtn = !isFirstLoad && step !== 'loading'
  const isErrorStep = step === 'error'
  const showPaymentLayout = !isFirstLoad && step === 'confirm' && !!premiumPlan
  const narrowModal = step === 'confirm' && !isFirstLoad && !premiumPlan
  // Mantenemos las dimensiones "payment" también en loading/error si el plan está cargado,
  // para que el modal no cambie de tamaño al transicionar entre estados.
  const keepPaymentSize = !isFirstLoad && !!premiumPlan && step !== 'confirm'

  const ctaLabel = hasTrial
    ? `Empezar prueba gratis de ${premiumPlan!.dias_prueba} días`
    : 'Activar Premium'

  return (
    <div
      className="auth-modal-overlay"
      role={isErrorStep ? 'alertdialog' : 'dialog'}
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      <div
        className={`auth-modal upgrade-modal${showPaymentLayout || keepPaymentSize ? ' upgrade-modal--payment' : ''}${narrowModal ? ' upgrade-modal--narrow' : ''}${isFirstLoad ? ' upgrade-modal--loading-only' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseBtn && (
          <button
            type="button"
            onClick={onClose}
            className="auth-modal__close"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        )}

        {isFirstLoad && (
          <div className="upgrade-loading-plain">
            <Loader2 size={28} className="spin text-primary" aria-hidden="true" />
            <span id="upgrade-modal-title" className="upgrade-loading-text">Cargando planes…</span>
          </div>
        )}

        {!isFirstLoad && step === 'confirm' && !premiumPlan && (
          <div className="upgrade-unavailable">
            <Crown size={28} className="upgrade-unavailable-icon" aria-hidden="true" />
            <p id="upgrade-modal-title" className="upgrade-unavailable-title">El plan Premium no está disponible en este momento</p>
            <p className="upgrade-unavailable-desc">Estamos preparando mejoras para ofrecerte la mejor experiencia. Vuelve a intentarlo más tarde.</p>
            <button ref={primaryActionRef} className="btn btn-primary upgrade-btn-full" onClick={onClose}>
              Entendido
            </button>
          </div>
        )}

        {showPaymentLayout && (
          <div className="upgrade-payment">
            <header className="upgrade-payment-header">
              <div className="upgrade-icon-box">
                <Crown size={22} aria-hidden="true" />
              </div>
              <h2 id="upgrade-modal-title" className="upgrade-payment-title">Desbloquea {premiumPlan!.nombre}</h2>
              {premiumPlan!.descripcion && (
                <p className="upgrade-payment-subtitle">{premiumPlan!.descripcion}</p>
              )}
            </header>

            {hasAnnualPricing && (
              <div className="upgrade-billing-switch" role="radiogroup" aria-label="Periodicidad de facturación">
                <button
                  type="button"
                  role="radio"
                  aria-checked={billing === 'mensual'}
                  onClick={() => setBilling('mensual')}
                  className={`upgrade-switch-pill${billing === 'mensual' ? ' active' : ''}`}
                >
                  Mensual
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={billing === 'anual'}
                  onClick={() => setBilling('anual')}
                  className={`upgrade-switch-pill${billing === 'anual' ? ' active' : ''}`}
                >
                  Anual
                  {premiumPlan!.descuento_anual_pct > 0 && (
                    <span className="upgrade-switch-badge">-{premiumPlan!.descuento_anual_pct}%</span>
                  )}
                </button>
                <div
                  className="upgrade-switch-indicator"
                  style={{
                    transform: billing === 'anual' ? 'translateX(calc(100% + 8px))' : 'translateX(0)',
                  }}
                />
              </div>
            )}

            <div className="upgrade-price-block">
              <div className="upgrade-price-row">
                <span className="upgrade-price-value">
                  {selectedPrice.toFixed(2).replace('.', ',')} €
                </span>
                <span className="upgrade-price-period">{selectedPeriod}</span>
              </div>
              {billing === 'anual' && (
                <p className="upgrade-price-equiv">
                  Equivale a {equivalenteMensualAnual.toFixed(2).replace('.', ',')} €/mes
                  {ahorroAnual > 0 && (
                    <> · <span className="upgrade-price-savings">Ahorras {ahorroAnual.toFixed(2).replace('.', ',')} €/año</span></>
                  )}
                </p>
              )}
            </div>

            {hasTrial && (
              <div className="upgrade-trial-row">
                <span>
                  <strong>{premiumPlan!.dias_prueba} días gratis</strong>
                  {' · Después '}
                  {selectedPrice.toFixed(2).replace('.', ',')} €{selectedPeriod.replace(' ', '')}
                </span>
              </div>
            )}

            {features.length > 0 && (
              <ul className="upgrade-features-list">
                {features.map((f, i) => (
                  <li key={i} className="upgrade-feature-item">
                    <Check size={16} className="upgrade-feature-check" aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="upgrade-payment-methods" aria-label="Métodos de pago aceptados">
              <ShieldCheck size={14} className="upgrade-payment-secure-icon" aria-hidden="true" />
              <span className="upgrade-payment-secure-text">Pago seguro</span>
              <span className="upgrade-payment-method">VISA</span>
              <span className="upgrade-payment-method">MC</span>
              <span className="upgrade-payment-method">AMEX</span>
              <span className="upgrade-payment-method">Pay</span>
            </div>

            <button
              ref={primaryActionRef}
              className="btn btn-primary upgrade-btn-full"
              onClick={() => { void handleUpgrade() }}
            >
              <Crown size={14} aria-hidden="true" />
              {ctaLabel}
            </button>

            <p className="upgrade-legal">
              Renovación automática · Cancela cuando quieras · IVA incluido.
              <br />
              Al continuar aceptas los <a href="/terminos" target="_blank" rel="noopener noreferrer" className="upgrade-legal-link">Términos</a> y la <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="upgrade-legal-link">Política de privacidad</a>.
            </p>
          </div>
        )}

        {step === 'loading' && (
          <div className="upgrade-state-block">
            <Loader2 size={28} className="spin text-primary" aria-hidden="true" />
            <p id="upgrade-modal-title" className="upgrade-state-title">Activando Premium…</p>
            <p className="upgrade-state-desc">Estamos actualizando tu cuenta. Un momento, por favor.</p>
          </div>
        )}

        {isErrorStep && (
          <div className="upgrade-state-block">
            <AlertTriangle size={28} className="text-error" aria-hidden="true" />
            <p id="upgrade-modal-title" className="upgrade-state-title">Algo salió mal</p>
            <p className="upgrade-state-desc">{error ?? 'Error desconocido'}</p>
            <div className="upgrade-state-actions">
              <button className="btn btn-secondary btn-sm" onClick={onClose}>
                Cancelar
              </button>
              <button
                ref={primaryActionRef}
                className="btn btn-primary btn-sm"
                onClick={() => { void handleUpgrade() }}
              >
                Reintentar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
