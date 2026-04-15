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

export type BlogStatus = 'draft' | 'published'

export interface BlogPost {
  id: string
  titulo: string
  slug: string
  extracto: string
  contenido: string   // Markdown / HTML raw
  tags: string[]
  status: BlogStatus
  createdAt: string   // ISO date
  updatedAt: string
  publishedAt: string | null
}

export interface Herramienta {
  id: string
  nombre: string
  ruta: string
  activa: boolean
  proximamente: boolean
  descripcion: string
  categoria: 'documentos' | 'calculadoras'
  usosRegistrados: number  // contador local
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

  // ── Blog ──
  posts: BlogPost[]
  createPost: (data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) => BlogPost
  updatePost: (id: string, data: Partial<BlogPost>) => void
  deletePost: (id: string) => void
  publishPost: (id: string) => void
  unpublishPost: (id: string) => void

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
  { id: 'factura', nombre: 'Generador de facturas', ruta: '/factura', activa: true, proximamente: false, descripcion: 'Crea facturas con IVA e IRPF y descárgalas en PDF al instante.', categoria: 'documentos', usosRegistrados: 0 },
  { id: 'presupuesto', nombre: 'Generador de presupuestos', ruta: '/presupuesto', activa: true, proximamente: false, descripcion: 'Envía presupuestos profesionales a tus clientes en minutos.', categoria: 'documentos', usosRegistrados: 0 },
  { id: 'cuota-autonomos', nombre: 'Cuota de autónomos', ruta: '/cuota-autonomos', activa: false, proximamente: true, descripcion: 'Calcula tu cuota mensual según tus ingresos netos reales.', categoria: 'calculadoras', usosRegistrados: 0 },
  { id: 'precio-hora', nombre: 'Precio por hora', ruta: '/precio-hora', activa: false, proximamente: true, descripcion: 'Fija tu tarifa sin venderte por debajo de coste.', categoria: 'calculadoras', usosRegistrados: 0 },
  { id: 'iva-irpf', nombre: 'IVA / IRPF', ruta: '/iva-irpf', activa: false, proximamente: true, descripcion: 'Separa base imponible, IVA e IRPF de cualquier importe.', categoria: 'calculadoras', usosRegistrados: 0 },
]

/* ── Contraseña por defecto ─────────────────────────────────────────────── */
// En producción: define VITE_ADMIN_PIN en tu .env
// En Vercel/Netlify: añade VITE_ADMIN_PIN en las variables de entorno
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN ?? 'admin1234'

/* ── Store ──────────────────────────────────────────────────────────────── */
export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
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

      /* ── Blog ─────────────────────────────────────────────────────────── */
      posts: [],

      createPost: (data) => {
        const post: BlogPost = {
          ...data,
          id: nanoid(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((s) => ({ posts: [post, ...s.posts] }))
        return post
      },

      updatePost: (id, data) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        })),

      deletePost: (id) =>
        set((s) => ({ posts: s.posts.filter((p) => p.id !== id) })),

      publishPost: (id) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === id
              ? { ...p, status: 'published', publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      unpublishPost: (id) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === id ? { ...p, status: 'draft', updatedAt: new Date().toISOString() } : p
          ),
        })),

      /* ── Herramientas ─────────────────────────────────────────────────── */
      herramientas: HERRAMIENTAS_DEFAULT,

      toggleHerramienta: (id) =>
        set((s) => ({
          herramientas: s.herramientas.map((h) =>
            h.id === id ? { ...h, activa: !h.activa } : h
          ),
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
          events: [event, ...s.events].slice(0, 500), // máximo 500 eventos locales
          // Incrementar contador de la herramienta si aplica
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

      /* ── Selector helpers (no son acciones, solo getters derivados) ───── */
    }),
    {
      name: 'ha-admin',
      // Nota cloud: reemplaza `storage` con una implementación de Supabase:
      // storage: createSupabaseStorage()
    }
  )
)

/* ── Helpers de Analytics ───────────────────────────────────────────────── */

/** Dispara un evento GA4 si el SDK está cargado */
export function trackGA(eventName: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: Function }).gtag) {
    ;(window as unknown as { gtag: Function }).gtag('event', eventName, params)
  }
}
