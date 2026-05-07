import { supabase } from './supabaseClient'
import type { PostgrestError } from '@supabase/supabase-js'
import type { DocumentoBase, TotalesDocumento } from '../types/document.types'
import type { ContratoServiciosDoc, LegalDoc, NdaDoc, ReclamacionPagoDoc } from '../types/legalDoc.types'
import type { DocRow } from '../types/docRow.types'
import { documentRegistry, type UserDocumentTable } from './documentRegistry'

export type { UserDocumentTable }

export type UserDocumentDraft =
  | DocumentoBase
  | ContratoServiciosDoc
  | NdaDoc
  | ReclamacionPagoDoc

export interface UserDocumentRow {
  id: string
  datos_json?: UserDocumentDraft | null
  estado?: string | null
  numero?: string | null
}

function extractMissingColumn(message: string): string | null {
  const match = message.match(/Could not find the '([^']+)' column/i)
  return match?.[1] ?? null
}

async function writeRowWithRetry(params: {
  table: string
  id?: string
  payload: Record<string, unknown>
}): Promise<{ data: { id: string } | null; error: PostgrestError | Error | null }> {
  const { table, id } = params
  const payload = { ...params.payload }

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const query = id
      ? supabase.from(table).update(payload).eq('id', id)
      : supabase.from(table).insert(payload)

    const { data, error } = await query.select('id').single()
    if (!error) return { data: data as { id: string } | null, error: null }

    const missing = extractMissingColumn(error.message)
    if (!missing || !(missing in payload)) {
      return { data: null, error }
    }

    // Columnas críticas: si faltan, rechazar el guardado (no eliminar nunca)
    const CRITICAL_COLUMNS = new Set(['datos_json'])
    if (CRITICAL_COLUMNS.has(missing)) {
      return { data: null, error }
    }

    // Columnas documentales esperadas: el flujo no se rompe (se elimina y se reintenta),
    // pero el log es ruidoso para forzar a crear la migración de reparación.
    const EXPECTED_DOC_COLUMNS = new Set(['numero', 'notas', 'estado'])
    if (EXPECTED_DOC_COLUMNS.has(missing)) {
      console.error(
        `[writeRowWithRetry] Tabla '${table}' no tiene la columna esperada '${missing}'. ` +
          `Crear migración: ALTER TABLE public.${table} ADD COLUMN IF NOT EXISTS ${missing} ...; ` +
          `NOTIFY pgrst, 'reload schema';`,
      )
    } else {
      console.warn(
        `[writeRowWithRetry] Columna '${missing}' no existe en '${table}', eliminando del payload. Ejecuta una migración de reparación.`,
      )
    }
    delete payload[missing]
  }

  return { data: null, error: new Error('No se pudo guardar: demasiados reintentos por columnas inexistentes.') }
}

async function getNextNumero(
  userId: string,
  tipo: string,
  prefijo: string,
): Promise<{ numero: string | null; error: unknown }> {
  const { data: nextData, error } = await supabase.rpc('next_document_number', {
    p_tipo: tipo,
    p_prefijo: prefijo,
    p_user_id: userId,
  })
  if (error) return { numero: null, error }
  const row = Array.isArray(nextData) ? nextData[0] : null
  return { numero: (row?.numero as string | undefined) ?? '', error: null }
}

const getNextPresupuestoNumero = (userId: string) => getNextNumero(userId, 'presupuesto', 'PRE')
const getNextFacturaNumero = (userId: string) => getNextNumero(userId, 'factura', 'FAC')
const getNextRectificativaNumero = (userId: string) => getNextNumero(userId, 'rectificativa', 'R')
const getNextContratoNumero = (userId: string) => getNextNumero(userId, 'contrato', 'CON')
const getNextNdaNumero = (userId: string) => getNextNumero(userId, 'nda', 'NDA')
const getNextReclamacionNumero = (userId: string) => getNextNumero(userId, 'reclamacion', 'REC')

