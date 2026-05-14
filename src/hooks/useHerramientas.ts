/**
 * useHerramientas — hook público.
 * Lee el catálogo de herramientas de Supabase. RLS permite SELECT a anon.
 * Lo consumen: HomePage, OverviewSection, AnalyticsSection, ToolAccessGuard,
 * PlanBadge, EstadoBadge, UserLayout sidebar, UserDashboard…
 *
 * Implementación con singleton a nivel de módulo: una sola consulta + un solo
 * canal Realtime para todas las instancias. Necesario porque Supabase no
 * admite más de un canal con el mismo nombre simultáneamente.
 */
import { useEffect, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { Herramienta } from '../types/herramienta'

interface CacheState {
  data: Herramienta[]
  loading: boolean
  error: string | null
}

let cache: CacheState = { data: [], loading: true, error: null }
const subscribers = new Set<() => void>()
let channel: RealtimeChannel | null = null
let initialFetch: Promise<void> | null = null
let debounceId: ReturnType<typeof setTimeout> | null = null

function notify() {
  for (const fn of subscribers) fn()
}

async function refetchAll() {
  const { data, error } = await supabase
    .from('herramientas')
    .select('*')
    .order('orden', { ascending: true })
  cache = error
    ? { data: cache.data, loading: false, error: error.message }
    : { data: (data ?? []) as Herramienta[], loading: false, error: null }
  if (error) console.error('[useHerramientas]', error)
  notify()
}

function ensureChannel() {
  if (channel) return
  channel = supabase
    .channel('herramientas-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'herramientas' },
      () => {
        if (debounceId) clearTimeout(debounceId)
        debounceId = setTimeout(() => { void refetchAll() }, 200)
      },
    )
    .subscribe()
}

function teardownIfIdle() {
  if (subscribers.size > 0) return
  if (debounceId) { clearTimeout(debounceId); debounceId = null }
  if (channel) { void supabase.removeChannel(channel); channel = null }
  initialFetch = null
}

interface State {
  data: Herramienta[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useHerramientas(): State {
  // Forzamos re-render con un objeto "tick"; los datos vienen del cache.
  const [, setTick] = useState(0)

  useEffect(() => {
    const sub = () => setTick(t => t + 1)
    subscribers.add(sub)
    ensureChannel()
    if (!initialFetch) initialFetch = refetchAll()
    return () => {
      subscribers.delete(sub)
      teardownIfIdle()
    }
  }, [])

  return {
    data: cache.data,
    loading: cache.loading,
    error: cache.error,
    refetch: refetchAll,
  }
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

