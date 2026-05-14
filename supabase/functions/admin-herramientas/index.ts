import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const ADMIN_SECRET = Deno.env.get('ADMIN_CREATE_USER_SECRET') ?? ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, POST, OPTIONS',
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
  'nombre','ruta','descripcion','categoria','estado','visible',
  'plan_required','anon_available','orden',
])

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const secret = req.headers.get('x-admin-secret') ?? ''
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) return json({ error: 'Unauthorized' }, 401)

  const supabase = adminClient()

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('herramientas')
      .select('*')
      .order('orden', { ascending: true })
    if (error) return json({ error: error.message }, 400)
    return json({ herramientas: data ?? [] }, 200)
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
      patch[k] = v
    }
    if (Object.keys(patch).length === 0) return json({ error: 'Sin cambios' }, 400)

    // Si pasa a premium, anon_available no puede quedar en true.
    if (patch.plan_required === 'premium' && patch.anon_available !== false) {
      patch.anon_available = false
    }

    const { data, error } = await supabase
      .from('herramientas')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) return json({ error: error.message }, 400)
    return json({ herramienta: data }, 200)
  }

  return json({ error: 'Method not allowed' }, 405)
})
