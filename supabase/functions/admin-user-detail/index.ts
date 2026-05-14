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

const LIMIT = 50

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const secret = req.headers.get('x-admin-secret') ?? ''
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) return json({ error: 'Unauthorized' }, 401)
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)

  const url = new URL(req.url)
  const id  = url.searchParams.get('id')
  if (!id) return json({ error: 'id es obligatorio' }, 400)

  const supabase = adminClient()

  const [profileRes, empresaRes, authRes, facturasRes, presupuestosRes, albaranesRes, contratosRes, ndasRes, reclamacionesRes] = await Promise.all([
    supabase.from('profiles').select('id, email, display_name, plan, created_at').eq('id', id).maybeSingle(),
    supabase.from('empresa').select('*').eq('id', id).maybeSingle(),
    supabase.auth.admin.getUserById(id),
    supabase.from('facturas')     .select('id, numero, fecha, cliente_nombre, total, estado').eq('user_id', id).order('fecha', { ascending: false }).limit(LIMIT),
    supabase.from('presupuestos') .select('id, numero, fecha, cliente_nombre, total, estado').eq('user_id', id).order('fecha', { ascending: false }).limit(LIMIT),
    supabase.from('albaranes')    .select('id, numero, fecha, cliente_nombre, estado')       .eq('user_id', id).order('fecha', { ascending: false }).limit(LIMIT),
    supabase.from('contratos')    .select('id, numero, fecha, titulo, cliente_nombre, estado').eq('user_id', id).order('fecha', { ascending: false }).limit(LIMIT),
    supabase.from('ndas')         .select('id, numero, fecha, titulo, otra_parte_nombre, estado').eq('user_id', id).order('fecha', { ascending: false }).limit(LIMIT),
    supabase.from('reclamaciones').select('id, numero, fecha, titulo, estado')               .eq('user_id', id).order('fecha', { ascending: false }).limit(LIMIT),
  ])

  if (profileRes.error) return json({ error: profileRes.error.message }, 400)
  if (!profileRes.data) return json({ error: 'Usuario no encontrado' }, 404)

  // Conteos exactos por tipo (independientes de LIMIT)
  const [cF, cP, cA, cC, cN, cR] = await Promise.all([
    supabase.from('facturas')     .select('id', { count: 'exact', head: true }).eq('user_id', id),
    supabase.from('presupuestos') .select('id', { count: 'exact', head: true }).eq('user_id', id),
    supabase.from('albaranes')    .select('id', { count: 'exact', head: true }).eq('user_id', id),
    supabase.from('contratos')    .select('id', { count: 'exact', head: true }).eq('user_id', id),
    supabase.from('ndas')         .select('id', { count: 'exact', head: true }).eq('user_id', id),
    supabase.from('reclamaciones').select('id', { count: 'exact', head: true }).eq('user_id', id),
  ])

  const counts = {
    facturas:      cF.count ?? 0,
    presupuestos:  cP.count ?? 0,
    albaranes:     cA.count ?? 0,
    contratos:     cC.count ?? 0,
    ndas:          cN.count ?? 0,
    reclamaciones: cR.count ?? 0,
    total: (cF.count ?? 0) + (cP.count ?? 0) + (cA.count ?? 0) + (cC.count ?? 0) + (cN.count ?? 0) + (cR.count ?? 0),
  }

  // Totales facturas: ingresos cobrados y pendiente de cobro
  const facturasFull = await supabase.from('facturas').select('total, estado').eq('user_id', id)
  let ingresosCobrados = 0, pendienteCobro = 0
  for (const f of facturasFull.data ?? []) {
    const t = Number((f as { total?: number }).total ?? 0)
    const e = (f as { estado?: string }).estado
    if (e === 'cobrada') ingresosCobrados += t
    if (e === 'emitida') pendienteCobro += t
  }

  const auth = authRes.data?.user ?? null

  return json({
    profile: profileRes.data,
    auth: {
      last_sign_in_at:    auth?.last_sign_in_at    ?? null,
      email_confirmed_at: auth?.email_confirmed_at ?? null,
      banned_until:       (auth as { banned_until?: string } | null)?.banned_until ?? null,
    },
    empresa: empresaRes.data ?? null,
    counts,
    facturas:      facturasRes.data ?? [],
    presupuestos:  presupuestosRes.data ?? [],
    albaranes:     albaranesRes.data ?? [],
    contratos:     contratosRes.data ?? [],
    ndas:          ndasRes.data ?? [],
    reclamaciones: reclamacionesRes.data ?? [],
    totales_facturas: { ingresos_cobrados: ingresosCobrados, pendiente_cobro: pendienteCobro },
  }, 200)
})
