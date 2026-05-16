import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

interface VerifactuRegistroStatus {
  registered: boolean
  loading: boolean
  refetch: () => void
}

/**
 * Comprueba si una factura concreta tiene un registro VeriFactu de tipo 'alta'.
 * Devuelve { registered: false, loading: false } si no se pasa facturaId.
 */
export function useVerifactuRegistro(facturaId?: string | null): VerifactuRegistroStatus {
  const [registered, setRegistered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!facturaId) {
      setRegistered(false)
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    supabase
      .from('verifactu_registros')
      .select('id')
      .eq('factura_id', facturaId)
      .eq('tipo_registro', 'alta')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return
        setRegistered(!!data)
        setLoading(false)
      })

    return () => { active = false }
  }, [facturaId, tick])

  const refetch = useCallback(() => setTick((n) => n + 1), [])

  return { registered, loading, refetch }
}
