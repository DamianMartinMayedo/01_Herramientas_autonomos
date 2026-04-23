import { supabase } from './supabaseClient'
import type { DocumentoBase, TotalesDocumento } from '../types/document.types'
import type { ContratoServiciosDoc, LegalDoc, NdaDoc, ReclamacionPagoDoc } from '../types/legalDoc.types'

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
}) {
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

    // DB schema is missing this column; drop it and retry.
    // We always keep datos_json as the source of truth.
    delete payload[missing]
  }

  return { data: null, error: new Error('No se pudo guardar: demasiados reintentos por columnas inexistentes.') as unknown as { message: string } }
}

export async function saveBusinessDocument(params: {
  table: 'facturas' | 'presupuestos' | 'albaranes'
  userId: string
  document: DocumentoBase
  totals: TotalesDocumento
  id?: string
}) {
  const { table, userId, document, totals, id } = params
  let numeroFinal = document.numero

  if (table === 'facturas' && !id) {
    const { data: nextData, error: nextError } = await supabase.rpc('next_document_number', {
      p_tipo: 'factura',
      p_prefijo: 'FAC',
      p_user_id: userId,
    })

    if (nextError) {
      return { data: null, error: nextError, numero: null as string | null }
    }

    const row = Array.isArray(nextData) ? nextData[0] : null
    numeroFinal = (row?.numero as string | undefined) ?? ''
  }

  const payload: Record<string, unknown> =
    table === 'albaranes'
      ? {
          user_id: userId,
          numero: document.numero,
          fecha: document.fecha,
          cliente_nombre: document.cliente.nombre,
          cliente_nif: document.cliente.nif,
          cliente_email: document.cliente.email,
          cliente_direccion: document.cliente.direccion,
          descripcion: resumenConcepto(document.lineas),
          estado: 'pendiente',
          notas: document.notas,
          datos_json: document,
        }
      : {
          user_id: userId,
          // Facturas nuevas: numeración asignada en este guardado.
          // Facturas existentes: no se modifica (inmutabilidad de número).
          ...(table === 'facturas' && id ? {} : { numero: table === 'facturas' ? numeroFinal : document.numero }),
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
          estado: 'borrador',
          notas: document.notas,
          datos_json: { ...document, numero: table === 'facturas' ? numeroFinal : document.numero },
        }

  const result = await writeRowWithRetry({ table, id, payload })
  return { ...result, numero: table === 'facturas' ? numeroFinal : document.numero }
}

export async function saveLegalDocument(params: {
  table: 'contratos' | 'ndas' | 'reclamaciones'
  userId: string
  document: LegalDoc
  id?: string
}) {
  const { table, userId, document, id } = params

  let payload: Record<string, unknown>

  if (table === 'contratos') {
    const contrato = document as ContratoServiciosDoc
    payload = {
      user_id: userId,
      titulo: contrato.metadatos.referencia || contrato.objetoContrato.slice(0, 80) || 'Contrato',
      fecha: contrato.metadatos.fecha,
      cliente_nombre: contrato.cliente.nombre,
      cliente_nif: contrato.cliente.nif,
      cliente_email: contrato.cliente.email,
      tipo: 'servicios',
      estado: 'borrador',
      notas: contrato.notas,
      datos_json: contrato,
    }
  } else if (table === 'ndas') {
    const nda = document as NdaDoc
    payload = {
      user_id: userId,
      titulo: nda.metadatos.referencia || `NDA ${nda.parteB.nombre || ''}`.trim() || 'NDA',
      fecha: nda.metadatos.fecha,
      otra_parte_nombre: nda.parteB.nombre,
      otra_parte_nif: nda.parteB.nif,
      otra_parte_email: nda.parteB.email,
      estado: 'borrador',
      notas: nda.notas,
      datos_json: nda,
    }
  } else {
    const reclamacion = document as ReclamacionPagoDoc
    payload = {
      user_id: userId,
      titulo: reclamacion.metadatos.referencia || `Reclamacion ${reclamacion.deudor.nombre || ''}`.trim() || 'Reclamación',
      fecha: reclamacion.metadatos.fecha,
      deudor_nombre: reclamacion.deudor.nombre,
      deudor_nif: reclamacion.deudor.nif,
      deudor_email: reclamacion.deudor.email,
      importe: reclamacion.importeDeuda,
      estado: 'borrador',
      notas: reclamacion.notas,
      datos_json: reclamacion,
    }
  }

  return writeRowWithRetry({ table, id, payload })
}

export async function getStoredUserDocument(table: UserDocumentTable, id: string) {
  const { data, error } = await supabase
    .from(table)
    .select('id, datos_json')
    .eq('id', id)
    .single()

  return { data: data as UserDocumentRow | null, error }
}
