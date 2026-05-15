import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'No autorizado' }, 401)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
  if (authError || !user) return json({ error: 'Sesión inválida' }, 401)

  // Solo permitir upgrade de free → premium
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  // Validar que el plan premium existe y está activo
  const { data: plan, error: planError } = await adminClient
    .from('planes')
    .select('id')
    .eq('id', 'premium')
    .eq('activo', true)
    .maybeSingle()

  if (planError) return json({ error: 'Error al verificar plan' }, 500)
  if (!plan) return json({ error: 'El plan Premium no está disponible en este momento' }, 410)

  // TODO: Integrar pasarela de pago (Stripe/PayPal) aquí.
  // Por ahora el upgrade es inmediato. En producción:
  //   1. Crear checkout session en Stripe
  //   2. Devolver URL de redirección al frontend
  //   3. El webhook de Stripe confirmará el pago y actualizará profiles.plan

  // UPDATE condicional atómico: solo actualiza si el plan actual NO es premium.
  // Previene race conditions (doble-click, requests simultáneos).
  const { data: updated, error: updateError } = await adminClient
    .from('profiles')
    .update({ plan: 'premium', updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .neq('plan', 'premium')
    .select('id')
    .maybeSingle()

  if (updateError) return json({ error: updateError.message }, 400)
  if (!updated) return json({ error: 'Ya tienes plan Premium' }, 409)

  return json({ plan: 'premium' }, 200)
})
