/**
 * EmpresaInfo.tsx
 * Tarjeta de datos de empresa del usuario (NIF, dirección…). Si el usuario
 * aún no ha registrado empresa, muestra un mensaje sutil.
 */
import { Building2 } from 'lucide-react'
import type { EmpresaInfo as EmpresaInfoType } from './types'

interface Props { empresa: EmpresaInfoType | null }

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="user-data-row">
      <span className="user-data-label">{label}</span>
      <span className="user-data-value">{value}</span>
    </div>
  )
}

export function EmpresaInfo({ empresa }: Props) {
  if (!empresa) {
    return (
      <div className="empty-state">
        <Building2 size={20} className="empty-state-icon" />
        <p className="empty-state-text">Sin empresa registrada.</p>
      </div>
    )
  }
  const direccion = [empresa.direccion, empresa.cp, empresa.ciudad, empresa.provincia]
    .filter(Boolean)
    .join(', ')
  return (
    <div className="card">
      <Field label="Nombre"    value={empresa.nombre} />
      <Field label="NIF"       value={empresa.nif} />
      <Field label="Email"     value={empresa.email} />
      <Field label="Teléfono"  value={empresa.telefono} />
      <Field label="Dirección" value={direccion || null} />
    </div>
  )
}
