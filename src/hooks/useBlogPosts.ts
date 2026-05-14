/**
 * useBlogPosts — hook público.
 * Lee artículos publicados de Supabase. La policy RLS filtra automáticamente
 * a status='published' para anon/authenticated.
 *
 * Implementación con singleton a nivel de módulo: una sola consulta + un solo
 * canal Realtime para todas las instancias. Necesario porque Supabase no
 * admite más de un canal con el mismo nombre simultáneamente.
 */
import { useEffect, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import type { BlogPost } from '../types/blog'

interface CacheState {
  data: BlogPost[]
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
    .from('blog_posts')
    .select('*')
    .order('published_at', { ascending: false, nullsFirst: false })
  cache = error
    ? { data: cache.data, loading: false, error: error.message }
    : { data: (data ?? []) as BlogPost[], loading: false, error: null }
  if (error) console.error('[useBlogPosts]', error)
  notify()
}

function ensureChannel() {
  if (channel) return
  channel = supabase
    .channel('blog-posts-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'blog_posts' },
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
  data: BlogPost[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useBlogPosts(): State {
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

/** Busca un post por slug. Devuelve `null` si no existe o aún cargando. */
export function useBlogPostBySlug(slug: string): { data: BlogPost | null; loading: boolean; error: string | null } {
  const { data, loading, error } = useBlogPosts()
  const found = data.find(p => p.slug === slug) ?? null
  return { data: found, loading, error }
}
