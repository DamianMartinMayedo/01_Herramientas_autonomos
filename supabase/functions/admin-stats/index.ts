import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const ADMIN_SECRET = Deno.env.get('ADMIN_CREATE_USER_SECRET') ?? ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

const DOC_TABLES = ['facturas', 'presupuestos', 'albaranes', 'contratos', 'ndas', 'reclamaciones'] as const

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const secret = req.headers.get('x-admin-secret') ?? ''
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) return json({ error: 'Unauthorized' }, 401)

  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)

  const supabase = adminClient()

  // Cargar profiles y, de cada tabla documental, solo user_id (para top-users).
  const profilesRes = await supabase.from('profiles').select('id, email, plan, created_at')
  if (profilesRes.error) return json({ error: profilesRes.error.message }, 400)
  const profiles = profilesRes.data ?? []

  const docRows = await Promise.all(
    DOC_TABLES.map(t => supabase.from(t).select('user_id'))
  )
  for (const r of docRows) if (r.error) return json({ error: r.error.message }, 400)

  // Facturas: además del user_id necesitamos total/estado para los ingresos.
  const facturasFull = await supabase.from('facturas').select('user_id, total, estado')
  if (facturasFull.error) return json({ error: facturasFull.error.message }, 400)
  const facturas = facturasFull.data ?? []

  // Posts del blog: total + publicados/draft.
  const postsRes = await supabase.from('blog_posts').select('id, status')
  if (postsRes.error) return json({ error: postsRes.error.message }, 400)
  const posts = postsRes.data ?? []

  // ── Usuarios ────────────────────────────────────────────────
  const now = Date.now()
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  const usersTotal   = profiles.length
  const usersPremium = profiles.filter(p => p.plan === 'premium').length
  const usersFree    = usersTotal - usersPremium
  const usersNew7d   = profiles.filter(p => new Date(p.created_at).getTime() > sevenDaysAgo).length

  // ── Documentos por tipo ────────────────────────────────────
  const docCounts: Record<string, number> = {}
  DOC_TABLES.forEach((t, i) => { docCounts[t] = docRows[i].data?.length ?? 0 })
  const docTotal = Object.values(docCounts).reduce((a, n) => a + n, 0)

  // ── Facturas: estados e ingresos ───────────────────────────
  let emitidas = 0, cobradas = 0, ingresosCobrados = 0, pendienteCobro = 0
  for (const f of facturas) {
    const est = (f as { estado?: string }).estado
    const tot = Number((f as { total?: number | string }).total ?? 0)
    if (est === 'emitida' || est === 'cobrada') emitidas += 1
    if (est === 'cobrada') { cobradas += 1; ingresosCobrados += tot }
    if (est === 'emitida') pendienteCobro += tot
  }

  // ── Top 5 usuarios por número total de documentos ──────────
  const perUser: Record<string, number> = {}
  for (const r of docRows) {
    for (const row of r.data ?? []) {
      const uid = (row as { user_id: string }).user_id
      perUser[uid] = (perUser[uid] ?? 0) + 1
    }
  }
  const profileById = new Map(profiles.map(p => [p.id, p]))
  const topUsers = Object.entries(perUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => {
      const p = profileById.get(id)
      return {
        id,
        email: p?.email ?? '(usuario eliminado)',
        plan: p?.plan ?? 'free',
        documents: count,
      }
    })

  return json({
    users: { total: usersTotal, premium: usersPremium, free: usersFree, new_7d: usersNew7d },
    documents: { total: docTotal, ...docCounts },
    facturas: { emitidas, cobradas, ingresos_cobrados: ingresosCobrados, pendiente_cobro: pendienteCobro },
    posts: { total: posts.length, published: posts.filter(p => p.status === 'published').length, draft: posts.filter(p => p.status === 'draft').length },
    top_users: topUsers,
  }, 200)
})
