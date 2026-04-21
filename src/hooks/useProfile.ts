import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Profile, ProfileUpdate } from '../types/profile'
import { useAuth } from './useAuth'

// ============================================
// HOOK: useProfile
// Carga y gestiona el perfil del usuario
// autenticado desde la tabla `profiles`
// ============================================

interface UseProfileReturn {
  profile: Profile | null
  loading: boolean
  error: string | null
  updateProfile: (data: ProfileUpdate) => Promise<{ error: string | null }>
  refetch: () => void
}

export function useProfile(): UseProfileReturn {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setProfile(data as Profile)
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const updateProfile = async (data: ProfileUpdate) => {
    if (!user) return { error: 'No hay sesión activa' }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (!updateError) {
      setProfile(prev => prev ? { ...prev, ...data } : null)
    }

    return { error: updateError?.message ?? null }
  }

  return { profile, loading, error, updateProfile, refetch: fetchProfile }
}
