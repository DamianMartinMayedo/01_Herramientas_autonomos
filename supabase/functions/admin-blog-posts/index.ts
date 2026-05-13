import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const ADMIN_SECRET = Deno.env.get('ADMIN_CREATE_USER_SECRET') ?? ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
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
  'titulo','slug','extracto','contenido','tags','status','published_at',
])

function sanitize(input: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input)) {
    if (ALLOWED_FIELDS.has(k)) out[k] = v
  }
  return out
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const secret = req.headers.get('x-admin-secret') ?? ''
  if (!ADMIN_SECRET || secret !== ADMIN_SECRET) return json({ error: 'Unauthorized' }, 401)

  const supabase = adminClient()
  const url = new URL(req.url)
  const pathname = url.pathname

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) return json({ error: error.message }, 400)
    return json({ posts: data ?? [] }, 200)
  }

  if (req.method === 'POST' && pathname.endsWith('/import')) {
    let body: { posts?: Array<Record<string, unknown>> }
    try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }
    const posts = body.posts ?? []
    if (!Array.isArray(posts) || posts.length === 0) return json({ error: 'posts vacíos' }, 400)

    const rows = posts.map(p => {
      const clean = sanitize(p as Record<string, unknown>)
      if (!clean.slug || typeof clean.slug !== 'string') return null
      return clean
    }).filter((r): r is Record<string, unknown> => r !== null)

    const { data, error } = await supabase
      .from('blog_posts')
      .upsert(rows, { onConflict: 'slug', ignoreDuplicates: true })
      .select()
    if (error) return json({ error: error.message }, 400)
    return json({ imported: data?.length ?? 0 }, 200)
  }

  if (req.method === 'POST') {
    let body: Record<string, unknown>
    try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }
    const clean = sanitize(body)
    if (!clean.titulo || !clean.slug) return json({ error: 'titulo y slug obligatorios' }, 400)

    const { data, error } = await supabase
      .from('blog_posts')
      .insert(clean)
      .select()
      .single()
    if (error) return json({ error: error.message }, 400)
    return json({ post: data }, 200)
  }

  if (req.method === 'PATCH') {
    let body: Record<string, unknown>
    try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }
    const id = body.id
    if (typeof id !== 'string' || !id) return json({ error: 'id es obligatorio' }, 400)

    const patch = sanitize(body)
    if (Object.keys(patch).length === 0) return json({ error: 'Sin cambios' }, 400)

    if (patch.status === 'published' && !patch.published_at) {
      patch.published_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) return json({ error: error.message }, 400)
    return json({ post: data }, 200)
  }

  if (req.method === 'DELETE') {
    const id = url.searchParams.get('id')
    if (!id) return json({ error: 'id es obligatorio' }, 400)
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (error) return json({ error: error.message }, 400)
    return json({ deleted: id }, 200)
  }

  return json({ error: 'Method not allowed' }, 405)
})
