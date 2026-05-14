/**
 * UsuariosSection — orquestador.
 * Mantiene el estado de vista (lista | detalle) y delega en sub-componentes.
 */
import { useState, useMemo } from 'react'
import { useAdminFetch } from '../../hooks/useAdminFetch'
import { UsuariosList } from './UsuariosList'
import { UsuarioDetail } from './UsuarioDetail'
import { CrearUsuarioModal } from './CrearUsuarioModal'
import type { UserProfile } from './types'

type UsersPayload = { users?: UserProfile[] }

export function UsuariosSection() {
  const { data, loading, refetch } = useAdminFetch<UserProfile[]>('/functions/v1/admin-create-user', {
    transform: (raw) => {
      const list = (raw as UsersPayload).users ?? []
      return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    },
  })

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [crearOpen,    setCrearOpen]    = useState(false)
  const [deletedIds,   setDeletedIds]   = useState<Set<string>>(new Set())

  const displayedUsers = useMemo(
    () => (data ?? []).filter(u => !deletedIds.has(u.id)),
    [data, deletedIds],
  )

  const handleUserDeleted = (userId: string) => {
    setDeletedIds(prev => {
      const next = new Set(prev)
      next.add(userId)
      return next
    })
    void refetch()
  }

  if (selectedUser) {
    return (
      <UsuarioDetail
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
        onUserChanged={() => { void refetch() }}
      />
    )
  }

  return (
    <div className="section-stack">
      <UsuariosList
        users={displayedUsers}
        loading={loading}
        onSelectUser={setSelectedUser}
        onCreateClick={() => setCrearOpen(true)}
        onUserChanged={() => { void refetch() }}
        onUserDeleted={handleUserDeleted}
      />

      <CrearUsuarioModal
        open={crearOpen}
        onClose={() => setCrearOpen(false)}
        onCreated={() => { void refetch() }}
      />
    </div>
  )
}
