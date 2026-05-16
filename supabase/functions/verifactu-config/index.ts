// verifactu-config — gestiona la configuración VeriFactu del usuario autenticado.
//
// Acciones soportadas en el body JSON `{ action, ... }`:
//   - 'validate' { cert_base64, cert_password }      → parsea el .pfx y devuelve metadatos sin persistir.
//   - 'save'     { cert_base64, cert_password, modo, entorno }
//                                                    → valida + sube cert al bucket + cifra password
//                                                      en Vault + upsert user_verifactu_config (enabled=true).
//   - 'disable'  {}                                  → marca enabled=false (conserva registros y certificado).
//
// Auth: el usuario llama desde el cliente y supabase-js inyecta su JWT. La function
// valida el token contra GoTrue y opera con service_role para acceder a Vault / Storage.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2'
// node-forge para parsear PKCS#12. Versión pinneada para builds reproducibles.
// deno-lint-ignore no-explicit-any
import forge from 'npm:node-forge@1.3.1'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}

function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

async function authenticateUser(req: Request): Promise<{ userId: string } | { error: string; status: number }> {
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return { error: 'Falta token de autenticación', status: 401 }

  const supabase = adminClient()
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return { error: 'Token inválido', status: 401 }
  return { userId: data.user.id }
}

// ─── Parsing del .pfx ────────────────────────────────────────────────────────

interface CertMetadata {
  cert_serial: string
  cert_subject: string
  cert_issuer: string
  cert_expires_at: string   // ISO
  nif_titular: string
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// deno-lint-ignore no-explicit-any
function attributesToString(attrs: any[]): string {
  return (attrs ?? [])
    // deno-lint-ignore no-explicit-any
    .map((a: any) => `${a.shortName || a.name || a.type}=${a.value ?? ''}`)
    .join(', ')
}

// deno-lint-ignore no-explicit-any
function findAttr(attrs: any[], oid: string): string | null {
  // deno-lint-ignore no-explicit-any
  const a = (attrs ?? []).find((x: any) => x.type === oid)
  if (!a || a.value == null) return null
  return String(a.value)
}

// deno-lint-ignore no-explicit-any
function extractNifFromCert(subject: any): string | null {
  // Para empresas: organizationIdentifier (OID 2.5.4.97) con prefijo "VATES-"
  const orgId = findAttr(subject.attributes, '2.5.4.97')
  if (orgId) {
    const m = orgId.match(/^VATES-(.+)$/i)
    return (m ? m[1] : orgId).trim().toUpperCase()
  }
  // Para personas físicas (autónomos): serialNumber (OID 2.5.4.5) con prefijo "IDCES-"
  const serial = findAttr(subject.attributes, '2.5.4.5')
  if (serial) {
    const m = serial.match(/^(?:IDCES|VATES)-(.+)$/i)
    return (m ? m[1] : serial).trim().toUpperCase()
  }
  return null
}

function parsePfx(certBase64: string, certPassword: string): CertMetadata {
  let bytes: Uint8Array
  try {
    bytes = base64ToBytes(certBase64)
  } catch {
    throw new Error('El archivo no parece un PFX válido (base64 corrupto).')
  }

  let asn1
  try {
    // forge espera un string binario, no Uint8Array.
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
    asn1 = forge.asn1.fromDer(binary, false)
  } catch {
    throw new Error('El archivo no es un PFX válido (DER mal formado).')
  }

  // deno-lint-ignore no-explicit-any
  let p12: any
  try {
    p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, certPassword)
  } catch (e) {
    const msg = (e instanceof Error ? e.message : '').toLowerCase()
    if (msg.includes('password') || msg.includes('mac')) {
      throw new Error('La contraseña del certificado es incorrecta.')
    }
    throw new Error('No se pudo abrir el certificado.')
  }

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })?.[forge.pki.oids.certBag] ?? []
  // deno-lint-ignore no-explicit-any
  const cert = (certBags as any[])[0]?.cert
  if (!cert) throw new Error('El PFX no contiene certificado X.509.')

  const subjectStr = attributesToString(cert.subject.attributes)
  const issuerStr = attributesToString(cert.issuer.attributes)
  const nif = extractNifFromCert(cert.subject)
  if (!nif) {
    throw new Error('No se pudo extraer el NIF/CIF del certificado. ¿Es un certificado FNMT / AC válido para facturación?')
  }

  return {
    cert_serial: String(cert.serialNumber ?? '').toUpperCase(),
    cert_subject: subjectStr,
    cert_issuer: issuerStr,
    cert_expires_at: new Date(cert.validity.notAfter).toISOString(),
    nif_titular: nif,
  }
}

// ─── Acciones ────────────────────────────────────────────────────────────────

async function getEmpresaNif(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await supabase.from('empresa').select('nif').eq('id', userId).maybeSingle()
  return (data?.nif ?? '').toString().trim().toUpperCase() || null
}

function normalizeNif(value: string | null | undefined): string {
  return (value ?? '').toString().trim().toUpperCase().replace(/[\s.-]/g, '')
}

async function actionValidate(
  supabase: SupabaseClient,
  userId: string,
  body: { cert_base64?: string; cert_password?: string },
) {
  if (!body.cert_base64 || !body.cert_password) {
    return json({ ok: false, error: 'Faltan cert_base64 o cert_password' }, 400)
  }

  let metadata: CertMetadata
  try {
    metadata = parsePfx(body.cert_base64, body.cert_password)
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : 'Error parseando el certificado' }, 200)
  }

  const empresaNif = await getEmpresaNif(supabase, userId)
  if (!empresaNif) {
    return json({ ok: false, error: 'No tienes datos de empresa configurados. Completa Mi empresa antes.' }, 200)
  }
  if (normalizeNif(metadata.nif_titular) !== normalizeNif(empresaNif)) {
    return json({
      ok: false,
      error: `El NIF del certificado (${metadata.nif_titular}) no coincide con el NIF de tu empresa (${empresaNif}). Sube el certificado correcto o corrige tu empresa.`,
    }, 200)
  }

  return json({ ok: true, metadata }, 200)
}

