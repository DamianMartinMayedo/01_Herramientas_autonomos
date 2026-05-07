// ============================================
// Registry de herramientas documentales
// ============================================
// Una entrada por tabla documental. Centraliza:
//   - Metadatos (label, ruta, prefijo de numeración, estados).
//   - Política de asignación de número (cuándo llamar a `next_document_number`).
//   - Construcción del payload SQL (delegado al guardado).
//
// Para añadir una herramienta nueva (Regla #10 de AGENTS.md):
//   1. Crear la migración SQL desde la plantilla.
//   2. Añadir una entrada en `documentRegistry` (al final del archivo).
//   3. `UserDocumentTable` se deriva automáticamente de las keys.
//   4. `npm run gen:types` para refrescar tipos de BD.
//
// IMPORTANTE: nunca hagas `supabase.from(table).insert/update` directamente.
// El payload SIEMPRE pasa por `writeRowWithRetry` (en `userDocuments.ts`),
// que protege contra corrupción de `datos_json` (ver Regla #10 paso 6).

import { supabase } from './supabaseClient'
import type { DocumentoBase, TotalesDocumento } from '../types/document.types'
import type {
  ContratoServiciosDoc,
  NdaDoc,
  ReclamacionPagoDoc,
} from '../types/legalDoc.types'

// ─── Tipos públicos ──────────────────────────────────

export type DocumentFamily = 'business' | 'legal'

export interface BuildPayloadCtx<TDoc> {
  document: TDoc
  numero: string | null
  finalizar: boolean
  userId: string
  id?: string
  totals?: TotalesDocumento
}

export interface AssignNumeroCtx<TDoc> {
  document: TDoc
  finalizar: boolean
  userId: string
  id?: string
}

export interface ListadoMetadata {
  articuloFemenino: boolean
  campoTitulo: string
  campoSecundario: string
  campoPrecio?: string
}

export interface DocumentRegistryEntry<TDoc> {
  table: string
  family: DocumentFamily
  sequenceTipo: string
  sequencePrefijo: string
  label: { singular: string; plural: string }
  routePath: string
  estados: readonly string[]
  estadoBorrador: string
  estadoFinalizado: string
  listado: ListadoMetadata
  assignNumero: (
    ctx: AssignNumeroCtx<TDoc>,
  ) => Promise<{ numero: string | null; error: unknown }>
  buildPayload: (ctx: BuildPayloadCtx<TDoc>) => Record<string, unknown>
}

// ─── Helpers internos ────────────────────────────────

