/**
 * HerramientasSection.tsx
 * Gestión de herramientas: activar/desactivar, mostrar/ocultar, editar.
 * Las acciones destructivas o de impacto pasan por ConfirmModal.
 */
import { useState } from 'react'
import { useAdminStore, type Herramienta } from '../../../store/adminStore'
import { ConfirmModal } from '../components/ConfirmModal'
import { HerramientaEditor } from './herramientas/HerramientaEditor'
import { activationTexts, visibilityTexts, emptyConfirm } from '../utils/modalTexts'
import { ToggleLeft, ToggleRight, Pencil, CheckCircle, Clock, Eye, EyeOff } from 'lucide-react'

type ModalTarget = { herramienta: Herramienta; accion: 'visibilidad' | 'activacion' } | null

const CATEGORIA_LABELS: Record<string, string> = {
  documentos:    'Documentos',
  contratos:     'Contratos y acuerdos',
  calculadoras:  'Calculadoras',
}

export function HerramientasSection() {
  const herramientas      = useAdminStore(s => s.herramientas)
  const toggleHerramienta = useAdminStore(s => s.toggleHerramienta)
  const updateHerramienta = useAdminStore(s => s.updateHerramienta)

  const [editing,     setEditing]     = useState<Herramienta | null>(null)
  const [modalTarget, setModalTarget] = useState<ModalTarget>(null)

  const byCategoria = herramientas.reduce<Record<string, Herramienta[]>>((acc, h) => {
    if (!acc[h.categoria]) acc[h.categoria] = []
    acc[h.categoria].push(h)
    return acc
  }, {})

  const handleConfirm = () => {
    if (!modalTarget) return
    const { herramienta: h, accion } = modalTarget
    if (accion === 'visibilidad') {
      updateHerramienta(h.id, { visible: h.visible === false })
    } else {
      toggleHerramienta(h.id)
    }
    setModalTarget(null)
  }

  const modalProps = modalTarget
    ? modalTarget.accion === 'visibilidad'
      ? visibilityTexts(modalTarget.herramienta.nombre, modalTarget.herramienta.visible === false)
      : activationTexts(modalTarget.herramienta.nombre, modalTarget.herramienta.activa)
    : emptyConfirm()

  return (
    <div className="section-stack">

      <div>
        <h1 className="section-title">Herramientas</h1>
        <p className="section-sub">Activa o desactiva herramientas. Los cambios se reflejan en el Home instantáneamente.</p>
      </div>

      <div className="admin-info-box">
        <strong className="admin-info-box-strong">Nota local→cloud:</strong>{' '}
        Los cambios se guardan en localStorage. Al migrar a Supabase serán globales automáticamente.
      </div>

      {Object.entries(byCategoria).map(([cat, items]) => (
        <div key={cat}>
          <p className="section-block-label">{CATEGORIA_LABELS[cat] ?? cat}</p>

          <div className="flex flex-col gap-3">
            {items.map(h => {
              const oculta = h.visible === false
              return (
                <div key={h.id} className={`h-card${h.activa ? '' : ' h-card--inactive'}`}>

                  <div>
                    {h.activa
                      ? <CheckCircle size={18} className="text-success" />
                      : <Clock       size={18} className="text-faint" />
                    }
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`h-name${oculta ? ' h-name--hidden' : ''}`}>{h.nombre}</span>
                      {oculta && <span className="badge badge-muted badge-xs">Oculta</span>}
                      {h.proximamente && <span className="badge badge-copper badge-xs">Próximamente</span>}
                      {h.mantenimiento && <span className="badge badge-gold badge-xs">Mejorando</span>}
                    </div>
                    <p className="h-desc">{h.descripcion}</p>
                    <div className="h-meta">
                      <span className="h-meta-item h-meta-item--mono">{h.ruta}</span>
                      <span className="h-meta-item">{h.usosRegistrados} usos</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      title={oculta ? 'Mostrar en Home' : 'Ocultar en Home'}
                      onClick={() => setModalTarget({ herramienta: h, accion: 'visibilidad' })}
                      className={`icon-btn ${oculta ? 'icon-btn--eye-off' : 'icon-btn--eye-on'}`}
                    >
                      {oculta ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>

                    <button onClick={() => setEditing(h)} className="icon-btn icon-btn--primary" title="Editar">
                      <Pencil size={13} />
                    </button>

                    <button
                      onClick={() => setModalTarget({ herramienta: h, accion: 'activacion' })}
                      title={h.activa ? 'Desactivar herramienta' : 'Activar herramienta'}
                      className={`toggle-btn ${h.activa ? 'toggle-btn--active' : 'toggle-btn--inactive'}`}
                    >
                      {h.activa
                        ? <><ToggleRight size={15} /> Activa</>
                        : <><ToggleLeft  size={15} /> Inactiva</>
                      }
                    </button>
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
        />
      )}

      {modalTarget && (
        <ConfirmModal
          {...modalProps}
          onConfirm={handleConfirm}
          onCancel={() => setModalTarget(null)}
        />
      )}
    </div>
  )
}
