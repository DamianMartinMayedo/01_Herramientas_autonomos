export type FacturaStatus = 'borrador' | 'emitida' | 'cobrada' | 'anulada'

export const FACTURA_STATUS_LABELS: Record<FacturaStatus, string> = {
  borrador: 'Borrador',
  emitida: 'Emitida',
  cobrada: 'Cobrada',
  anulada: 'Anulada',
}

export function isFacturaStatus(value: string): value is FacturaStatus {
  return value === 'borrador' || value === 'emitida' || value === 'cobrada' || value === 'anulada'
}

export function canDeleteFactura(status: string) {
  return status === 'borrador'
}

export function canMarkFacturaAsCobrada(status: string) {
  return status === 'emitida'
}

export function canMarkFacturaAsEmitida(status: string) {
  return status === 'borrador'
}

export function canMarkFacturaAsNoCobrada(status: string) {
  return status === 'cobrada'
}
