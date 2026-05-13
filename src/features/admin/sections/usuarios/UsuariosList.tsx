/**
 * UsuariosList.tsx
 * Tabla de usuarios + buscador. Click en fila abre el detalle.
 */
import { useMemo, useState } from 'react'
import { Search, ChevronRight, CreditCard, UserPlus } from 'lucide-react'
import type { UserProfile } from './types'

interface Props {
  users: UserProfile[]
  loading: boolean
  onSelectUser: (u: UserProfile) => void
  onCreateClick: () => void
}

export function UsuariosList({ users, loading, onSelectUser, onCreateClick }: Props) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter(u => u.email?.toLowerCase().includes(q))
  }, [users, search])

  return (
    <>
      <div className="admin-section-header">
        <div>
          <h1 className="section-title">Usuarios y Facturas</h1>
          <p className="section-sub">Gestión de usuarios registrados y auditoría de documentos fiscales.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onCreateClick}>
          <UserPlus size={15} />
          Crear usuario
        </button>
      </div>

      <div className="input-with-icon-wrap">
        <Search size={18} className="input-icon-leading" />
        <input
          type="text"
          placeholder="Buscar por email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-v3 has-icon-left"
        />
      </div>

      <div className="card card-no-pad">
        <table className="data-table">
          <thead>
            <tr className="data-thead-row">
              <th className="data-th">Usuario / Email</th>
              <th className="data-th">Plan</th>
              <th className="data-th">Suscripción</th>
              <th className="data-th">Registrado</th>
              <th className="data-th-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="data-td data-td--center">Cargando usuarios...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="data-td data-td--center data-td--faint">No se encontraron usuarios</td></tr>
            ) : (
              filtered.map(user => (
                <tr key={user.id} className="data-tr">
                  <td className="data-td">
                    <div className="flex items-center gap-3">
                      <div className="user-initial-avatar">{user.email?.[0]?.toUpperCase()}</div>
                      <span className="data-td--bold">{user.email}</span>
                    </div>
                  </td>
                  <td className="data-td">
                    <span className={`badge ${user.plan === 'premium' ? 'badge-primary' : 'badge-muted'}`}>
                      {user.plan || 'Free'}
                    </span>
                  </td>
                  <td className="data-td data-td--faint">
                    {user.plan === 'premium' ? <CreditCard size={14} /> : '—'}
                  </td>
                  <td className="data-td data-td--muted">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="data-td-right">
                    <button onClick={() => onSelectUser(user)} className="btn btn-secondary btn-sm">
                      Ver facturas <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
