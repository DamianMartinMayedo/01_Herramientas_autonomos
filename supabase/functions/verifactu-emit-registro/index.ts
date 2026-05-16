// verifactu-emit-registro — genera el "Registro de Alta" de VeriFactu para una factura.
//
// Body JSON: { factura_id: string }
//
// Flujo:
//   1. Auth del usuario (JWT).
//   2. Carga la factura del usuario, verifica que está en estado 'emitida'.
//   3. Verifica que `user_verifactu_config.enabled = true` (si no, error explícito).
//   4. Idempotencia: si ya existe registro 'alta' para esta factura, lo devuelve.
//   5. Calcula la huella canónica + hash SHA-256 encadenado al registro anterior.
//   6. Construye el XML conforme al esquema VeriFactu (suficiente para almacenar; el envío
//      SOAP a AEAT vendrá en producción).
//   7. Genera URL del QR (preprod o prod según `entorno`).
//   8. Inserta en `verifactu_registros`.
//
// NO envía nada a la AEAT — eso queda para la integración final.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2'

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

// ─── Helpers ────────────────────────────────────────────────────────────────

function fechaToDdMmYyyy(value: string | null | undefined): string {
  if (!value) return ''
  // Postgres DATE viene como "YYYY-MM-DD"
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  // Fallback con Date
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
}

function fmtImporte(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '0.00'
  return Number(n).toFixed(2)
}

function nowIsoUtcWithOffset(): string {
  // 2026-05-16T08:30:00+00:00 (AEAT acepta cualquier offset xs:dateTime)
  return new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00')
}

