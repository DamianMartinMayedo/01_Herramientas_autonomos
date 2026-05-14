import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const ADMIN_SECRET = Deno.env.get('ADMIN_CREATE_USER_SECRET') ?? ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } })
}

function adminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

type Action =
  | 'set-plan'
  | 'resend-confirmation'
  | 'reset-password'
  | 'ban'
  | 'unban'
  | 'delete'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const secret = req.headers.get('x-admin-secret') ?? ''
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) return json({ error: 'Unauthorized' }, 401)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: { id?: string; action?: Action; plan?: 'free' | 'premium'; hours?: number }
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }
  const { id, action } = body
  if (!id || !action) return json({ error: 'id y action son obligatorios' }, 400)

  const supabase = adminClient()

  // Necesitamos el email para los actions que generan link
  const userRes = await supabase.auth.admin.getUserById(id)
  if (userRes.error || !userRes.data?.user) return json({ error: 'Usuario no encontrado' }, 404)
  const email = userRes.data.user.email ?? ''

  if (action === 'set-plan') {
    const plan = body.plan
    if (plan !== 'free' && plan !== 'premium') return json({ error: 'plan inválido' }, 400)
    const { error } = await supabase.from('profiles').update({ plan }).eq('id', id)
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true, plan }, 200)
  }

  if (action === 'resend-confirmation') {
    if (!email) return json({ error: 'usuario sin email' }, 400)
    const { data, error } = await supabase.auth.admin.generateLink({ type: 'signup', email })
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true, link: data?.properties?.action_link ?? null }, 200)
  }

  if (action === 'reset-password') {
    if (!email) return json({ error: 'usuario sin email' }, 400)
    const { data, error } = await supabase.auth.admin.generateLink({ type: 'recovery', email })
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true, link: data?.properties?.action_link ?? null }, 200)
  }

  if (action === 'ban') {
    const hours = typeof body.hours === 'number' && body.hours > 0 ? body.hours : 8760
    const { error } = await supabase.auth.admin.updateUserById(id, { ban_duration: `${hours}h` })
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true, banned_for_hours: hours }, 200)
  }

  if (action === 'unban') {
    const { error } = await supabase.auth.admin.updateUserById(id, { ban_duration: 'none' })
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true }, 200)
  }

  if (action === 'delete') {
    const { error } = await supabase.auth.admin.deleteUser(id)
    if (error) return json({ error: error.message }, 400)
    return json({ ok: true }, 200)
  }

  return json({ error: 'Action no soportada' }, 400)
})