async function actionSave(
  supabase: SupabaseClient,
  userId: string,
  body: {
    cert_base64?: string
    cert_password?: string
    modo?: string
    entorno?: string
  },
) {
  if (!body.cert_base64 || !body.cert_password) {
    return json({ ok: false, error: 'Faltan cert_base64 o cert_password' }, 400)
  }
  const modo = body.modo === 'veri_factu' ? 'veri_factu' : 'no_verificable'
  const entorno = body.entorno === 'produccion' ? 'produccion' : 'test'

  // Revalidar el cert antes de guardar (defensa: el cliente puede mentir).
  let metadata: CertMetadata
  try {
    metadata = parsePfx(body.cert_base64, body.cert_password)
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : 'Error parseando el certificado' }, 200)
  }

  const empresaNif = await getEmpresaNif(supabase, userId)
  if (!empresaNif || normalizeNif(metadata.nif_titular) !== normalizeNif(empresaNif)) {
    return json({ ok: false, error: 'El NIF del certificado no coincide con el de tu empresa.' }, 200)
  }

  // ── Si ya tenía secret, borrarlo (vamos a reemplazar) ──
  const { data: existing } = await supabase
    .from('user_verifactu_config')
    .select('cert_password_secret_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing?.cert_password_secret_id) {
    await supabase.rpc('verifactu_delete_password_secret', {
      p_secret_id: existing.cert_password_secret_id,
    })
  }

  // ── Crear nuevo secret en Vault ──
  const { data: newSecretId, error: vaultErr } = await supabase.rpc(
    'verifactu_create_password_secret',
    { p_user_id: userId, p_password: body.cert_password },
  )
  if (vaultErr || !newSecretId) {
    return json({ ok: false, error: `No se pudo cifrar la contraseña: ${vaultErr?.message ?? 'unknown'}` }, 500)
  }

  // ── Subir el .pfx al bucket privado ──
  const certBytes = base64ToBytes(body.cert_base64)
  const storagePath = `${userId}/cert.pfx`
  const { error: uploadErr } = await supabase.storage
    .from('verifactu-certs')
    .upload(storagePath, certBytes, {
      contentType: 'application/x-pkcs12',
      upsert: true,
    })
  if (uploadErr) {
    // rollback del secret de Vault para no dejar huérfano
    await supabase.rpc('verifactu_delete_password_secret', { p_secret_id: newSecretId })
    return json({ ok: false, error: `No se pudo subir el certificado: ${uploadErr.message}` }, 500)
  }

  // ── Upsert de la configuración ──
  const nowIso = new Date().toISOString()
  const { error: upsertErr } = await supabase.from('user_verifactu_config').upsert({
    user_id: userId,
    enabled: true,
    modo,
    entorno,
    cert_storage_path: storagePath,
    cert_password_secret_id: newSecretId,
    cert_serial: metadata.cert_serial,
    cert_subject: metadata.cert_subject,
    cert_issuer: metadata.cert_issuer,
    cert_expires_at: metadata.cert_expires_at,
    nif_titular: metadata.nif_titular,
    last_test_ok_at: nowIso,
    updated_at: nowIso,
  })
  if (upsertErr) {
    return json({ ok: false, error: `No se pudo guardar la configuración: ${upsertErr.message}` }, 500)
  }

  return json({ ok: true, metadata }, 200)
}

async function actionDisable(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase
    .from('user_verifactu_config')
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
  if (error) return json({ ok: false, error: error.message }, 500)
  return json({ ok: true }, 200)
}

async function actionEnable(supabase: SupabaseClient, userId: string) {
  // Verificar que existe configuración con certificado antes de activar.
  const { data } = await supabase
    .from('user_verifactu_config')
    .select('cert_storage_path, cert_expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data?.cert_storage_path) {
    return json({
      ok: false,
      error: 'No tienes un certificado guardado. Configura VeriFactu desde cero.',
    }, 400)
  }
  if (data.cert_expires_at && new Date(data.cert_expires_at).getTime() <= Date.now()) {
    return json({
      ok: false,
      error: 'El certificado guardado ha caducado. Reemplázalo antes de activar.',
    }, 400)
  }

  const { error } = await supabase
    .from('user_verifactu_config')
    .update({ enabled: true, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
  if (error) return json({ ok: false, error: error.message }, 500)
  return json({ ok: true }, 200)
}

// ─── Entrada ─────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const auth = await authenticateUser(req)
  if ('error' in auth) return json({ error: auth.error }, auth.status)

  let body: { action?: string } & Record<string, unknown>
  try { body = await req.json() }
  catch { return json({ error: 'JSON inválido' }, 400) }

  const supabase = adminClient()

  switch (body.action) {
    case 'validate':
      return await actionValidate(supabase, auth.userId, body as { cert_base64?: string; cert_password?: string })
    case 'save':
      return await actionSave(supabase, auth.userId, body as {
        cert_base64?: string; cert_password?: string; modo?: string; entorno?: string
      })
    case 'disable':
      return await actionDisable(supabase, auth.userId)
    case 'enable':
      return await actionEnable(supabase, auth.userId)
    default:
      return json({ error: `Acción desconocida: ${body.action}` }, 400)
  }
})
