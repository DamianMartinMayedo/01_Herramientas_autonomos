import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const ADMIN_SECRET = Deno.env.get('ADMIN_CREATE_USER_SECRET') ?? ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

const ALLOWED_FIELDS = new Set([
  'nombre', 'precio_mensual', 'descuento_mensual_pct',
  'descuento_anual_pct', 'dias_prueba',
  'descripcion', 'features', 'activo',
])

const VALIDATORS: Record<string, (v: unknown) => string | null> = {
  nombre: (v) => typeof v === 'string' && v.trim().length > 0 && v.length <= 60
    ? null : 'nombre debe ser un texto de 1 a 60 caracteres',
  precio_mensual: (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0
    ? null : 'precio_mensual debe ser un número ≥ 0',
  descuento_mensual_pct: (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100
    ? null : 'descuento_mensual_pct debe estar entre 0 y 100',
  descuento_anual_pct: (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 100
    ? null : 'descuento_anual_pct debe estar entre 0 y 100',
  dias_prueba: (v) => typeof v === 'number' && Number.isInteger(v) && v >= 0
    ? null : 'dias_prueba debe ser un entero ≥ 0',
  descripcion: (v) => v === null || (typeof v === 'string' && v.length <= 280)
    ? null : 'descripcion debe ser texto de hasta 280 caracteres',
  features: (v) => {
    if (!Array.isArray(v)) return 'features debe ser un array'
    if (v.length > 12) return 'features admite máximo 12 elementos'
    for (const item of v) {
      if (typeof item !== 'string') return 'features debe contener solo texto'
      if (item.length === 0 || item.length > 120) return 'cada feature debe tener entre 1 y 120 caracteres'
    }
    return null
  },
  activo: (v) => typeof v === 'boolean'
    ? null : 'activo debe ser true o false',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const secret = req.headers.get('x-admin-secret') ?? ''
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) return json({ error: 'Unauthorized' }, 401)

  const supabase = adminClient()

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('planes')
      .select('*')
      .order('precio_mensual', { ascending: true })
    if (error) return json({ error: error.message }, 400)
    return json({ planes: data ?? [] }, 200)
  }

  if (req.method === 'PATCH') {
    let body: Record<string, unknown>
    try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

    const id = body.id
    if (typeof id !== 'string' || !id) return json({ error: 'id es obligatorio' }, 400)

    const patch: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(body)) {
      if (k === 'id') continue
      if (!ALLOWED_FIELDS.has(k)) continue
      const validator = VALIDATORS[k]
      if (validator) {
        const err = validator(v)
        if (err) return json({ error: err, field: k }, 400)
      }
      patch[k] = v
    }
    if (Object.keys(patch).length === 0) return json({ error: 'Sin cambios' }, 400)

    const { data, error } = await supabase
      .from('planes')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) return json({ error: error.message }, 400)
    return json({ plan: data }, 200)
  }

  return json({ error: 'Method not allowed' }, 405)
})