export async function saveBusinessDocument(params: {
  table: 'facturas' | 'presupuestos' | 'albaranes'
  userId: string
  document: DocumentoBase
  totals: TotalesDocumento
  id?: string
  finalizar?: boolean
}) {
  const { table, userId, document, totals, id, finalizar = false } = params
  const entry = documentRegistry[table] as typeof documentRegistry.facturas

  const { numero, error: numError } = await entry.assignNumero({
    document, finalizar, userId, id,
  })
  if (numError) {
    return { data: null, error: numError as { message: string }, numero: null as string | null }
  }

  const payload = entry.buildPayload({ document, numero, finalizar, userId, id, totals })
  const result = await writeRowWithRetry({ table, id, payload })

  return { ...result, numero: (payload.numero as string | null | undefined) ?? null }
}

export async function enviarAlbaran(id: string) {
  const { error } = await supabase.from('albaranes').update({ estado: 'enviado' }).eq('id', id)
  return { error }
}

export async function emitirFactura(userId: string, id: string) {
  const { data: current, error: fetchError } = await supabase
    .from('facturas')
    .select('datos_json')
    .eq('id', id)
    .single()

  if (fetchError) return { error: fetchError, numero: null }

  const datosJson = current?.datos_json as DocumentoBase | null
  const esRectificativa = Boolean(datosJson?.esRectificativa)

  const { numero, error: nextError } = esRectificativa
    ? await getNextRectificativaNumero(userId)
    : await getNextFacturaNumero(userId)

  if (nextError) return { error: nextError as { message: string }, numero: null }

  const updatedDatosJson = datosJson ? { ...datosJson, numero: numero ?? '' } : datosJson

  const { error: updateError } = await supabase
    .from('facturas')
    .update({ numero, estado: 'emitida', datos_json: updatedDatosJson })
    .eq('id', id)

  return { error: updateError, numero }
}

export async function duplicarFactura(userId: string, id: string) {
  const { data, error: fetchError } = await supabase
    .from('facturas')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) return { error: fetchError }

  const datosJson = data?.datos_json as DocumentoBase | null
  if (!datosJson) return { error: new Error('Documento no encontrado') }

  const { error: insertError } = await supabase
    .from('facturas')
    .insert({
      user_id: userId,
      fecha: data.fecha,
      cliente_nombre: data.cliente_nombre,
      cliente_nif: data.cliente_nif,
      cliente_email: data.cliente_email,
      cliente_direccion: data.cliente_direccion,
      concepto: data.concepto,
      base_imponible: data.base_imponible,
      tipo_iva: data.tipo_iva,
      tipo_irpf: data.tipo_irpf,
      total: data.total,
      estado: 'borrador',
      notas: data.notas,
      datos_json: { ...datosJson, numero: '' },
    })

  return { error: insertError }
}

export async function corregirFactura(userId: string, id: string) {
  const { data, error: fetchError } = await supabase
    .from('facturas')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) return { error: fetchError }

  const datosJson = data?.datos_json as DocumentoBase | null
  if (!datosJson) return { error: new Error('Documento no encontrado') }

  const originalNumero = (data.numero as string | undefined) ?? ''
  const originalFecha = (data.fecha as string | undefined) ?? datosJson.fecha ?? ''

  const nuevoDatosJson: DocumentoBase = {
    ...datosJson,
    numero: '',
    notas: '',
    esRectificativa: true,
    facturaOriginalNumero: originalNumero,
    facturaOriginalFecha: originalFecha,
    motivoRectificacion: '',
    lineas: datosJson.lineas,
  }

  const { error: insertError } = await supabase
    .from('facturas')
    .insert({
      user_id: userId,
      fecha: data.fecha,
      cliente_nombre: data.cliente_nombre,
      cliente_nif: data.cliente_nif,
      cliente_email: data.cliente_email,
      cliente_direccion: data.cliente_direccion,
      concepto: data.concepto,
      base_imponible: data.base_imponible,
      tipo_iva: data.tipo_iva,
      tipo_irpf: data.tipo_irpf,
      total: data.total,
      estado: 'borrador',
      notas: '',
      datos_json: nuevoDatosJson,
    })

  return { error: insertError }
}

