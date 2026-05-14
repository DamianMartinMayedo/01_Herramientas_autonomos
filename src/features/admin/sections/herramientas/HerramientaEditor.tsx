/**
 * HerramientaEditor.tsx
 * Modal de edición de metadatos de herramienta. Usa AdminModal.
 * Persiste vía edge function admin-herramientas (PATCH).
 */
import { useState } from 'react'
import { AdminModal } from '../../components/AdminModal'
import { adminPatch } from '../../hooks/useAdminFetch'
import type { Herramienta, PlanRequired, HerramientaEstado } from '../../../../types/herramienta'
import { Crown, AlertTriangle } from 'lucide-react'

interface Props {
  herramienta: Herramienta
  onClose: () => void
  onSaved: () => void
}

export function HerramientaEditor({ herramienta, onClose, onSaved }: Props) {
  const [nombre, setNombre] = useState(herramienta.nombre)
  const [desc,   setDesc]   = useState(herramienta.descripcion)
  const [estado, setEstado] = useState<HerramientaEstado>(herramienta.estado)
  const [plan,   setPlan]   = useState<PlanRequired>(herramienta.plan_required)
  const [anon,   setAnon]   = useState(herramienta.anon_available)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const handlePlanChange = (val: PlanRequired) => {
    setPlan(val)
    if (val === 'premium') setAnon(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const res = await adminPatch('/functions/v1/admin-herramientas', {
      id: herramienta.id,
      nombre,
      descripcion: desc,
      estado,
      plan_required: plan,
      anon_available: plan === 'premium' ? false : anon,
    })
    setSaving(false)
    if (!res.ok) { setError(res.error ?? 'Error al guardar'); return }
    onSaved()
    onClose()
  }

  return (
    <AdminModal
      open
      size="md"
      title="Editar herramienta"
      onClose={onClose}
      bodyGap="lg"
      closeDisabled={saving}
      footer={
        <>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={() => { void handleSave() }} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <div className="input-group">
        <label className="input-label">Nombre</label>
        <input className="input-v3" value={nombre} onChange={e => setNombre(e.target.value)} disabled={saving} />
      </div>

      <div className="input-group">
        <label className="input-label">Descripción</label>
        <textarea
          className="textarea-v3"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          rows={3}
          disabled={saving}
          style={{ minHeight: 'auto' }}
        />
      </div>

      <div className="input-group">
        <label className="input-label">Estado</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEstado('active')}
            className={`filter-pill${estado === 'active' ? ' active' : ''}`}
            disabled={saving}
          >
            Activa
          </button>
          <button
            type="button"
            onClick={() => setEstado('coming_soon')}
            className={`filter-pill${estado === 'coming_soon' ? ' active' : ''}`}
            disabled={saving}
          >
            Próximamente
          </button>
          <button
            type="button"
            onClick={() => setEstado('maintenance')}
            className={`filter-pill${estado === 'maintenance' ? ' active' : ''}`}
            disabled={saving}
          >
            <AlertTriangle size={12} /> Mejorando
          </button>
        </div>
      </div>

      <div className="input-group">
        <label className="input-label">Plan requerido</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handlePlanChange('free')}
            className={`filter-pill${plan === 'free' ? ' active' : ''}`}
            disabled={saving}
          >
            Free
          </button>
          <button
            type="button"
            onClick={() => handlePlanChange('premium')}
            className={`filter-pill${plan === 'premium' ? ' active' : ''}`}
            disabled={saving}
          >
            <Crown size={12} /> Premium
          </button>
        </div>
      </div>

      <label className={`input-toggle${plan === 'premium' ? ' is-disabled' : ''}`}>
        <input
          type="checkbox"
          checked={anon}
          onChange={e => setAnon(e.target.checked)}
          disabled={saving || plan === 'premium'}
        />
        <span>Disponible para usuarios sin registro</span>
      </label>
      {plan === 'premium' && (
        <p className="admin-modal-hint">Las herramientas premium siempre requieren registro y suscripción.</p>
      )}

      {error && (
        <div className="error-box">
          <AlertTriangle size={15} className="error-box-icon" />
          <span>{error}</span>
        </div>
      )}
    </AdminModal>
  )
}
