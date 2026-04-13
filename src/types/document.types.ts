// ─── Tipos base compartidos por todos los documentos ───────────────────────

export interface EmisorInfo {
  nombre: string
  nif: string
  direccion: string
  ciudad: string
  cp: string
  provincia: string
  email: string
  telefono?: string
  logo?: string // base64 o URL
}

export interface ClienteInfo {
  nombre: string
  nif: string
  direccion: string
  ciudad: string
  cp: string
  provincia: string
  email?: string
}

export interface LineaDocumento {
  id: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  iva: number      // porcentaje, ej: 21
  irpf: number     // porcentaje, ej: 15
}

export interface TotalesDocumento {
  baseImponible: number
  totalIva: number
  totalIrpf: number
  total: number
}

export type TipoDocumento = 'factura' | 'presupuesto' | 'albaran'

export interface DocumentoBase {
  tipo: TipoDocumento
  numero: string
  fecha: string
  fechaVencimiento?: string  // solo facturas/presupuestos
  emisor: EmisorInfo
  cliente: ClienteInfo
  lineas: LineaDocumento[]
  notas?: string
  mostrarIrpf: boolean
}

// Valores por defecto para líneas nuevas
export const DEFAULT_LINEA: Omit<LineaDocumento, 'id'> = {
  descripcion: '',
  cantidad: 1,
  precioUnitario: 0,
  iva: 21,
  irpf: 15,
}

// Tipos de IVA habituales en España
export const TIPOS_IVA = [0, 4, 10, 21] as const

// Tipos de IRPF habituales
export const TIPOS_IRPF = [0, 7, 15, 19] as const
