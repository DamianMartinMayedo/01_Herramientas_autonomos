export interface PlanConfig {
  id: string
  nombre: string
  precio_mensual: number
  descuento_mensual_pct: number
  precio_anual: number | null
  descuento_anual_pct: number
  dias_prueba: number
  descripcion: string | null
  activo: boolean
}
