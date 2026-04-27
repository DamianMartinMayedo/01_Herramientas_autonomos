/**
 * HerramientasSection.tsx
 * Gestión de herramientas: activar/desactivar, mostrar/ocultar y editar.
 * Todas las acciones destructivas pasan por ConfirmModal.
 */
import { useState } from 'react'
import { useAdminStore, type Herramienta } from '../../../store/adminStore'
import { ConfirmModal } from '../components/ConfirmModal'
import { ToggleLeft, ToggleRight, Pencil, X, CheckCircle, Clock, Eye, EyeOff } from 'lucide-react'

// ── Editor de herramienta ────────────────────────────────────────────────
interface EditorProps {
  herramienta: Herramienta
  onClose: () => void
}

function HerramientaEditor({ herramienta: h, onClose }: EditorProps) {
  const updateHerramienta = useAdminStore(s => s.updateHerramienta)
  const [nombre, setNombre] = useState(h.nombre)
  const [desc, setDesc] = useState(h.descripcion)
  const [prox, setProx] = useState(h.proximamente)
  const [mant, setMant] = useState(h.mantenimiento || false)

  const handleProxChange = (val: boolean) => { setProx(val); if (val) setMant(false) }
  const handleMantChange = (val: boolean) => { setMant(val); if (val) setProx(false) }

  const save = () => {
    updateHerramienta(h.id, { nombre, descripcion: desc, proximamente: prox, mantenimiento: mant })
    onClose()
  }

  return (
    <div className="overlay overlay-dark overlay-z200">
      <div className="admin-modal-box admin-modal-md">
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">Editar herramienta</h2>
          <button onClick={onClose} className="modal-close-btn"><X size={18} /></button>
        </div>
        <div className="admin-modal-body admin-modal-body--gap5">
          <div className="input-group">
            <label className="input-label">Nombre</label>
            <input className="input-v3" value={nombre} onChange={e => setNombre(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Descripción</label>
            <textarea className="textarea-v3" value={desc} onChange={e => setDesc(e.target.value)} rows={3} style={{ minHeight: 'auto' }} />
          </div>
          <label className="input-toggle">
            <input type="checkbox" checked={prox} onChange={e => handleProxChange(e.target.checked)} />
            <span>Mostrar como "Próximamente"</span>
          </label>
          <label className="input-toggle">
            <input type="checkbox" checked={mant} onChange={e => handleMantChange(e.target.checked)} />
            <span>Mostrar como "Mejorando"</span>
          </label>
        </div>
        <div className="admin-modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={save}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

// ── Tipo para el estado del modal ────────────────────────────────────────
type ModalTarget = { herramienta: Herramienta; accion: 'visibilidad' | 'activacion' } | null

// ── HerramientasSection ──────────────────────────────────────────────────
export function HerramientasSection() {
  const herramientas = useAdminStore(s => s.herramientas)
  const toggleHerramienta = useAdminStore(s => s.toggleHerramienta)
  const updateHerramienta = useAdminStore(s => s.updateHerramienta)

  const [editing, setEditing] = useState<Herramienta | null>(null)
  const [modalTarget, setModalTarget] = useState<ModalTarget>(null)

  const byCategoria = herramientas.reduce<Record<string, Herramienta[]>>((acc, h) => {
    if (!acc[h.categoria]) acc[h.categoria] = []
    acc[h.categoria].push(h)
    return acc
  }, {})

  const labels: Record<string, string> = {
    documentos: 'Documentos',
    contratos: 'Contratos y acuerdos',
    calculadoras: 'Calculadoras',
  }

  // ── Handlers confirmados ─────────────────────────────────────────────
  const handleConfirm = () => {
    if (!modalTarget) return
    const { herramienta: h, accion } = modalTarget
    if (accion === 'visibilidad') {
      updateHerramienta(h.id, { visible: h.visible === false ? true : false })
    } else {
      toggleHerramienta(h.id)
    }
    setModalTarget(null)
  }

  // ── Textos del modal según acción ────────────────────────────────────
  const getModalProps = (target: ModalTarget) => {
    if (!target) return { title: '', description: '', confirmLabel: '', confirmVariant: 'danger' as const }
    const { herramienta: h, accion } = target

    if (accion === 'visibilidad') {
      const oculta = h.visible === false
      return {
        title: oculta ? `Mostrar "${h.nombre}"` : `Ocultar "${h.nombre}"`,
        description: oculta
          ? 'La herramienta volverá a aparecer en el Home para todos los usuarios.'
          : 'La herramienta dejará de mostrarse en el Home. Seguirá siendo accesible por URL directa.',
        confirmLabel: oculta ? 'Sí, mostrar' : 'Sí, ocultar',
        confirmVariant: oculta ? 'success' as const : 'warning' as const,
      }
    }

    return {
      title: h.activa ? `Desactivar "${h.nombre}"` : `Activar "${h.nombre}"`,
      description: h.activa
        ? 'La herramienta quedará inaccesible para los usuarios y se mostrará como "Mejorando".'
        : 'La herramienta pasará a estar disponible para todos los usuarios.',
      confirmLabel: h.activa ? 'Sí, desactivar' : 'Sí, activar',
      confirmVariant: h.activa ? 'danger' as const : 'success' as const,
    }
  }

  const modalProps = getModalProps(modalTarget)

  return (
    <div className="section-stack">

      <div>
        <h1 className="section-title">Herramientas</h1>
        <p className="section-sub">Activa o desactiva herramientas. Los cambios se reflejan en el Home instantáneamente.</p>
      </div>

      <div style={{
        padding: 'var(--space-4)',
        background: 'var(--color-primary-subtle)', border: '1.5px solid var(--color-primary-highlight)',
        borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--color-primary)' }}>Nota local→cloud:</strong> Los cambios se guardan en localStorage. Al migrar a Supabase serán globales automáticamente.
      </div>

      {Object.entries(byCategoria).map(([cat, items]) => (
        <div key={cat}>
          <p className="section-block-label">{labels[cat] ?? cat}</p>

          <div className="flex flex-col gap-3">
            {items.map(h => (
              <div key={h.id} className={`h-card${h.activa ? '' : ' h-card--inactive'}`}>

                {/* Status icon */}
                <div>
                  {h.activa
                    ? <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
                    : <Clock size={18} style={{ color: 'var(--color-text-faint)' }} />
                  }
                </div>

                {/* Info */}
                <div className="min-w-0" style={{ flex: 1 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{
                      fontWeight: 600, fontSize: 'var(--text-sm)',
                      color: h.visible === false ? 'var(--color-text-faint)' : 'var(--color-text)',
                      textDecoration: h.visible === false ? 'line-through' : 'none',
                    }}>
                      {h.nombre}
                    </span>
                    {h.visible === false && <span className="badge badge-muted badge-xs">Oculta</span>}
                    {h.proximamente && <span className="badge badge-copper badge-xs">Próximamente</span>}
                    {h.mantenimiento && <span className="badge badge-gold badge-xs">Mejorando</span>}
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {h.descripcion}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span style={{ fontSize: '11px', color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)' }}>{h.ruta}</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-faint)' }}>{h.usosRegistrados} usos</span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>

                  {/* Ojo: mostrar/ocultar en Home */}
                  <button
                    title={h.visible === false ? 'Mostrar en Home' : 'Ocultar en Home'}
                    onClick={() => setModalTarget({ herramienta: h, accion: 'visibilidad' })}
                    className="icon-btn"
                    style={{ color: h.visible === false ? 'var(--color-text-faint)' : 'var(--color-text-muted)' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = h.visible === false ? 'var(--color-success)' : 'var(--color-gold)'
                      e.currentTarget.style.borderColor = h.visible === false ? 'var(--color-success)' : 'var(--color-gold)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = h.visible === false ? 'var(--color-text-faint)' : 'var(--color-text-muted)'
                      e.currentTarget.style.borderColor = 'var(--color-border)'
                    }}
                  >
                    {h.visible === false ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>

                  {/* Editar */}
                  <button onClick={() => setEditing(h)} className="icon-btn">
                    <Pencil size={13} />
                  </button>

                  {/* Toggle activa */}
                  <button
                    onClick={() => setModalTarget({ herramienta: h, accion: 'activacion' })}
                    title={h.activa ? 'Desactivar herramienta' : 'Activar herramienta'}
                    className={`toggle-btn ${h.activa ? 'toggle-btn--active' : 'toggle-btn--inactive'}`}
                  >
                    {h.activa
                      ? <><ToggleRight size={15} /> Activa</>
                      : <><ToggleLeft size={15} /> Inactiva</>
                    }
                  </button>

                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {editing && <HerramientaEditor herramienta={editing} onClose={() => setEditing(null)} />}

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