export async function marcarPresupuestoEntregado(id: string) {
  const { error } = await supabase.from('presupuestos').update({ estado: 'enviado' }).eq('id', id)
  return { error }
}

export async function marcarFacturaCobrada(id: string) {
  const { error } = await supabase.from('facturas').update({ estado: 'cobrada' }).eq('id', id)
  return { error }
}

export async function marcarFacturaEmitida(id: string) {
  const { error } = await supabase.from('facturas').update({ estado: 'emitida' }).eq('id', id)
  return { error }
}

export async function saveLegalDocument(params: {
  table: 'contratos' | 'ndas' | 'reclamaciones'
  userId: string
  document: LegalDoc
  id?: string
  finalizar?: boolean
}) {
  const { table, userId, document, id, finalizar = false } = params
  const entry = documentRegistry[table]

  type AnyEntry = {
    assignNumero: (ctx: { document: unknown; finalizar: boolean; userId: string; id?: string }) => Promise<{ numero: string | null; error: unknown }>
    buildPayload: (ctx: { document: unknown; numero: string | null; finalizar: boolean; userId: string; id?: string }) => Record<string, unknown>
  }
  const anyEntry = entry as AnyEntry

  const { numero, error: numError } = await anyEntry.assignNumero({
    document, finalizar, userId, id,
  })
  if (numError) {
    return { data: null, error: numError as { message: string }, numero: null as string | null }
  }

  const payload = anyEntry.buildPayload({ document, numero, finalizar, userId, id })
  const result = await writeRowWithRetry({ table, id, payload })

  return { ...result, numero: (payload.numero as string | null | undefined) ?? null }
}

export async function enviarContrato(userId: string, id: string) {
  // Intentar con la columna numero (requiere migración 010 aplicada)
  try {
    const { data: current, error: fetchError } = await supabase
      .from('contratos')
      .select('numero, datos_json')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    let numero = (current?.numero as string | null) || null
    if (!numero) {
      const { numero: nextNumero, error: nextError } = await getNextContratoNumero(userId)
      if (nextError) throw nextError
      numero = nextNumero
    }

    const datosJson = current?.datos_json as ContratoServiciosDoc | null
    const updatedDatosJson = datosJson
      ? { ...datosJson, metadatos: { ...datosJson.metadatos, referencia: numero ?? datosJson.metadatos.referencia } }
      : datosJson

    const { error: updateError } = await supabase
      .from('contratos')
      .update({ numero, estado: 'enviado', datos_json: updatedDatosJson })
      .eq('id', id)

    return { error: updateError, numero }
  } catch {
    // Fallback: marcar como enviado sin columna numero
    const { error: updateError } = await supabase
      .from('contratos')
      .update({ estado: 'enviado' })
      .eq('id', id)

    return { error: updateError, numero: null as string | null }
  }
}

export async function enviarNda(userId: string, id: string) {
  try {
    const { data: current, error: fetchError } = await supabase
      .from('ndas')
      .select('numero, datos_json')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    let numero = (current?.numero as string | null) || null
    if (!numero) {
      const { numero: nextNumero, error: nextError } = await getNextNdaNumero(userId)
      if (nextError) throw nextError
      numero = nextNumero
    }

    const datosJson = current?.datos_json as NdaDoc | null
    const updatedDatosJson = datosJson
      ? { ...datosJson, metadatos: { ...datosJson.metadatos, referencia: numero ?? datosJson.metadatos.referencia } }
      : datosJson

    const { error: updateError } = await supabase
      .from('ndas')
      .update({ numero, estado: 'enviado', datos_json: updatedDatosJson })
      .eq('id', id)

    return { error: updateError, numero }
  } catch {
    const { error: updateError } = await supabase
      .from('ndas')
      .update({ estado: 'enviado' })
      .eq('id', id)

    return { error: updateError, numero: null as string | null }
  }
}

