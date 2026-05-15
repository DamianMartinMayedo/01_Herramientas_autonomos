/**
 * useDropdownPosition — posicionamiento estándar para dropdowns portalizados.
 *
 * Patrón único de la plataforma:
 *  - Portal a `document.body` con `position: fixed`.
 *  - Anclado a la derecha del botón disparador (`right`).
 *  - Abre hacia abajo por defecto; si no cabe en el viewport y hay espacio
 *    arriba, conmuta a anclaje inferior (abre hacia arriba).
 *  - Se cierra al hacer click fuera, scroll o resize.
 *
 * Uso:
 *   const dd = useDropdownPosition()
 *   <button ref={dd.buttonRef} onClick={dd.toggle} />
 *   {dd.open && dd.position && createPortal(
 *     <div ref={dd.menuRef} className="dropdown-menu" style={dd.menuStyle}>...</div>,
 *     document.body,
 *   )}
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

export interface DropdownPosition {
  top?: number
  bottom?: number
  right: number
}

const MARGIN = 8
const OFFSET = 4

export function useDropdownPosition() {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<DropdownPosition | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef   = useRef<HTMLDivElement   | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    setPosition(null)
  }, [])

  const toggle = useCallback(() => {
    setOpen(prev => {
      if (prev) {
        setPosition(null)
        return false
      }
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return false
      setPosition({ top: rect.bottom + OFFSET, right: window.innerWidth - rect.right })
      return true
    })
  }, [])

  /* Tras montar el menú, mide su altura y conmuta a anclaje inferior si se sale del viewport. */
  useLayoutEffect(() => {
    if (!open) return
    const btn  = buttonRef.current
    const menu = menuRef.current
    if (!btn || !menu) return
    const btnRect = btn.getBoundingClientRect()
    const menuH   = menu.offsetHeight
    const vh      = window.innerHeight

    const overflowsBottom = btnRect.bottom + OFFSET + menuH > vh - MARGIN
    const fitsAbove       = btnRect.top    - OFFSET - menuH > MARGIN

    setPosition(prev => {
      if (!prev) return prev
      if (overflowsBottom && fitsAbove) {
        if (prev.bottom !== undefined) return prev
        return { bottom: vh - btnRect.top + OFFSET, right: window.innerWidth - btnRect.right }
      }
      return prev
    })
  }, [open])

  /* Click fuera */
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (buttonRef.current?.contains(t)) return
      if (menuRef.current?.contains(t))   return
      close()
    }
    window.addEventListener('mousedown', onDoc)
    return () => window.removeEventListener('mousedown', onDoc)
  }, [open, close])

  /* Scroll/resize → cierra (evita quedar mal posicionado) */
  useEffect(() => {
    if (!open) return
    const onChange = () => close()
    window.addEventListener('scroll', onChange, true)
    window.addEventListener('resize', onChange)
    return () => {
      window.removeEventListener('scroll', onChange, true)
      window.removeEventListener('resize', onChange)
    }
  }, [open, close])

  const menuStyle = useMemo<React.CSSProperties | undefined>(() => {
    if (!position) return undefined
    return {
      position: 'fixed',
      top: position.top ?? 'auto',
      bottom: position.bottom ?? 'auto',
      right: position.right,
      margin: 0,
    }
  }, [position])

  return { open, position, buttonRef, menuRef, toggle, close, menuStyle }
}
