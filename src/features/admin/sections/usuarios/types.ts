export type UserProfile = {
  id: string
  email: string
  created_at: string
  plan?: string
}

export type Factura = {
  id: string
  numero: string
  fecha: string
  total: number
  estado: string
  cliente_nombre: string
  datos_json: unknown
  user_id: string
}
