// ─── Tipos base compartidos por todos los documentos ─────────────────────────

export interface EmisorInfo {
  nombre: string
  nif: string
  direccion: string
  ciudad: string
  cp: string
  provincia: string
  email: string
  telefono?: string
  logo?: string
}

export interface ClienteInfo {
  nombre: string
  nif: string
  direccion: string
  ciudad: string
  cp: string
  provincia: string
  email?: string
  pais?: string
  clienteExterior?: boolean
}

export interface LineaDocumento {
  id: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  iva: number
  irpf: number
}

export interface TotalesDocumento {
  baseImponible: number
  totalIva: number
  totalIrpf: number
  total: number
}

export type TipoDocumento = 'factura' | 'presupuesto' | 'albaran'

// ─── Forma de pago ────────────────────────────────────────────────────────────
export type MetodoPago =
  | 'transferencia'
  | 'bizum'
  | 'paypal'
  | 'efectivo'
  | 'cheque'
  | 'otro'

export interface FormaPago {
  metodo: MetodoPago
  cuenta?: string    // IBAN — transferencia bancaria
  telefono?: string  // Bizum / PayPal teléfono
  email?: string     // PayPal email
  detalle?: string   // Otro
}

export const ETIQUETAS_METODO_PAGO: Record<MetodoPago, string> = {
  transferencia: 'Transferencia bancaria',
  bizum: 'Bizum',
  paypal: 'PayPal',
  efectivo: 'Efectivo',
  cheque: 'Cheque',
  otro: 'Otro',
}

// ─── Documento base ───────────────────────────────────────────────────────────
export interface DocumentoBase {
  tipo: TipoDocumento
  numero: string
  fecha: string
  fechaVencimiento?: string
  emisor: EmisorInfo
  cliente: ClienteInfo
  lineas: LineaDocumento[]
  notas?: string
  mostrarIrpf: boolean
  formaPago?: FormaPago
}

// Valores por defecto para líneas nuevas
export const DEFAULT_LINEA: Omit<LineaDocumento, 'id'> = {
  descripcion: '',
  cantidad: 1,
  precioUnitario: 0,
  iva: 21,
  irpf: 15,
}

export const TIPOS_IVA = [0, 4, 10, 21] as const
export const TIPOS_IRPF = [0, 7, 15, 19] as const