async function sha256HexUpper(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

function xmlEscape(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ─── Acción ──────────────────────────────────────────────────────────────────

interface Empresa { nombre: string; nif: string }
interface VfConfig {
  enabled: boolean
  modo: string
  entorno: 'test' | 'produccion' | string
  nif_titular: string | null
}
interface FacturaRow {
  id: string
  user_id: string
  numero: string | null
  fecha: string | null
  estado: string | null
  cliente_nombre: string | null
  cliente_nif: string | null
  concepto: string | null
  base_imponible: number | null
  tipo_iva: number | null
  total: number | null
  datos_json: unknown
}

async function emitirRegistro(supabase: SupabaseClient, userId: string, facturaId: string) {
  // 1. Cargar factura y validar ownership + estado
  const { data: factura, error: errFact } = await supabase
    .from('facturas')
    .select('id, user_id, numero, fecha, estado, cliente_nombre, cliente_nif, concepto, base_imponible, tipo_iva, total, datos_json')
    .eq('id', facturaId)
    .eq('user_id', userId)
    .maybeSingle()
  if (errFact || !factura) {
    return json({ ok: false, error: 'Factura no encontrada' }, 404)
  }
  const fact = factura as FacturaRow
  if (fact.estado !== 'emitida' && fact.estado !== 'cobrada') {
    return json({
      ok: false,
      error: 'Solo se pueden registrar facturas emitidas. Emite la factura primero.',
    }, 400)
  }
  if (!fact.numero) {
    return json({ ok: false, error: 'La factura no tiene número asignado.' }, 400)
  }

  // 2. Config VeriFactu del usuario
  const { data: cfgData } = await supabase
    .from('user_verifactu_config')
    .select('enabled, modo, entorno, nif_titular')
    .eq('user_id', userId)
    .maybeSingle()
  const cfg = cfgData as VfConfig | null
  if (!cfg?.enabled) {
    return json({ ok: false, error: 'VeriFactu no está activado. Actívalo en tu perfil para registrar facturas.' }, 400)
  }

  // 3. Idempotencia
  const { data: existing } = await supabase
    .from('verifactu_registros')
    .select('id, hash, qr_url')
    .eq('user_id', userId)
    .eq('factura_id', facturaId)
    .eq('tipo_registro', 'alta')
    .maybeSingle()
  if (existing) {
    return json({ ok: true, alreadyRegistered: true, registro: existing }, 200)
  }

  // 4. Empresa
  const { data: empData } = await supabase
    .from('empresa')
    .select('nombre, nif')
    .eq('id', userId)
    .maybeSingle()
  const empresa = empData as Empresa | null
  const nifEmisor = (empresa?.nif || cfg.nif_titular || '').trim().toUpperCase().replace(/[\s.-]/g, '')
  if (!nifEmisor) {
    return json({ ok: false, error: 'No hay NIF en tu empresa. Configura Mi empresa antes.' }, 400)
  }

  // 5. Hash del registro anterior (FOR UPDATE → serializa la cadena)
  const { data: lastHash } = await supabase.rpc('verifactu_last_hash', { p_user_id: userId })
  const hashAnterior = (lastHash as string | null) ?? ''

  // 6. Campos del registro
  const datosJson = (fact.datos_json ?? {}) as { esRectificativa?: boolean; lineas?: Array<unknown> }
  const esRectif = Boolean(datosJson.esRectificativa)
  const tipoFactura = esRectif ? 'R1' : 'F1'

  const baseImp = Number(fact.base_imponible ?? 0)
  const tipoIva = Number(fact.tipo_iva ?? 0)
  const cuotaTotal = Number((baseImp * tipoIva / 100).toFixed(2))
  const importeTotal = Number(fact.total ?? 0)

  const fechaExp = fechaToDdMmYyyy(fact.fecha)
  const fechaGen = nowIsoUtcWithOffset()
  const numero = fact.numero
  const descripcion = (fact.concepto || datosJson.lineas?.[0] ? '' : '').toString()
  const descripcionFinal = fact.concepto || 'Operación facturada'

  // 7. Huella canónica (orden exacto que AEAT define para RegistroAlta)
  const huellaCadena = [
    `IDEmisorFactura=${nifEmisor}`,
    `NumSerieFactura=${numero}`,
    `FechaExpedicionFactura=${fechaExp}`,
    `TipoFactura=${tipoFactura}`,
    `CuotaTotal=${fmtImporte(cuotaTotal)}`,
    `ImporteTotal=${fmtImporte(importeTotal)}`,
    `Huella=${hashAnterior}`,
    `FechaHoraHusoGenRegistro=${fechaGen}`,
  ].join('&')

  const hash = await sha256HexUpper(huellaCadena)

  // 8. URL del QR (AEAT)
  const qrBase = cfg.entorno === 'produccion'
    ? 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR'
    : 'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR'
  const qrUrl = `${qrBase}?nif=${encodeURIComponent(nifEmisor)}` +
    `&numserie=${encodeURIComponent(numero)}` +
    `&fecha=${encodeURIComponent(fechaExp)}` +
    `&importe=${encodeURIComponent(fmtImporte(importeTotal))}`

  // 9. XML del Registro de Alta (estructura conforme; lista para envío en producción)
  const xml = buildRegistroAltaXml({
    nifEmisor,
    nombreEmisor: empresa?.nombre || nifEmisor,
    numero,
    fechaExp,
    tipoFactura,
    descripcion: descripcionFinal,
    clienteNombre: fact.cliente_nombre,
    clienteNif: fact.cliente_nif,
    baseImp,
    tipoIva,
    cuotaTotal,
    importeTotal,
    hashAnterior,
    fechaGen,
    hash,
  })

  // 10. Insertar (encadenado: si otro registro entró entre el rpc y este insert, FK / hash igual conserva orden por created_at)
  const { data: inserted, error: insErr } = await supabase
    .from('verifactu_registros')
    .insert({
      user_id: userId,
      factura_id: facturaId,
      tipo_registro: 'alta',
      numero_factura: numero,
      fecha_expedicion: fact.fecha,
      hash,
      hash_anterior: hashAnterior || null,
      huella: huellaCadena,
      xml,
      qr_url: qrUrl,
    })
    .select('id, hash, qr_url')
    .single()
  if (insErr) {
    return json({ ok: false, error: `No se pudo registrar el alta: ${insErr.message}` }, 500)
  }

  return json({ ok: true, registro: inserted }, 200)
}

interface XmlInput {
  nifEmisor: string
  nombreEmisor: string
  numero: string
  fechaExp: string
  tipoFactura: string
  descripcion: string
  clienteNombre: string | null
  clienteNif: string | null
  baseImp: number
  tipoIva: number
  cuotaTotal: number
  importeTotal: number
  hashAnterior: string
  fechaGen: string
  hash: string
}

function buildRegistroAltaXml(i: XmlInput): string {
  const dest = (i.clienteNombre || i.clienteNif)
    ? `<Destinatarios><IDDestinatario>${
        i.clienteNombre ? `<NombreRazon>${xmlEscape(i.clienteNombre)}</NombreRazon>` : ''
      }${
        i.clienteNif ? `<NIF>${xmlEscape(i.clienteNif)}</NIF>` : ''
      }</IDDestinatario></Destinatarios>`
    : ''

  const encadenamiento = i.hashAnterior
    ? `<Encadenamiento><RegistroAnterior><Huella>${xmlEscape(i.hashAnterior)}</Huella></RegistroAnterior></Encadenamiento>`
    : `<Encadenamiento><PrimerRegistro>S</PrimerRegistro></Encadenamiento>`

  return `<?xml version="1.0" encoding="UTF-8"?>
<RegistroAlta>
  <IDVersion>1.0</IDVersion>
  <IDFactura>
    <IDEmisorFactura>${xmlEscape(i.nifEmisor)}</IDEmisorFactura>
    <NumSerieFactura>${xmlEscape(i.numero)}</NumSerieFactura>
    <FechaExpedicionFactura>${xmlEscape(i.fechaExp)}</FechaExpedicionFactura>
  </IDFactura>
  <NombreRazonEmisor>${xmlEscape(i.nombreEmisor)}</NombreRazonEmisor>
  <TipoFactura>${xmlEscape(i.tipoFactura)}</TipoFactura>
  <DescripcionOperacion>${xmlEscape(i.descripcion)}</DescripcionOperacion>
  ${dest}
  <Desglose>
    <DetalleDesglose>
      <ClaveRegimen>01</ClaveRegimen>
      <CalificacionOperacion>S1</CalificacionOperacion>
      <TipoImpositivo>${fmtImporte(i.tipoIva)}</TipoImpositivo>
      <BaseImponibleOimporteNoSujeto>${fmtImporte(i.baseImp)}</BaseImponibleOimporteNoSujeto>
      <CuotaRepercutida>${fmtImporte(i.cuotaTotal)}</CuotaRepercutida>
    </DetalleDesglose>
  </Desglose>
  <CuotaTotal>${fmtImporte(i.cuotaTotal)}</CuotaTotal>
  <ImporteTotal>${fmtImporte(i.importeTotal)}</ImporteTotal>
  ${encadenamiento}
  <SistemaInformatico>
    <NombreRazon>HerramientasAutonomos</NombreRazon>
    <NIF>${xmlEscape(i.nifEmisor)}</NIF>
    <NombreSistemaInformatico>HerramientasAutonomos.es</NombreSistemaInformatico>
    <IdSistemaInformatico>HA1</IdSistemaInformatico>
    <Version>1.0</Version>
    <NumeroInstalacion>1</NumeroInstalacion>
  </SistemaInformatico>
  <FechaHoraHusoGenRegistro>${xmlEscape(i.fechaGen)}</FechaHoraHusoGenRegistro>
  <TipoHuella>01</TipoHuella>
  <Huella>${xmlEscape(i.hash)}</Huella>
</RegistroAlta>`
}

// ─── Entrada ─────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const auth = await authenticateUser(req)
  if ('error' in auth) return json({ error: auth.error }, auth.status)

  let body: { factura_id?: string }
  try { body = await req.json() }
  catch { return json({ error: 'JSON inválido' }, 400) }

  if (!body.factura_id) return json({ error: 'factura_id obligatorio' }, 400)

  const supabase = adminClient()
  return await emitirRegistro(supabase, auth.userId, body.factura_id)
})
