/**
 * Herramienta — tipo del catálogo de herramientas de la plataforma.
 * Refleja 1:1 las columnas de la tabla public.herramientas en Supabase.
 */
export type HerramientaCategoria = 'documentos' | 'contratos' | 'calculadoras'
export type PlanRequired = 'free' | 'premium'

export interface Herramienta {
  id: string
  nombre: string
  ruta: string
  descripcion: string
  categoria: HerramientaCategoria
  activa: boolean
  visible: boolean
  proximamente: boolean
  mantenimiento: boolean
  plan_required: PlanRequired
  anon_available: boolean
  orden: number
  created_at: string
  updated_at: string
}
