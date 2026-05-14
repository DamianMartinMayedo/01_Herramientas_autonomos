import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const ADMIN_SECRET = Deno.env.get('ADMIN_CREATE_USER_SECRET') ?? ''

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

const DOC_TABLES = ['facturas', 'presupuestos', 'albaranes', 'contratos', 'ndas', 'reclamaciones'] as const

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
      },
    })
  }

  const secret = req.headers.get('x-admin-secret') ?? ''
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) return json({ error: 'Unauthorized' }, 401)

  // GET /admin-create-user — listar usuarios con plan, último login y conteo de documentos
  if (req.method === 'GET') {
    const supabase = adminClient()
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    if (error) return json({ error: error.message }, 400)

    const ids = data.users.map(u => u.id)

    // Plan desde profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, plan')
      .in('id', ids)
    const planMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.plan]))

    // Conteo de documentos por usuario: cargar user_id de cada tabla y agregar.
    const docRows = await Promise.all(
      DOC_TABLES.map(t => supabase.from(t).select('user_id'))
    )
    const docsCountMap: Record<string, number> = {}
    for (const r of docRows) {
      for (const row of r.data ?? []) {
        const uid = (row as { user_id: string }).user_id
        docsCountMap[uid] = (docsCountMap[uid] ?? 0) + 1
      }
    }

    const users = data.users.map(u => ({
      id: u.id,
      email: u.email ?? '',
      created_at: u.created_at,
      plan: planMap[u.id] ?? 'free',
      last_sign_in_at: u.last_sign_in_at ?? null,
      documents_count: docsCountMap[u.id] ?? 0,
      banned_until: (u as { banned_until?: string }).banned_until ?? null,
    }))

    return json({ users }, 200)
  }

  // POST /admin-create-user — crear usuario
  if (req.method === 'POST') {
    let body: { email?: string; password?: string; plan?: string }
    try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

    const { email, password, plan = 'free' } = body
    if (!email || !password) return json({ error: 'email y password son obligatorios' }, 400)

    const supabase = adminClient()
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error) return json({ error: error.message }, 400)

    if (data.user && plan !== 'free') {
      await supabase.from('profiles').update({ plan }).eq('id', data.user.id)
    }

    return json({ id: data.user.id, email: data.user.email }, 200)
  }

  return json({ error: 'Method not allowed' }, 405)
})
