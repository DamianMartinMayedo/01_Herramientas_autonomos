/**
 * useAdminFetch.ts
 * Hook genérico para llamar a edge functions / endpoints protegidos por
 * la cabecera x-admin-secret. Encapsula loading + error + manual refetch.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_CREATE_SECRET as string | undefined
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string

interface UseAdminFetchOptions<T> {
  /** Si false, no dispara el fetch automáticamente al montar. */
  auto?: boolean
  /** Transforma el body parseado antes de guardarlo en state. */
  transform?: (raw: unknown) => T
}

export interface AdminFetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * GET helper para edge functions. Path debe empezar con "/functions/v1/...".
 */
export function useAdminFetch<T>(path: string, options: UseAdminFetchOptions<T> = {}): AdminFetchState<T> {
  const { auto = true, transform } = options
  const [data, setData]       = useState<T | null>(null)
  const [loading, setLoading] = useState(auto)
  const [error, setError]     = useState<string | null>(null)
  const transformRef = useRef(transform)
  useEffect(() => { transformRef.current = transform }, [transform])

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${SUPABASE_URL}${path}`, {
        headers: { 'x-admin-secret': ADMIN_SECRET ?? '' },
      })
      const json = await res.json() as { error?: string } & Record<string, unknown>
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
      const next = transformRef.current ? transformRef.current(json) : (json as unknown as T)
      setData(next)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      console.error(`[useAdminFetch ${path}]`, err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => {
    if (auto) void refetch()
  }, [auto, refetch])

  return { data, loading, error, refetch }
}

/**
 * POST helper one-shot para edge functions protegidas con x-admin-secret.
 * Devuelve {ok, error, data} sin guardar estado entre llamadas.
 */
export async function adminPost<TResp = unknown>(path: string, body: unknown): Promise<{ ok: boolean; data: TResp | null; error: string | null }> {
  try {
    const res = await fetch(`${SUPABASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': ADMIN_SECRET ?? '',
      },
      body: JSON.stringify(body),
    })
    const json = await res.json() as { error?: string } & Record<string, unknown>
    if (!res.ok) return { ok: false, data: null, error: json.error ?? `HTTP ${res.status}` }
    return { ok: true, data: json as unknown as TResp, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error inesperado'
    return { ok: false, data: null, error: msg }
  }
}