export async function enviarReclamacion(userId: string, id: string) {
  try {
    const { data: current, error: fetchError } = await supabase
      .from('reclamaciones')
      .select('numero, datos_json')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    let numero = (current?.numero as string | null) || null
    if (!numero) {
      const { numero: nextNumero, error: nextError } = await getNextReclamacionNumero(userId)
      if (nextError) throw nextError
      numero = nextNumero
    }

    const datosJson = current?.datos_json as ReclamacionPagoDoc | null
    const updatedDatosJson = datosJson
      ? { ...datosJson, metadatos: { ...datosJson.metadatos, referencia: numero ?? datosJson.metadatos.referencia } }
      : datosJson

    const { error: updateError } = await supabase
      .from('reclamaciones')
      .update({ numero, estado: 'enviada', datos_json: updatedDatosJson })
      .eq('id', id)

    return { error: updateError, numero }
  } catch {
    const { error: updateError } = await supabase
      .from('reclamaciones')
      .update({ estado: 'enviada' })
      .eq('id', id)

    return { error: updateError, numero: null as string | null }
  }
}

export async function enviarPresupuesto(userId: string, id: string) {
  const { data: current, error: fetchError } = await supabase
    .from('presupuestos')
    .select('numero, datos_json')
    .eq('id', id)
    .single()

  if (fetchError) return { error: fetchError, numero: null }

  // Si ya tiene número (asignado al crear), lo respetamos
  let numero = (current?.numero as string | null) || null
  if (!numero) {
    const { numero: nextNumero, error: nextError } = await getNextPresupuestoNumero(userId)
    if (nextError) return { error: nextError as { message: string }, numero: null }
    numero = nextNumero
  }

  const datosJson = current?.datos_json as DocumentoBase | null
  const updatedDatosJson = datosJson ? { ...datosJson, numero: numero ?? '' } : datosJson

  const { error: updateError } = await supabase
    .from('presupuestos')
    .update({ numero, estado: 'enviado', datos_json: updatedDatosJson })
    .eq('id', id)

  return { error: updateError, numero }
}

export async function aprobarPresupuesto(id: string) {
  const { error } = await supabase
    .from('presupuestos')
    .update({ estado: 'aprobado', fue_aprobado: true })
    .eq('id', id)
  return { error }
}

export async function convertirPresupuestoAFactura(userId: string, id: string) {
  const { data, error: fetchError } = await supabase
    .from('presupuestos')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) return { error: fetchError, facturaId: null as string | null }

  const datosJson = data?.datos_json as DocumentoBase | null
  if (!datosJson) return { error: new Error('Documento no encontrado'), facturaId: null as string | null }

  const nuevoDatosJson: DocumentoBase = { ...datosJson, tipo: 'factura', numero: '' }

  const { data: facturaData, error: insertError } = await supabase
    .from('facturas')
    .insert({
      user_id: userId,
      fecha: data.fecha,
      cliente_nombre: data.cliente_nombre,
      cliente_nif: data.cliente_nif,
      cliente_email: data.cliente_email,
      cliente_direccion: data.cliente_direccion,
      concepto: data.concepto,
      base_imponible: data.base_imponible,
      tipo_iva: data.tipo_iva,
      tipo_irpf: data.tipo_irpf,
      total: data.total,
      estado: 'borrador',
      notas: data.notas,
      datos_json: nuevoDatosJson,
    })
    .select('id')
    .single()

  if (insertError) return { error: insertError, facturaId: null as string | null }

  const { error: updateError } = await supabase
    .from('presupuestos')
    .update({ estado: 'convertido', factura_id: facturaData.id })
    .eq('id', id)

  return { error: updateError, facturaId: facturaData.id as string }
}

export async function getStoredUserDocument(table: UserDocumentTable, id: string) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single()

  return { data: data as UserDocumentRow | null, error }
}

export async function getFacturasEmitidas(
  userId: string,
  clienteNombre?: string,
  clienteEmail?: string,
) {
  let query = supabase
    .from('facturas')
    .select('*')
    .eq('user_id', userId)
    .eq('estado', 'emitida')

  if (clienteNombre) {
    query = query.ilike('cliente_nombre', `%${clienteNombre}%`)
  }
  if (clienteEmail) {
    query = query.eq('cliente_email', clienteEmail)
  }

  const { data, error } = await query.order('fecha', { ascending: false })
  return { data: data as DocRow[] | null, error }
}
