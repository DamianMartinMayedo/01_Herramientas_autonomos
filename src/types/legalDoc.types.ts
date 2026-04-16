/**
 * legalDoc.types.ts
 * Tipos para documentos legales de texto estructurado.
 * Familia independiente de document.types.ts (sin líneas con importes).
 *
 * Documentos cubiertos:
 *   - ContratoServiciosDoc  → contrato de prestación de servicios
 *   - NdaDoc                → acuerdo de confidencialidad
 *   - ReclamacionPagoDoc    → carta formal de reclamación de pago
 */

// ─── Parte (emisor / receptor) ────────────────────────────────────────────────
// Versión simplificada: los documentos legales no necesitan datos fiscales
// completos, pero sí nombre, NIF, dirección y contacto básico.

export interface ParteLegal {
  nombre: string          // Nombre completo o razón social
  nif: string             // NIF / CIF / NIE
  direccion: string       // Calle + número
  ciudad: string
  cp: string
  provincia?: string
  email?: string
  telefono?: string
  representante?: string  // Persona física que firma (para personas jurídicas)
  cargo?: string          // Cargo del representante
}

// ─── Metadatos comunes ────────────────────────────────────────────────────────
// Todos los documentos legales comparten: lugar, fecha y número de referencia.

export interface MetadatosLegal {
  referencia: string      // Referencia o número identificador del documento
  lugar: string           // Ciudad donde se firma
  fecha: string           // ISO date string (YYYY-MM-DD)
}

// ─── Contrato de servicios ────────────────────────────────────────────────────

export type DuracionContrato =
  | 'indefinido'
  | 'fecha_fin'
  | 'por_proyecto'

export type PeriodoFacturacion =
  | 'pago_unico'
  | 'mensual'
  | 'quincenal'
  | 'semanal'
  | 'por_hito'

export interface ContratoServiciosDoc {
  tipo: 'contrato'
  metadatos: MetadatosLegal
  prestador: ParteLegal   // Quien presta el servicio (autónomo)
  cliente: ParteLegal     // Quien contrata

  // Objeto del contrato
  objetoContrato: string  // Descripción del servicio / trabajo a realizar

  // Condiciones económicas
  importeTotal?: number   // Importe total acordado (opcional si es por horas)
  periodoFacturacion: PeriodoFacturacion
  formaPago?: string      // Descripción libre: transferencia, domiciliación…

  // Duración
  duracion: DuracionContrato
  fechaInicio: string     // ISO date string
  fechaFin?: string       // Solo si duracion === 'fecha_fin'

  // Cláusulas adicionales
  clausulaConfidencialidad: boolean  // Si incluir cláusula de confidencialidad
  clausulaPropiedadIntelectual: boolean  // Cesión de derechos de PI
  penalizacionIncumplimiento?: string   // Texto libre para penalizaciones

  // Jurisdicción
  jurisdiccion: string    // Ciudad/juzgado competente en caso de conflicto
  notas?: string
}

// ─── NDA — Acuerdo de confidencialidad ───────────────────────────────────────

export type DirectionNda =
  | 'unilateral'    // Solo una parte se obliga
  | 'bilateral'     // Ambas partes se obligan

export interface NdaDoc {
  tipo: 'nda'
  metadatos: MetadatosLegal
  parteA: ParteLegal      // Quien divulga información (o ambas si bilateral)
  parteB: ParteLegal      // Quien la recibe

  direction: DirectionNda

  // Alcance
  objetoConfidencialidad: string  // Qué información se considera confidencial
  excepciones?: string            // Qué no se considera confidencial

  // Duración de la obligación
  duracionMeses: number           // Nº de meses desde la firma

  // Consecuencias
  penalizacion?: string           // Texto libre

  // Jurisdicción
  jurisdiccion: string
  notas?: string
}

// ─── Carta de reclamación de pago ─────────────────────────────────────────────

export type TonoReclamacion =
  | 'amistoso'    // Primera vez, tono cordial
  | 'formal'      // Segunda notificación, más firme
  | 'urgente'     // Aviso previo a acciones legales

export interface ReclamacionPagoDoc {
  tipo: 'reclamacion'
  metadatos: MetadatosLegal
  acreedor: ParteLegal    // Quien reclama el pago
  deudor: ParteLegal      // Quien debe pagar

  // Deuda
  referenciaFactura: string   // Nº de factura impagada
  fechaFactura: string        // ISO date string
  fechaVencimiento: string    // ISO date string — cuándo debía haberse pagado
  importeDeuda: number        // Importe pendiente en €

  // Configuración de la carta
  tono: TonoReclamacion
  plazoRespuesta: number      // Días para pagar antes de escalar

  // Escalada (solo si tono === 'urgente')
  mencionAccionLegal: boolean // Si mencionar explícitamente acciones legales

  notas?: string
}

// ─── Unión discriminada ───────────────────────────────────────────────────────
// Permite usar un solo tipo en funciones genéricas de preview / export.

export type LegalDoc =
  | ContratoServiciosDoc
  | NdaDoc
  | ReclamacionPagoDoc

export type TipoLegalDoc = LegalDoc['tipo']

// ─── Valores por defecto ──────────────────────────────────────────────────────

export const DEFAULT_PARTE_LEGAL: ParteLegal = {
  nombre: '',
  nif: '',
  direccion: '',
  ciudad: '',
  cp: '',
  provincia: '',
  email: '',
  telefono: '',
  representante: '',
  cargo: '',
}

export const DEFAULT_METADATOS: MetadatosLegal = {
  referencia: '',
  lugar: '',
  fecha: new Date().toISOString().slice(0, 10),
}
