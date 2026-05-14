/**
 * useBlogPosts — hook público.
 * Lee artículos publicados de Supabase. La policy RLS filtra automáticamente
 * a status='published' para anon/authenticated.
 * Lo consumen BlogPage y BlogPostPage (filtrando por slug en cliente).
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { BlogPost } from '../types/blog'

interface State {
  data: BlogPost[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useBlogPosts(): State {
  const [data, setData]       = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false })
    if (error) {
      console.error('[useBlogPosts]', error)
      setError(error.message)
      setLoading(false)
      return
    }
    setData((data ?? []) as BlogPost[])
    setLoading(false)
  }, [])

  useEffect(() => { void refetch() }, [refetch])

  return { data, loading, error, refetch }
}

/** Busca un post por slug. Devuelve `null` si no existe o aún cargando. */
export function useBlogPostBySlug(slug: string): { data: BlogPost | null; loading: boolean; error: string | null } {
  const { data, loading, error } = useBlogPosts()
  const found = data.find(p => p.slug === slug) ?? null
  return { data: found, loading, error }
}
