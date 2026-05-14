export type Plan = 'free' | 'premium'

export type UserProfile = {
  id: string
  email: string
  created_at: string
  plan?: Plan | string
  last_sign_in_at?: string | null
  documents_count?: number
  banned_until?: string | null
}

export type Factura = {
  id: string
  numero: string | null
  fecha: string
  total: number
  estado: string
  cliente_nombre: string | null
  datos_json: unknown
  user_id: string
}

/* ── Payload de admin-user-detail ──────────────────────────── */

export interface EmpresaInfo {
  id: string
  nombre: string | null
  nif: string | null
  email: string | null
  direccion: string | null
  cp: string | null
  ciudad: string | null
  provincia: string | null
  telefono: string | null
  created_at: string
  updated_at: string
}

export interface UserDetailPayload {
  profile: { id: string; email: string; plan: Plan; created_at: string }
  auth:    { last_sign_in_at: string | null; email_confirmed_at: string | null; banned_until: string | null }
  empresa: EmpresaInfo | null
  counts:  { facturas: number; presupuestos: number; albaranes: number; contratos: number; ndas: number; reclamaciones: number; total: number }
  facturas:      Array<{ id: string; numero: string | null; fecha: string; cliente_nombre: string | null; total: number; estado: string }>
  presupuestos:  Array<{ id: string; numero: string | null; fecha: string; cliente_nombre: string | null; total: number; estado: string }>
  albaranes:     Array<{ id: string; numero: string | null; fecha: string; cliente_nombre: string | null; estado: string }>
  contratos:     Array<{ id: string; numero: string | null; fecha: string; titulo: string | null; cliente_nombre: string | null; estado: string }>
  ndas:          Array<{ id: string; numero: string | null; fecha: string; titulo: string | null; otra_parte_nombre: string | null; estado: string }>
  reclamaciones: Array<{ id: string; numero: string | null; fecha: string; titulo: string | null; estado: string }>
  totales_facturas: { ingresos_cobrados: number; pendiente_cobro: number }
}

export type DocTipo = 'facturas' | 'presupuestos' | 'albaranes' | 'contratos' | 'ndas' | 'reclamaciones'
