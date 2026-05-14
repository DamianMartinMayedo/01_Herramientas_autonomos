/**
 * adminStore.ts
 * Estado local del panel: auth por PIN y registro de eventos del propio device.
 *
 * El catálogo de herramientas ya vive en Supabase (tabla `herramientas`); este
 * store solo guarda la sesión admin y los eventos de uso del dispositivo actual.
 * Los conteos por herramienta se derivan del array `events` en los componentes
 * que los necesitan (Overview/Analytics).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'

export interface LocalEvent {
  id: string
  tipo: 'pageview' | 'tool_use' | 'pdf_export' | 'presupuesto_to_factura'
  herramienta?: string
  timestamp: string
}

interface AdminState {
  // ── Auth ──
  isAuthenticated: boolean
  login: (pin: string) => boolean
  logout: () => void

  // ── Eventos locales (actividad del propio device) ──
  events: LocalEvent[]
  pushEvent: (tipo: LocalEvent['tipo'], herramienta?: string) => void
  clearOldEvents: () => void
}

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN ?? 'admin1234'

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      isAuthenticated: false,

      login: (pin) => {
        if (pin === ADMIN_PIN) {
          set({ isAuthenticated: true })
          return true
        }
        return false
      },

      logout: () => set({ isAuthenticated: false }),

      events: [],

      pushEvent: (tipo, herramienta) => {
        const event: LocalEvent = {
          id: nanoid(8),
          tipo,
          herramienta,
          timestamp: new Date().toISOString(),
        }
        set((s) => ({ events: [event, ...s.events].slice(0, 500) }))
      },

      clearOldEvents: () => {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 30)
        set((s) => ({
          events: s.events.filter((e) => new Date(e.timestamp) > cutoff),
        }))
      },
    }),
    { name: 'ha-admin' },
  )
)

/** Dispara un evento GA4 si el SDK está cargado. */
export function trackGA(eventName: string, params?: Record<string, unknown>) {
  type GtagFn = (command: 'event', eventName: string, params?: Record<string, unknown>) => void
  const win = window as unknown as { gtag?: GtagFn }
  if (typeof window !== 'undefined' && typeof win.gtag === 'function') {
    win.gtag('event', eventName, params)
  }
}