async function getNextNumero(
  userId: string,
  tipo: string,
  prefijo: string,
): Promise<{ numero: string | null; error: unknown }> {
  const { data, error } = await supabase.rpc('next_document_number', {
    p_tipo: tipo,
    p_prefijo: prefijo,
    p_user_id: userId,
  })
  if (error) return { numero: null, error }
  const row = Array.isArray(data) ? (data[0] as { numero?: string } | undefined) : null
  return { numero: row?.numero ?? null, error: null }
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

// ─── Entradas: business documents ────────────────────

const facturasEntry: DocumentRegistryEntry<DocumentoBase> = {
  table: 'facturas',
  family: 'business',
  sequenceTipo: 'factura',
  sequencePrefijo: 'FAC',
  label: { singular: 'factura', plural: 'Facturas' },
  routePath: '/factura',
  estados: ['borrador', 'emitida', 'cobrada', 'cancelada'] as const,
  estadoBorrador: 'borrador',
  estadoFinalizado: 'emitida',
  listado: {
    articuloFemenino: true,
    campoTitulo: 'numero',
    campoSecundario: 'cliente_nombre',
    campoPrecio: 'total',
  },
  async assignNumero({ document, finalizar, userId }) {
    if (!finalizar) return { numero: null, error: null }
    return document.esRectificativa
      ? getNextNumero(userId, 'rectificativa', 'R')
      : getNextNumero(userId, 'factura', 'FAC')
  },
  buildPayload({ document, numero, finalizar, userId, totals }) {
    if (!totals) throw new Error('facturas requires totals')
    const payload: Record<string, unknown> = {
      user_id: userId,
      fecha: document.fecha,
      cliente_nombre: document.cliente.nombre,
      cliente_nif: document.cliente.nif,
      cliente_email: document.cliente.email,
      cliente_direccion: document.cliente.direccion,
      concepto: resumenConcepto(document.lineas),
      base_imponible: totals.baseImponible,
      tipo_iva: firstNumber(document.lineas.map((l) => l.iva), 21),
      tipo_irpf: document.mostrarIrpf
        ? firstNumber(document.lineas.map((l) => l.irpf), 15)
        : 0,
      total: totals.total,
      estado: finalizar ? 'emitida' : 'borrador',
      notas: document.notas,
      datos_json: {
        ...document,
        numero: finalizar ? (numero ?? '') : (document.numero ?? ''),
      },
    }
    if (finalizar) payload.numero = numero
    return payload
  },
}

const presupuestosEntry: DocumentRegistryEntry<DocumentoBase> = {
  table: 'presupuestos',
  family: 'business',
  sequenceTipo: 'presupuesto',
  sequencePrefijo: 'PRE',
  label: { singular: 'presupuesto', plural: 'Presupuestos' },
  routePath: '/presupuesto',
  estados: ['borrador', 'enviado', 'aceptado', 'rechazado', 'caducado'] as const,
  estadoBorrador: 'borrador',
  estadoFinalizado: 'enviado',
  listado: {
    articuloFemenino: false,
    campoTitulo: 'numero',
    campoSecundario: 'cliente_nombre',
    campoPrecio: 'total',
  },
  async assignNumero({ finalizar, userId, id }) {
    const debeAsignar = finalizar || !id
    if (!debeAsignar) return { numero: null, error: null }
    return getNextNumero(userId, 'presupuesto', 'PRE')
  },
  buildPayload({ document, numero, finalizar, userId, id, totals }) {
    if (!totals) throw new Error('presupuestos requires totals')
    const asignarNum = finalizar || !id
    const payload: Record<string, unknown> = {
      user_id: userId,
      fecha: document.fecha,
      cliente_nombre: document.cliente.nombre,
      cliente_nif: document.cliente.nif,
      cliente_email: document.cliente.email,
      cliente_direccion: document.cliente.direccion,
      concepto: resumenConcepto(document.lineas),
      base_imponible: totals.baseImponible,
      tipo_iva: firstNumber(document.lineas.map((l) => l.iva), 21),
      tipo_irpf: document.mostrarIrpf
        ? firstNumber(document.lineas.map((l) => l.irpf), 15)
        : 0,
      total: totals.total,
      notas: document.notas,
      datos_json: {
        ...document,
        numero: asignarNum ? (numero ?? '') : (document.numero ?? ''),
      },
    }
    if (asignarNum) payload.numero = numero
    if (!(id && !finalizar)) {
      payload.estado = finalizar ? 'enviado' : 'borrador'
    }
    return payload
  },
}

const albaranesEntry: DocumentRegistryEntry<DocumentoBase> = {
  table: 'albaranes',
  family: 'business',
  sequenceTipo: 'albaran',
  sequencePrefijo: 'ALB',
  label: { singular: 'albarán', plural: 'Albaranes' },
  routePath: '/albaran',
  estados: ['pendiente', 'entregado', 'firmado'] as const,
  estadoBorrador: 'pendiente',
  estadoFinalizado: 'enviado',
  listado: {
    articuloFemenino: false,
    campoTitulo: 'numero',
    campoSecundario: 'cliente_nombre',
  },
  async assignNumero({ id, userId, document }) {
    if (id) return { numero: document.numero, error: null }
    return getNextNumero(userId, 'albaran', 'ALB')
  },
  buildPayload({ document, numero, finalizar, userId }) {
    return {
      user_id: userId,
      numero,
      fecha: document.fecha,
      cliente_nombre: document.cliente.nombre,
      cliente_nif: document.cliente.nif,
      cliente_email: document.cliente.email,
      cliente_direccion: document.cliente.direccion,
      descripcion: resumenConcepto(document.lineas),
      estado: finalizar ? 'enviado' : 'pendiente',
      notas: document.notas,
      datos_json: { ...document, numero: numero ?? '' },
    }
  },
}

// ─── Entradas: legal documents ───────────────────────

const contratosEntry: DocumentRegistryEntry<ContratoServiciosDoc> = {
  table: 'contratos',
  family: 'legal',
  sequenceTipo: 'contrato',
  sequencePrefijo: 'CON',
  label: { singular: 'contrato', plural: 'Contratos' },
  routePath: '/contrato',
  estados: ['borrador', 'enviado', 'firmado', 'finalizado'] as const,
  estadoBorrador: 'borrador',
  estadoFinalizado: 'enviado',
  listado: {
    articuloFemenino: false,
    campoTitulo: 'numero',
    campoSecundario: 'cliente_nombre',
  },
  async assignNumero({ document, id, userId }) {
    const numeroExistente = document.metadatos.referencia || null
    if (id || numeroExistente) {
      return { numero: numeroExistente, error: null }
    }
    return getNextNumero(userId, 'contrato', 'CON')
  },
  buildPayload({ document, numero, finalizar, userId, id }) {
    const numeroExistente = document.metadatos.referencia || null
    const payload: Record<string, unknown> = {
      user_id: userId,
      titulo: document.objetoContrato.slice(0, 80) || 'Contrato',
      fecha: document.metadatos.fecha,
      cliente_nombre: document.cliente.nombre,
      cliente_nif: document.cliente.nif,
      cliente_email: document.cliente.email,
      tipo: 'servicios',
      estado: finalizar ? 'enviado' : 'borrador',
      notas: document.notas,
      datos_json: {
        ...document,
        metadatos: {
          ...document.metadatos,
          referencia: numero ?? numeroExistente ?? '',
        },
      },
    }
    if (!id || numeroExistente) {
      payload.numero = numero ?? numeroExistente
    }
    return payload
  },
}

const ndasEntry: DocumentRegistryEntry<NdaDoc> = {
  table: 'ndas',
  family: 'legal',
  sequenceTipo: 'nda',
  sequencePrefijo: 'NDA',
  label: { singular: 'NDA', plural: 'NDAs' },
  routePath: '/nda',
  estados: ['borrador', 'enviado', 'firmado'] as const,
  estadoBorrador: 'borrador',
  estadoFinalizado: 'enviado',
  listado: {
    articuloFemenino: false,
    campoTitulo: 'numero',
    campoSecundario: 'otra_parte_nombre',
  },
  async assignNumero({ document, id, userId }) {
    const numeroExistente = document.metadatos.referencia || null
    if (id || numeroExistente) {
      return { numero: numeroExistente, error: null }
    }
    return getNextNumero(userId, 'nda', 'NDA')
  },
  buildPayload({ document, numero, finalizar, userId, id }) {
    const numeroExistente = document.metadatos.referencia || null
    const numeroFinal = numero ?? numeroExistente
    const payload: Record<string, unknown> = {
      user_id: userId,
      titulo: numeroFinal || `NDA ${document.parteB.nombre || ''}`.trim() || 'NDA',
      fecha: document.metadatos.fecha,
      otra_parte_nombre: document.parteB.nombre,
      otra_parte_nif: document.parteB.nif,
      otra_parte_email: document.parteB.email,
      estado: finalizar ? 'enviado' : 'borrador',
      notas: document.notas,
      datos_json: {
        ...document,
        metadatos: { ...document.metadatos, referencia: numeroFinal ?? '' },
      },
    }
    if (!id || numeroExistente) {
      payload.numero = numeroFinal
    }
    return payload
  },
}

const reclamacionesEntry: DocumentRegistryEntry<ReclamacionPagoDoc> = {
  table: 'reclamaciones',
  family: 'legal',
  sequenceTipo: 'reclamacion',
  sequencePrefijo: 'REC',
  label: { singular: 'reclamación', plural: 'Reclamaciones' },
  routePath: '/reclamacion-pago',
  estados: ['borrador', 'enviada', 'resuelta'] as const,
  estadoBorrador: 'borrador',
  estadoFinalizado: 'enviada',
  listado: {
    articuloFemenino: true,
    campoTitulo: 'numero',
    campoSecundario: 'deudor_nombre',
    campoPrecio: 'importe',
  },
  async assignNumero({ document, id, userId }) {
    const numeroExistente = document.metadatos.referencia || null
    if (id || numeroExistente) {
      return { numero: numeroExistente, error: null }
    }
    return getNextNumero(userId, 'reclamacion', 'REC')
  },
  buildPayload({ document, numero, finalizar, userId, id }) {
    const numeroExistente = document.metadatos.referencia || null
    const numeroFinal = numero ?? numeroExistente
    const payload: Record<string, unknown> = {
      user_id: userId,
      titulo:
        numeroFinal ||
        `Reclamacion ${document.deudor.nombre || ''}`.trim() ||
        'Reclamación',
      fecha: document.metadatos.fecha,
      deudor_nombre: document.deudor.nombre,
      deudor_nif: document.deudor.nif,
      deudor_email: document.deudor.email,
      importe: document.importeDeuda,
      estado: finalizar ? 'enviada' : 'borrador',
      notas: document.notas,
      datos_json: {
        ...document,
        metadatos: { ...document.metadatos, referencia: numeroFinal ?? '' },
      },
    }
    if (!id || numeroExistente) {
      payload.numero = numeroFinal
    }
    return payload
  },
}

// ─── Manifest exportado ──────────────────────────────

export const documentRegistry = {
  facturas: facturasEntry,
  presupuestos: presupuestosEntry,
  albaranes: albaranesEntry,
  contratos: contratosEntry,
  ndas: ndasEntry,
  reclamaciones: reclamacionesEntry,
} as const

export type UserDocumentTable = keyof typeof documentRegistry

export const userDocumentTables = Object.keys(
  documentRegistry,
) as UserDocumentTable[]

export function getRegistryEntry(table: UserDocumentTable) {
  return documentRegistry[table]
}
