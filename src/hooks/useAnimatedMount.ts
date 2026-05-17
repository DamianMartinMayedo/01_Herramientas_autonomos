/**
 * useAnimatedMount — mantiene un elemento en el DOM mientras dura su
 * transición de salida. Devuelve dos flags:
 *   - mounted: true si debe renderizarse (ahora o desmontándose).
 *   - active:  true si debe estar visible (clase .is-open / aria-expanded).
 *
 * Patrón típico (drawer, modal con slide):
 *
 *   const { mounted, active } = useAnimatedMount(isOpen)
 *   if (!mounted) return null
 *   return <div className={`drawer${active ? ' is-open' : ''}`}>…</div>
 *
 * El CSS aplica el estado base (oculto) y `.is-open` (visible) con
 * `transition`, así la animación ocurre tanto al entrar como al salir.
 */
import { useEffect, useState } from 'react'

export function useAnimatedMount(isOpen: boolean, durationMs = 260) {
  const [mounted, setMounted] = useState(isOpen)
  const [active, setActive] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      // doble RAF: garantiza que el navegador pinta el estado inicial antes
      // de marcar active=true, para que la transición se dispare.
      let raf2 = 0
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setActive(true))
      })
      return () => {
        cancelAnimationFrame(raf1)
        if (raf2) cancelAnimationFrame(raf2)
      }
    }
    setActive(false)
    const t = window.setTimeout(() => setMounted(false), durationMs)
    return () => window.clearTimeout(t)
  }, [isOpen, durationMs])

  return { mounted, active }
}
