import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { PlanConfig } from '../types/plan'

interface UsePlanesReturn {
  planes: PlanConfig[]
  loading: boolean
  refreshing: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function usePlanes(): UsePlanesReturn {
  const [planes, setPlanes] = useState<PlanConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  const fetchPlanes = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    if (hasLoadedRef.current) setRefreshing(true)
    else setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('planes')
      .select('*')
      .order('precio_mensual', { ascending: true })
      .abortSignal(controller.signal)

    if (controller.signal.aborted) return

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setPlanes((data ?? []) as PlanConfig[])
      hasLoadedRef.current = true
    }

    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    void fetchPlanes()

    const channel = supabase
      .channel('planes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'planes' }, () => {
        void fetchPlanes()
      })
      .subscribe()

    return () => {
      abortRef.current?.abort()
      void supabase.removeChannel(channel)
    }
  }, [fetchPlanes])

  return { planes, loading, refreshing, error, refetch: fetchPlanes }
}
