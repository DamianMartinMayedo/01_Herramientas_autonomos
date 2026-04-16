/**
 * adminStore.ts
 * Estado global del panel de administración.
 *
 * Arquitectura local→cloud:
 *   - Ahora:     Zustand + localStorage (persist)
 *   - En cloud:  Reemplazar las acciones de blog/herramientas con llamadas a
 *               Supabase (o cualquier API REST). La interfaz de tipos no cambia.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'

/* ── Tipos ──────────────────────────────────────────────────────────────── */

export interface Herramienta {
  id: string
  nombre: string
  ruta: string
  activa: boolean
  proximamente: boolean
  mantenimiento?: boolean
  visible?: boolean
  descripcion: string
  categoria: 'documentos' | 'calculadoras' | 'contratos'
  usosRegistrados: number
}

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

  // ── Herramientas ──
  herramientas: Herramienta[]
  toggleHerramienta: (id: string) => void
  updateHerramienta: (id: string, data: Partial<Herramienta>) => void

  // ── Eventos locales (actividad propia) ──
  events: LocalEvent[]
  pushEvent: (tipo: LocalEvent['tipo'], herramienta?: string) => void
  clearOldEvents: () => void
}

/* ── Herramientas por defecto ───────────────────────────────────────────── */
const HERRAMIENTAS_DEFAULT: Herramienta[] = [
  // ── Documentos ──
  { id: 'factura',      nombre: 'Generador de facturas',      ruta: '/factura',      activa: true,  proximamente: false, visible: true,  descripcion: 'Crea facturas con IVA e IRPF y descárgalas en PDF al instante.',            categoria: 'documentos',   usosRegistrados: 0 },
  { id: 'presupuesto',  nombre: 'Generador de presupuestos',  ruta: '/presupuesto',  activa: true,  proximamente: false, visible: true,  descripcion: 'Envía presupuestos profesionales a tus clientes en minutos.',            categoria: 'documentos',   usosRegistrados: 0 },
  { id: 'albaran',      nombre: 'Generador de albarán',       ruta: '/albaran',      activa: false, proximamente: true,  visible: true,  descripcion: 'Genera albaranes de entrega vinculados a tus presupuestos y facturas.', categoria: 'documentos',   usosRegistrados: 0 },
  // ── Contratos y acuerdos ──
  { id: 'contrato',     nombre: 'Generador de contratos',     ruta: '/contrato',     activa: false, proximamente: true,  visible: true,  descripcion: 'Crea contratos de servicios personalizados listos para firmar.',           categoria: 'contratos',    usosRegistrados: 0 },
  { id: 'nda',          nombre: 'Generador de NDA',           ruta: '/nda',          activa: false, proximamente: true,  visible: true,  descripcion: 'Acuerdos de confidencialidad (NDA) profesionales en minutos.',            categoria: 'contratos',    usosRegistrados: 0 },
  { id: 'reclamacion',  nombre: 'Reclamación de pago',        ruta: '/reclamacion',  activa: false, proximamente: true,  visible: true,  descripcion: 'Carta formal para reclamar facturas impagadas a tus clientes.',           categoria: 'contratos',    usosRegistrados: 0 },
  // ── Calculadoras ──
  { id: 'cuota-autonomos', nombre: 'Cuota de autónomos', ruta: '/cuota-autonomos', activa: false, proximamente: true,  visible: true,  descripcion: 'Calcula tu cuota mensual según tus ingresos netos reales.',              categoria: 'calculadoras', usosRegistrados: 0 },
  { id: 'precio-hora',     nombre: 'Precio por hora',    ruta: '/precio-hora',     activa: false, proximamente: true,  visible: true,  descripcion: 'Fija tu tarifa sin venderte por debajo de coste.',                       categoria: 'calculadoras', usosRegistrados: 0 },
  { id: 'iva-irpf',        nombre: 'IVA / IRPF',         ruta: '/iva-irpf',        activa: false, proximamente: true,  visible: true,  descripcion: 'Separa base imponible, IVA e IRPF de cualquier importe.',                categoria: 'calculadoras', usosRegistrados: 0 },
]

/* ── Contraseña por defecto ─────────────────────────────────────────────── */
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN ?? 'admin1234'

/* ── Store ──────────────────────────────────────────────────────────────── */
export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      /* ── Auth ─────────────────────────────────────────────────────────── */
      isAuthenticated: false,

      login: (pin) => {
        if (pin === ADMIN_PIN) {
          set({ isAuthenticated: true })
          return true
        }
        return false
      },

      logout: () => set({ isAuthenticated: false }),

      /* ── Herramientas ─────────────────────────────────────────────────── */
      herramientas: HERRAMIENTAS_DEFAULT,

      toggleHerramienta: (id) =>
        set((s) => ({
          herramientas: s.herramientas.map((h) => {
            if (h.id === id) {
              const nuevaActiva = !h.activa
              let props: Partial<Herramienta> = {}
              if (nuevaActiva) {
                props = { proximamente: false, mantenimiento: false }
              } else {
                if (!h.proximamente && !h.mantenimiento) {
                  props = { mantenimiento: true }
                }
              }
              return { 
                ...h, 
                activa: nuevaActiva,
                ...props
              }
            }
            return h
          }),
        })),

      updateHerramienta: (id, data) =>
        set((s) => ({
          herramientas: s.herramientas.map((h) =>
            h.id === id ? { ...h, ...data } : h
          ),
        })),

      /* ── Eventos locales ──────────────────────────────────────────────── */
      events: [],

      pushEvent: (tipo, herramienta) => {
        const event: LocalEvent = {
          id: nanoid(8),
          tipo,
          herramienta,
          timestamp: new Date().toISOString(),
        }
        set((s) => ({
          events: [event, ...s.events].slice(0, 500),
          herramientas: herramienta
            ? s.herramientas.map((h) =>
                h.id === herramienta
                  ? { ...h, usosRegistrados: h.usosRegistrados + 1 }
                  : h
              )
            : s.herramientas,
        }))
      },

      clearOldEvents: () => {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 30)
        set((s) => ({
          events: s.events.filter((e) => new Date(e.timestamp) > cutoff),
        }))
      },
    }),
    {
      name: 'ha-admin',
      merge: (persistedState: unknown, currentState: AdminState): AdminState => {
        const persisted = persistedState as Partial<AdminState>
        const mergedHerramientas = HERRAMIENTAS_DEFAULT.map((defaultH) => {
          const saved = (persisted.herramientas ?? []).find((h) => h.id === defaultH.id)
          // Mantiene activa/proximamente/visible del store guardado, pero añade campos nuevos del default
          return saved ? { ...defaultH, ...saved } : defaultH
        })
        return {
          ...currentState,
          ...persisted,
          herramientas: mergedHerramientas,
        }
      },
    }
  )
)

/* ── Helpers de Analytics ───────────────────────────────────────────────── */

/** Dispara un evento GA4 si el SDK está cargado */
export function trackGA(eventName: string, params?: Record<string, unknown>) {
  type GtagFn = (command: 'event', eventName: string, params?: Record<string, unknown>) => void
  const win = window as unknown as { gtag?: GtagFn }
  if (typeof window !== 'undefined' && typeof win.gtag === 'function') {
    win.gtag('event', eventName, params)
  }
}
