import { describe, it, expect } from 'vitest'
import { isPresupuestoStatus, PRESUPUESTO_STATUS_LABELS } from './presupuestoStatus'

describe('isPresupuestoStatus', () => {
  it('reconoce los 4 estados válidos', () => {
    expect(isPresupuestoStatus('borrador')).toBe(true)
    expect(isPresupuestoStatus('enviado')).toBe(true)
    expect(isPresupuestoStatus('aprobado')).toBe(true)
    expect(isPresupuestoStatus('convertido')).toBe(true)
  })

  it('rechaza valores no reconocidos', () => {
    expect(isPresupuestoStatus('')).toBe(false)
    expect(isPresupuestoStatus('rechazado')).toBe(false)
    expect(isPresupuestoStatus('emitida')).toBe(false) // estado de factura
  })
})

describe('PRESUPUESTO_STATUS_LABELS', () => {
  it('tiene una etiqueta por cada estado', () => {
    expect(PRESUPUESTO_STATUS_LABELS.borrador).toBe('Borrador')
    expect(PRESUPUESTO_STATUS_LABELS.enviado).toBe('Enviado')
    expect(PRESUPUESTO_STATUS_LABELS.aprobado).toBe('Aprobado')
    expect(PRESUPUESTO_STATUS_LABELS.convertido).toBe('Convertido')
  })
})
