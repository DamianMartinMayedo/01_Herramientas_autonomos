/**
 * HerramientaEditor.tsx
 * Modal de edición de metadatos de herramienta. Usa AdminModal.
 */
import { useState } from 'react'
import { useAdminStore, type Herramienta } from '../../../../store/adminStore'
import { AdminModal } from '../../components/AdminModal'

interface Props {
  herramienta: Herramienta
  onClose: () => void
}

export function HerramientaEditor({ herramienta, onClose }: Props) {
  const updateHerramienta = useAdminStore(s => s.updateHerramienta)
  const [nombre, setNombre] = useState(herramienta.nombre)
  const [desc,   setDesc]   = useState(herramienta.descripcion)
  const [prox,   setProx]   = useState(herramienta.proximamente)
  const [mant,   setMant]   = useState(herramienta.mantenimiento ?? false)

  const handleProxChange = (val: boolean) => { setProx(val); if (val) setMant(false) }
  const handleMantChange = (val: boolean) => { setMant(val); if (val) setProx(false) }

  const handleSave = () => {
    updateHerramienta(herramienta.id, {
      nombre, descripcion: desc, proximamente: prox, mantenimiento: mant,
    })
    onClose()
  }

  return (
    <AdminModal
      open
      size="md"
      title="Editar herramienta"
      onClose={onClose}
      bodyGap="lg"
      footer={
        <>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>Guardar</button>
        </>
      }
    >
      <div className="input-group">
        <label className="input-label">Nombre</label>
        <input className="input-v3" value={nombre} onChange={e => setNombre(e.target.value)} />
      </div>
      <div className="input-group">
        <label className="input-label">Descripción</label>
        <textarea
          className="textarea-v3"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          rows={3}
          style={{ minHeight: 'auto' }}
        />
      </div>
      <label className="input-toggle">
        <input type="checkbox" checked={prox} onChange={e => handleProxChange(e.target.checked)} />
        <span>Mostrar como "Próximamente"</span>
      </label>
      <label className="input-toggle">
        <input type="checkbox" checked={mant} onChange={e => handleMantChange(e.target.checked)} />
        <span>Mostrar como "Mejorando"</span>
      </label>
    </AdminModal>
  )
}
