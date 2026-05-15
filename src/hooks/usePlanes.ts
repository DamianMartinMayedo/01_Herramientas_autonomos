import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { PlanConfig } from '../types/plan'

interface UsePlanesReturn {
  planes: PlanConfig[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function usePlanes(): UsePlanesReturn {
  const [planes, setPlanes] = useState<PlanConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlanes = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('planes')
      .select('*')
      .order('precio_mensual', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setPlanes((data ?? []) as PlanConfig[])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchPlanes()
  }, [fetchPlanes])

  return { planes, loading, error, refetch: fetchPlanes }
}
