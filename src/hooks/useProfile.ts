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
  plan: Profile['plan'] | null
  isPremium: boolean
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

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        await supabase.auth.signOut()
        return
      }
      setError(fetchError.message)
    } else {
      setProfile(data as Profile)
    }
  }, [user])

  useEffect(() => {
    let active = true

    async function run() {
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!active) return

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          await supabase.auth.signOut()
          return
        }
        setError(fetchError.message)
      } else {
        setProfile(data as Profile)
      }

      setLoading(false)
    }

    void run()

    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && user) {
        void fetchProfile()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [user, fetchProfile])

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

  const plan = profile?.plan ?? null
  const isPremium = plan === 'premium'

  return { profile, plan, isPremium, loading, error, updateProfile, refetch: fetchProfile }
}
