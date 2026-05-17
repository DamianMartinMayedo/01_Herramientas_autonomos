/**
 * HerramientasSection.tsx
 * Gestión de herramientas: activar/desactivar, mostrar/ocultar, editar.
 * Lee y escribe vía la edge function admin-herramientas con x-admin-secret.
 */
import { useMemo, useState } from 'react'
import { useAdminFetch, adminPatch } from '../hooks/useAdminFetch'
import { ConfirmModal } from '../components/ConfirmModal'
import { HerramientaEditor } from './herramientas/HerramientaEditor'
import { activationTexts, visibilityTexts, emptyConfirm } from '../utils/modalTexts'
import { Pencil, Eye, EyeOff, Crown, Loader2 } from 'lucide-react'
import type { Herramienta, HerramientaEstado } from '../../../types/herramienta'

type ModalTarget = { herramienta: Herramienta; accion: 'visibilidad' | 'activacion' } | null

const CATEGORIA_LABELS: Record<string, string> = {
  documentos:    'Documentos',
  contratos:     'Contratos y acuerdos',
  calculadoras:  'Calculadoras',
}

interface ApiPayload { herramientas: Herramienta[] }

const ESTADO_LABEL: Record<HerramientaEstado, string> = {
  active: 'Activa',
  maintenance: 'Mejorando',
  coming_soon: 'Próximamente',
}

export function HerramientasSection() {
  const { data, loading, error, refetch } = useAdminFetch<Herramienta[]>(
    '/functions/v1/admin-herramientas',
    { transform: (raw) => (raw as ApiPayload).herramientas ?? [] },
  )

  const [editing,     setEditing]     = useState<Herramienta | null>(null)
  const [modalTarget, setModalTarget] = useState<ModalTarget>(null)
  const [busy,        setBusy]        = useState(false)

  const byCategoria = useMemo(() => {
    return (data ?? []).reduce<Record<string, Herramienta[]>>((acc, h) => {
      if (!acc[h.categoria]) acc[h.categoria] = []
      acc[h.categoria].push(h)
      return acc
    }, {})
  }, [data])

  const handleConfirm = async () => {
    if (!modalTarget) return
    setBusy(true)
    const { herramienta: h, accion } = modalTarget
    const patch: Record<string, unknown> = { id: h.id }

    if (accion === 'visibilidad') {
      patch.visible = h.visible === false ? true : false
    } else {
      patch.estado = h.estado === 'active' ? 'maintenance' : 'active'
    }

    const res = await adminPatch('/functions/v1/admin-herramientas', patch)
    setBusy(false)
    setModalTarget(null)
    if (!res.ok) { alert(res.error ?? 'Error al guardar'); return }
    await refetch()
  }

  const modalProps = modalTarget
    ? modalTarget.accion === 'visibilidad'
      ? visibilityTexts(modalTarget.herramienta.nombre, modalTarget.herramienta.visible === false)
      : activationTexts(modalTarget.herramienta.nombre, modalTarget.herramienta.estado === 'active')
    : emptyConfirm()

  if (loading) {
    return (
      <div className="section-stack">
        <div>
          <h1 className="section-title">Herramientas</h1>
          <p className="section-sub">Cargando catálogo desde Supabase…</p>
        </div>
        <div className="empty-state">
          <Loader2 size={20} className="spin empty-state-icon text-primary" />
          <p className="empty-state-text">Obteniendo herramientas…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="section-stack">
        <div>
          <h1 className="section-title">Herramientas</h1>
          <p className="section-sub">No se pudo cargar el catálogo</p>
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
        <h1 className="section-title">Herramientas</h1>
        <p className="section-sub">Activa o desactiva herramientas. Los cambios surten efecto al recargar la página.</p>
      </div>

      {Object.entries(byCategoria).map(([cat, items]) => (
        <div key={cat}>
          <p className="section-block-label">{CATEGORIA_LABELS[cat] ?? cat}</p>

          <div className="h-grid">
            {items.map(h => {
              const oculta = h.visible === false
              const premium = h.plan_required === 'premium'
              const isActive = h.estado === 'active'
              return (
                <div key={h.id} className={`h-card${isActive ? '' : ' h-card--inactive'}`}>
                  {premium && <span className="h-card--premium-badge"><span className="badge badge-gold badge-xs"><Crown size={9} /> Premium</span></span>}

                  <div className="h-card-main">
                    <div className="min-w-0 flex-1">
                      <span className={`h-name${oculta ? ' h-name--hidden' : ''}`}>{h.nombre}</span>
                      <div className="flex items-center flex-wrap gap-1 mt-1">
                        {!premium && !h.anon_available && <span className="badge badge-primary badge-xs">Registro</span>}
                        {oculta && <span className="badge badge-muted badge-xs">Oculta</span>}
                      </div>
                      <p className="h-desc">{h.descripcion}</p>
                      <div className="h-meta">
                        <span className="h-meta-item h-meta-item--mono">{h.ruta}</span>
                      </div>
                    </div>

                    <label className={`plan-switch${isActive ? ' is-on' : ''}${busy ? ' is-busy' : ''}`}>
                      <input
                        type="checkbox"
                        role="switch"
                        checked={isActive}
                        disabled={busy}
                        onChange={() => setModalTarget({ herramienta: h, accion: 'activacion' })}
                        aria-label={isActive ? 'Desactivar herramienta' : 'Activar herramienta'}
                      />
                      <span className="plan-switch-track" aria-hidden="true">
                        <span className="plan-switch-thumb" />
                      </span>
                    </label>
                  </div>

                  <div className="h-card-footer">
                    <div className="flex items-center gap-2">
                      <button
                        title={oculta ? 'Mostrar en Home' : 'Ocultar en Home'}
                        onClick={() => setModalTarget({ herramienta: h, accion: 'visibilidad' })}
                        className={`icon-btn ${oculta ? 'icon-btn--eye-off' : 'icon-btn--eye-on'}`}
                        disabled={busy}
                      >
                        {oculta ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>

                      <button
                        onClick={() => setEditing(h)}
                        className="icon-btn icon-btn--primary"
                        title="Editar"
                        disabled={busy}
                      >
                        <Pencil size={13} />
                      </button>
                    </div>

                    <span className="h-card-status">{isActive ? 'Activa' : ESTADO_LABEL[h.estado]}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {editing && (
        <HerramientaEditor
          key={editing.id}
          herramienta={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { void refetch() }}
        />
      )}

      {modalTarget && (
        <ConfirmModal
          {...modalProps}
          onConfirm={() => { void handleConfirm() }}
          onCancel={() => setModalTarget(null)}
        />
      )}
    </div>
  )
}
