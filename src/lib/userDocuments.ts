import { supabase } from './supabaseClient'
import type { PostgrestError } from '@supabase/supabase-js'
import type { DocumentoBase, TotalesDocumento } from '../types/document.types'
import type { ContratoServiciosDoc, LegalDoc, NdaDoc, ReclamacionPagoDoc } from '../types/legalDoc.types'
import type { DocRow } from '../types/docRow.types'

export type UserDocumentTable =
  | 'facturas'
  | 'presupuestos'
  | 'albaranes'
  | 'contratos'
  | 'ndas'
  | 'reclamaciones'

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

function resumenConcepto(lineas: DocumentoBase['lineas']) {
  return lineas
    .map((linea) => linea.descripcion.trim())
    .filter(Boolean)
    .join(' · ')
}

function firstNumber(values: number[], fallback: number) {
  const value = values.find((item) => Number.isFinite(item))
  return typeof value === 'number' ? value : fallback
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
const getNextAlbaranNumero = (userId: string) => getNextNumero(userId, 'albaran', 'ALB')
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
  const isAutoNumbered = table === 'facturas' || table === 'presupuestos'
  let numeroFinal: string | null = isAutoNumbered ? null : document.numero

  if (table === 'facturas' && finalizar) {
    const { numero, error: nextError } = document.esRectificativa
      ? await getNextRectificativaNumero(userId)
      : await getNextFacturaNumero(userId)
    if (nextError) {
      return { data: null, error: nextError as { message: string }, numero: null as string | null }
    }
    numeroFinal = numero
  }

  // Presupuestos: asignar número al crear (sin id) O al enviar (finalizar)
  const asignarNumPre = table === 'presupuestos' && (finalizar || !id)
  if (asignarNumPre) {
    const { numero, error: nextError } = await getNextPresupuestoNumero(userId)
    if (nextError) {
      return { data: null, error: nextError as { message: string }, numero: null as string | null }
    }
    numeroFinal = numero
  }

  // Albaranes: asignar número al crear (sin id)
  let numeroAlb: string | null = document.numero
  if (table === 'albaranes' && !id) {
    const { numero, error: nextError } = await getNextAlbaranNumero(userId)
    if (nextError) {
      return { data: null, error: nextError as { message: string }, numero: null as string | null }
    }
    numeroAlb = numero
  }

  const payload: Record<string, unknown> =
    table === 'albaranes'
      ? {
          user_id: userId,
          numero: numeroAlb,
          fecha: document.fecha,
          cliente_nombre: document.cliente.nombre,
          cliente_nif: document.cliente.nif,
          cliente_email: document.cliente.email,
          cliente_direccion: document.cliente.direccion,
          descripcion: resumenConcepto(document.lineas),
          estado: finalizar ? 'enviado' : 'pendiente',
          notas: document.notas,
          datos_json: { ...document, numero: numeroAlb ?? '' },
        }
      : {
          user_id: userId,
          ...(isAutoNumbered
            ? ((finalizar || asignarNumPre) ? { numero: numeroFinal } : {})
            : { numero: document.numero }),
          fecha: document.fecha,
          cliente_nombre: document.cliente.nombre,
          cliente_nif: document.cliente.nif,
          cliente_email: document.cliente.email,
          cliente_direccion: document.cliente.direccion,
          concepto: resumenConcepto(document.lineas),
          base_imponible: totals.baseImponible,
          tipo_iva: firstNumber(document.lineas.map((linea) => linea.iva), 21),
          tipo_irpf: document.mostrarIrpf
            ? firstNumber(document.lineas.map((linea) => linea.irpf), 15)
            : 0,
          total: totals.total,
          // Para presupuestos existentes sin finalizar: no tocar el estado (ya puede ser enviado/aprobado)
          ...(table === 'presupuestos' && !finalizar && id
            ? {}
            : {
                estado: table === 'facturas'
                  ? (finalizar ? 'emitida' : 'borrador')
                  : table === 'presupuestos'
                    ? (finalizar ? 'enviado' : 'borrador')
                    : 'borrador',
              }),
          notas: document.notas,
          datos_json: {
            ...document,
            numero: isAutoNumbered
              ? ((finalizar || asignarNumPre) ? (numeroFinal ?? '') : (document.numero ?? ''))
              : document.numero,
          },
        }

  const result = await writeRowWithRetry({ table, id, payload })
  return {
    ...result,
    numero: table === 'albaranes'
      ? numeroAlb
      : isAutoNumbered ? ((finalizar || asignarNumPre) ? numeroFinal : null) : document.numero,
  }
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

  let payload: Record<string, unknown>

  if (table === 'contratos') {
    const contrato = document as ContratoServiciosDoc
    let numeroContrato: string | null = contrato.metadatos.referencia || null

    if (!id && !numeroContrato) {
      const { numero, error: nextError } = await getNextContratoNumero(userId)
      if (nextError) {
        return { data: null, error: nextError as { message: string }, numero: null as string | null }
      }
      numeroContrato = numero
    }

    const basePayload: Record<string, unknown> = {
      user_id: userId,
      titulo: contrato.objetoContrato.slice(0, 80) || 'Contrato',
      fecha: contrato.metadatos.fecha,
      cliente_nombre: contrato.cliente.nombre,
      cliente_nif: contrato.cliente.nif,
      cliente_email: contrato.cliente.email,
      tipo: 'servicios',
      estado: finalizar ? 'enviado' : 'borrador',
      notas: contrato.notas,
      datos_json: { ...contrato, metadatos: { ...contrato.metadatos, referencia: numeroContrato ?? contrato.metadatos.referencia } },
    }
    // Solo tocar numero si se está creando o si el usuario introdujo una referencia explícita
    if (!id || numeroContrato) {
      basePayload.numero = numeroContrato
    }
    payload = basePayload
  } else if (table === 'ndas') {
    const nda = document as NdaDoc
    let numeroNda: string | null = nda.metadatos.referencia || null

    if (!id && !numeroNda) {
      const { numero, error: nextError } = await getNextNdaNumero(userId)
      if (nextError) {
        return { data: null, error: nextError as { message: string }, numero: null as string | null }
      }
      numeroNda = numero
    }

    const updatedMetadatos = { ...nda.metadatos, referencia: numeroNda ?? nda.metadatos.referencia }
    payload = {
      user_id: userId,
      titulo: numeroNda || `NDA ${nda.parteB.nombre || ''}`.trim() || 'NDA',
      fecha: nda.metadatos.fecha,
      otra_parte_nombre: nda.parteB.nombre,
      otra_parte_nif: nda.parteB.nif,
      otra_parte_email: nda.parteB.email,
      estado: finalizar ? 'enviado' : 'borrador',
      notas: nda.notas,
      datos_json: { ...nda, metadatos: updatedMetadatos },
    }
    if (!id || numeroNda) {
      payload.numero = numeroNda
    }
  } else {
    const reclamacion = document as ReclamacionPagoDoc
    let numeroRec: string | null = reclamacion.metadatos.referencia || null

    if (!id && !numeroRec) {
      const { numero, error: nextError } = await getNextReclamacionNumero(userId)
      if (nextError) {
        return { data: null, error: nextError as { message: string }, numero: null as string | null }
      }
      numeroRec = numero
    }

    const updatedMetadatos = { ...reclamacion.metadatos, referencia: numeroRec ?? reclamacion.metadatos.referencia }
    payload = {
      user_id: userId,
      titulo: numeroRec || `Reclamacion ${reclamacion.deudor.nombre || ''}`.trim() || 'Reclamación',
      fecha: reclamacion.metadatos.fecha,
      deudor_nombre: reclamacion.deudor.nombre,
      deudor_nif: reclamacion.deudor.nif,
      deudor_email: reclamacion.deudor.email,
      importe: reclamacion.importeDeuda,
      estado: finalizar ? 'enviada' : 'borrador',
      notas: reclamacion.notas,
      datos_json: { ...reclamacion, metadatos: updatedMetadatos },
    }
    if (!id || numeroRec) {
      payload.numero = numeroRec
    }
  }

  const result = await writeRowWithRetry({ table, id, payload })
  return {
    ...result,
    numero: table === 'contratos' || table === 'ndas' || table === 'reclamaciones' ? (payload.numero as string | null) : null,
  }
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
