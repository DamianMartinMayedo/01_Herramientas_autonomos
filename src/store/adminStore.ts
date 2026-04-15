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

/* ── Artículo seed (se inyecta solo si no existe ya en localStorage) ────── */
const SEED_POST: BlogPost = {
  id: 'seed-iva-trimestral',
  titulo: 'Cómo presentar el IVA trimestral sin errores: guía práctica para autónomos',
  slug: 'como-presentar-iva-trimestral-autonomos',
  extracto: 'El modelo 303 es la declaración trimestral de IVA que todo autónomo debe presentar cuatro veces al año. En este artículo te explico paso a paso cómo cumplimentarlo correctamente, qué gastos puedes deducir y cómo evitar los errores más comunes.',
  contenido: `## ¿Qué es el modelo 303?

El **modelo 303** es la autoliquidación del IVA (Impuesto sobre el Valor Añadido) que los autónomos y empresas deben presentar trimestralmente ante la Agencia Tributaria (AEAT).

En él se declara la diferencia entre:

- **IVA repercutido**: el que has cobrado a tus clientes en tus facturas.
- **IVA soportado**: el que tú has pagado a tus proveedores y que puedes deducir.

Si el resultado es positivo, pagas a Hacienda. Si es negativo, puedes compensarlo en trimestres siguientes o solicitar la devolución al presentar el modelo 390 anual.

---

## Plazos de presentación

Los cuatro periodos trimestrales y sus fechas límite son:

- **1T (enero–marzo):** hasta el 20 de abril
- **2T (abril–junio):** hasta el 20 de julio
- **3T (julio–septiembre):** hasta el 20 de octubre
- **4T (octubre–diciembre):** hasta el 30 de enero del año siguiente

**Consejo:** domicilia el pago en cuenta desde el primer año. Hacienda te da 5 días extra de plazo cuando domicilias, y evitas olvidos.

---

## ¿Qué gastos puedes deducir?

El IVA de un gasto **solo es deducible si está directamente relacionado con tu actividad económica**. Algunos ejemplos habituales:

- Material de oficina y equipamiento informático
- Software y herramientas de trabajo (hosting, suscripciones SaaS)
- Publicidad y marketing digital
- Formación relacionada con tu actividad
- Teléfono y conexión a internet (proporción de uso profesional)
- Vehículo y combustible (con limitaciones — consulta a tu asesor)

**Importante:** si trabajas desde casa, la deducción del IVA de suministros (luz, agua, internet) está limitada al porcentaje de la vivienda destinado a la actividad. Este punto genera muchas inspecciones, así que documenta bien.

---

## Errores más comunes al rellenar el 303

1. **Incluir facturas sin fecha en el trimestre correcto.** Cada factura tributa en el trimestre en que se emite o recibe, no en el que se cobra o paga.
2. **Olvidar las facturas de gastos.** Muchos autónomos solo meten el IVA repercutido y olvidan el soportado. Revisa todas las facturas de proveedores del trimestre.
3. **Deducir el 100% del IVA de gastos mixtos.** Si usas el móvil o el coche tanto para trabajo como para uso personal, solo puedes deducir la parte proporcional al uso profesional.
4. **No presentar si el resultado es cero.** El modelo 303 es obligatorio aunque no tengas actividad o el resultado sea cero. La no presentación conlleva sanción.
5. **Aplicar el tipo incorrecto.** En España hay tres tipos: general (21%), reducido (10%) y superreducido (4%). Asegúrate de aplicar el correcto según el bien o servicio.

---

## Paso a paso: cómo presentarlo en la Sede Electrónica

1. Accede a la **Sede Electrónica de la AEAT** con certificado digital, Cl@ve o DNI electrónico.
2. Ve a *Trámites destacados → Modelo 303*.
3. Introduce tus datos de actividad y el ejercicio/periodo.
4. Rellena el **IVA devengado** (repercutido a clientes) en la casilla correspondiente según el tipo aplicado.
5. Rellena el **IVA deducible** (soportado de proveedores).
6. Comprueba el resultado en la casilla de liquidación.
7. Si el resultado es a pagar, domicilia o paga con NRC bancario antes del plazo.
8. Guarda el justificante de presentación en un lugar seguro.

---

## Herramienta recomendada

Si emites tus facturas con nuestra herramienta gratuita, el IVA repercutido queda registrado automáticamente, lo que facilita mucho el cálculo del trimestre. Cada factura descargada en PDF incluye la base imponible, el IVA y el total claramente diferenciados.`,
  tags: ['IVA', 'Modelo 303', 'Fiscalidad', 'Autónomos'],
  status: 'published',
  createdAt: '2025-10-01T10:00:00.000Z',
  updatedAt: '2025-10-01T10:00:00.000Z',
  publishedAt: '2025-10-01T10:00:00.000Z',
}

/* ── Contraseña por defecto ─────────────────────────────────────────────── */
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
      // El artículo seed se incluye como valor inicial.
      // Si ya existe en localStorage (misma id), persist no lo sobreescribe.
      posts: [SEED_POST],

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
      // Para migrar a Supabase: añadir `storage: createSupabaseStorage()` aquí.
      // La clave 'ha-admin' en localStorage permite inspeccionar el estado
      // directamente desde DevTools → Application → Local Storage.
      merge: (persistedState: unknown, currentState: AdminState): AdminState => {
        // Fusión inteligente: mantiene el artículo seed aunque ya exista en localStorage,
        // pero respeta todos los posts creados por el usuario.
        const persisted = persistedState as Partial<AdminState>
        const mergedPosts = persisted.posts ?? currentState.posts
        const seedExists = mergedPosts.some((p) => p.id === SEED_POST.id)
        return {
          ...currentState,
          ...persisted,
          posts: seedExists ? mergedPosts : [SEED_POST, ...mergedPosts],
        }
      },
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
