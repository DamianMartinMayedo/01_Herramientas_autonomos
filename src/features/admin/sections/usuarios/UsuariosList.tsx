/**
 * UsuariosList.tsx
 * Tabla de usuarios con buscador, filtros y dropdown de acciones.
 * Click en fila → abre detalle.
 */
import { useMemo, useState } from 'react'
import { Search, UserPlus, Ban, Crown } from 'lucide-react'
import { UserActionsMenu } from './UserActionsMenu'
import type { UserProfile } from './types'

interface Props {
  users: UserProfile[]
  loading: boolean
  onSelectUser: (u: UserProfile) => void
  onCreateClick: () => void
  onUserChanged: () => void
}

type Filter = 'all' | 'premium' | 'free' | 'new7d' | 'no-login'

function relative(iso: string | null | undefined) {
  if (!iso) return 'Nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'Ahora'
  if (m < 60) return `Hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `Hace ${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `Hace ${d}d`
  return new Date(iso).toLocaleDateString('es-ES')
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export function UsuariosList({ users, loading, onSelectUser, onCreateClick, onUserChanged }: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return users.filter(u => {
      if (q && !u.email?.toLowerCase().includes(q)) return false
      if (filter === 'premium' && u.plan !== 'premium') return false
      if (filter === 'free'    && u.plan !== 'free')    return false
      if (filter === 'new7d'   && (Date.now() - new Date(u.created_at).getTime()) > SEVEN_DAYS_MS) return false
      if (filter === 'no-login' && u.last_sign_in_at) return false
      return true
    })
  }, [users, search, filter])

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all',      label: 'Todos' },
    { id: 'premium',  label: 'Premium' },
    { id: 'free',     label: 'Free' },
    { id: 'new7d',    label: 'Nuevos 7d' },
    { id: 'no-login', label: 'Sin login' },
  ]

  return (
    <>
      <div className="admin-section-header">
        <div>
          <h1 className="section-title">Usuarios</h1>
          <p className="section-sub">Gestión de usuarios registrados, plan, accesos y documentos.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onCreateClick}>
          <UserPlus size={15} /> Crear usuario
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

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`filter-pill${filter === id ? ' active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card card-no-pad">
        <table className="data-table">
          <thead>
            <tr className="data-thead-row">
              <th className="data-th">Usuario / Email</th>
              <th className="data-th">Plan</th>
              <th className="data-th-right">Documentos</th>
              <th className="data-th">Último login</th>
              <th className="data-th">Registrado</th>
              <th className="data-th-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="data-td data-td--center">Cargando usuarios...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="data-td data-td--center data-td--faint">No se encontraron usuarios</td></tr>
            ) : (
              filtered.map(user => {
                const isPremium = user.plan === 'premium'
                const isBanned  = !!user.banned_until && new Date(user.banned_until).getTime() > Date.now()
                return (
                  <tr
                    key={user.id}
                    className="data-tr user-tr-clickable"
                    onClick={() => onSelectUser(user)}
                  >
                    <td className="data-td">
                      <div className="flex items-center gap-3">
                        <div className="user-initial-avatar">{user.email?.[0]?.toUpperCase()}</div>
                        <div>
                          <div className="data-td--bold">{user.email}</div>
                          {isBanned && (
                            <span className="badge badge-error badge-xs">
                              <Ban size={9} /> Suspendido
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="data-td">
                      <span className={`badge ${isPremium ? 'badge-gold' : 'badge-muted'}`}>
                        {isPremium ? <><Crown size={9} /> Premium</> : 'Free'}
                      </span>
                    </td>
                    <td className="data-td-right data-td--bold">{user.documents_count ?? 0}</td>
                    <td className="data-td data-td--muted">{relative(user.last_sign_in_at)}</td>
                    <td className="data-td data-td--muted">{new Date(user.created_at).toLocaleDateString('es-ES')}</td>
                    <td className="data-td-right">
                      <UserActionsMenu
                        user={user}
                        variant="menu"
                        onOpenDetail={() => onSelectUser(user)}
                        onChanged={onUserChanged}
                      />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
