/**
 * useHerramientas — hook público.
 * Lee el catálogo de herramientas de Supabase. RLS permite SELECT a anon.
 * Lo consumen: HomePage, OverviewSection, AnalyticsSection y ToolAccessGuard.
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Herramienta } from '../types/herramienta'

interface State {
  data: Herramienta[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useHerramientas(): State {
  const [data, setData]       = useState<Herramienta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('herramientas')
      .select('*')
      .order('orden', { ascending: true })
    if (error) {
      console.error('[useHerramientas]', error)
      setError(error.message)
      setLoading(false)
      return
    }
    setData((data ?? []) as Herramienta[])
    setLoading(false)
  }, [])

  useEffect(() => { void refetch() }, [refetch])

  return { data, loading, error, refetch }
}

/**
 * Variante por id (útil en ToolAccessGuard y páginas individuales).
 * Reutiliza la consulta global; filtra en cliente para evitar n+1.
 */
export function useHerramienta(id: string): { data: Herramienta | null; loading: boolean; error: string | null } {
  const { data, loading, error } = useHerramientas()
  const found = data.find(h => h.id === id) ?? null
  return { data: found, loading, error }
}
