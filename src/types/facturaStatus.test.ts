import { describe, it, expect } from 'vitest'
import {
  isFacturaStatus,
  canDeleteFactura,
  canMarkFacturaAsCobrada,
  canMarkFacturaAsEmitida,
  canMarkFacturaAsNoCobrada,
  FACTURA_STATUS_LABELS,
} from './facturaStatus'

describe('isFacturaStatus', () => {
  it('reconoce los 4 estados válidos', () => {
    expect(isFacturaStatus('borrador')).toBe(true)
    expect(isFacturaStatus('emitida')).toBe(true)
    expect(isFacturaStatus('cobrada')).toBe(true)
    expect(isFacturaStatus('anulada')).toBe(true)
  })

  it('rechaza valores no reconocidos', () => {
    expect(isFacturaStatus('')).toBe(false)
    expect(isFacturaStatus('emitido')).toBe(false) // typo común
    expect(isFacturaStatus('cancelada')).toBe(false)
  })
})

describe('transiciones de estado factura', () => {
  it('canDeleteFactura: solo borrador', () => {
    expect(canDeleteFactura('borrador')).toBe(true)
    expect(canDeleteFactura('emitida')).toBe(false)
    expect(canDeleteFactura('cobrada')).toBe(false)
    expect(canDeleteFactura('anulada')).toBe(false)
  })

  it('canMarkFacturaAsEmitida: solo desde borrador', () => {
    expect(canMarkFacturaAsEmitida('borrador')).toBe(true)
    expect(canMarkFacturaAsEmitida('emitida')).toBe(false)
    expect(canMarkFacturaAsEmitida('cobrada')).toBe(false)
  })

  it('canMarkFacturaAsCobrada: solo desde emitida', () => {
    expect(canMarkFacturaAsCobrada('emitida')).toBe(true)
    expect(canMarkFacturaAsCobrada('borrador')).toBe(false)
    expect(canMarkFacturaAsCobrada('cobrada')).toBe(false)
    expect(canMarkFacturaAsCobrada('anulada')).toBe(false)
  })

  it('canMarkFacturaAsNoCobrada: solo desde cobrada', () => {
    expect(canMarkFacturaAsNoCobrada('cobrada')).toBe(true)
    expect(canMarkFacturaAsNoCobrada('emitida')).toBe(false)
  })
})

describe('FACTURA_STATUS_LABELS', () => {
  it('tiene una etiqueta por cada estado', () => {
    expect(FACTURA_STATUS_LABELS.borrador).toBe('Borrador')
    expect(FACTURA_STATUS_LABELS.emitida).toBe('Emitida')
    expect(FACTURA_STATUS_LABELS.cobrada).toBe('Cobrada')
    expect(FACTURA_STATUS_LABELS.anulada).toBe('Anulada')
  })
})
