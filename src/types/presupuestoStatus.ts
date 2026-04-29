export type PresupuestoStatus = 'borrador' | 'enviado' | 'aprobado' | 'convertido'

export const PRESUPUESTO_STATUS_LABELS: Record<PresupuestoStatus, string> = {
  borrador:   'Borrador',
  enviado:    'Enviado',
  aprobado:   'Aprobado',
  convertido: 'Convertido',
}

export function isPresupuestoStatus(value: string): value is PresupuestoStatus {
  return value === 'borrador' || value === 'enviado' || value === 'aprobado' || value === 'convertido'
}
