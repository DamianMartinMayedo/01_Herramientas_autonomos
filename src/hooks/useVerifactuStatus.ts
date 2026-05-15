import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { getVerifactuConfig } from '../lib/verifactu'

interface VerifactuStatus {
  enabled: boolean
  loading: boolean
  authenticated: boolean
}

export function useVerifactuStatus(): VerifactuStatus {
  const { user, loading: authLoading } = useAuth()
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    if (authLoading) return
    if (!user) {
      setEnabled(false)
      setLoading(false)
      return
    }

    setLoading(true)
    getVerifactuConfig(user.id).then(({ data }) => {
      if (!active) return
      setEnabled(Boolean(data?.enabled && data?.cert_storage_path))
      setLoading(false)
    })

    return () => { active = false }
  }, [user, authLoading])

  return {
    enabled,
    loading: authLoading || loading,
    authenticated: !!user,
  }
}
