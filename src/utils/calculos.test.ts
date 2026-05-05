import { describe, it, expect } from 'vitest'
import { calcularLinea, calcularTotales, generarNumeroDocumento } from './calculos'
import type { LineaDocumento } from '../types/document.types'

function linea(over: Partial<LineaDocumento> = {}): LineaDocumento {
  return {
    id: 'x',
    descripcion: '',
    cantidad: 1,
    precioUnitario: 100,
    iva: 21,
    irpf: 15,
    ...over,
  }
}

describe('calcularLinea', () => {
  it('aplica IVA e IRPF estándar (21% + 15%)', () => {
    const r = calcularLinea(linea())
    expect(r.base).toBe(100)
    expect(r.iva).toBe(21)
    expect(r.irpf).toBe(15)
    expect(r.total).toBe(106)
  })

  it('multiplica cantidad por precio unitario', () => {
    const r = calcularLinea(linea({ cantidad: 3, precioUnitario: 50 }))
    expect(r.base).toBe(150)
    expect(r.iva).toBe(150 * 0.21)
    expect(r.irpf).toBe(150 * 0.15)
  })

  it('línea sin IVA ni IRPF (cliente exterior reflejado)', () => {
    const r = calcularLinea(linea({ iva: 0, irpf: 0 }))
    expect(r.iva).toBe(0)
    expect(r.irpf).toBe(0)
    expect(r.total).toBe(100)
  })
})

describe('calcularTotales', () => {
  it('lista vacía → todos los totales en 0', () => {
    const t = calcularTotales([], true)
    expect(t).toEqual({ baseImponible: 0, totalIva: 0, totalIrpf: 0, total: 0 })
  })

  it('línea única con IRPF activo', () => {
    const t = calcularTotales([linea()], true)
    expect(t.baseImponible).toBe(100)
    expect(t.totalIva).toBe(21)
    expect(t.totalIrpf).toBe(15)
    expect(t.total).toBe(106)
  })

  it('mostrarIrpf=false ignora el IRPF en el total', () => {
    const t = calcularTotales([linea()], false)
    expect(t.totalIrpf).toBe(0)
    expect(t.total).toBe(121) // 100 + 21
  })

  it('suma varias líneas con tipos de IVA distintos', () => {
    const t = calcularTotales(
      [
        linea({ cantidad: 2, precioUnitario: 50, iva: 21, irpf: 15 }),
        linea({ cantidad: 1, precioUnitario: 200, iva: 10, irpf: 15 }),
      ],
      true,
    )
    expect(t.baseImponible).toBe(300)
    expect(t.totalIva).toBeCloseTo(2 * 50 * 0.21 + 200 * 0.10, 5)
    expect(t.totalIrpf).toBeCloseTo(300 * 0.15, 5)
    expect(t.total).toBeCloseTo(t.baseImponible + t.totalIva - t.totalIrpf, 5)
  })

  it('cliente exterior: IVA 0 e IRPF 0 → total = base imponible', () => {
    const t = calcularTotales(
      [
        linea({ iva: 0, irpf: 0, precioUnitario: 500 }),
        linea({ iva: 0, irpf: 0, precioUnitario: 250 }),
      ],
      false,
    )
    expect(t.totalIva).toBe(0)
    expect(t.totalIrpf).toBe(0)
    expect(t.total).toBe(750)
  })

  it('soporta cantidades fraccionarias', () => {
    const t = calcularTotales([linea({ cantidad: 1.5, precioUnitario: 80, iva: 21, irpf: 0 })], false)
    expect(t.baseImponible).toBeCloseTo(120, 5)
    expect(t.totalIva).toBeCloseTo(25.2, 5)
    expect(t.total).toBeCloseTo(145.2, 5)
  })
})

describe('generarNumeroDocumento', () => {
  it('formatea con prefijo, año actual y secuencia con padding 3', () => {
    const año = new Date().getFullYear()
    expect(generarNumeroDocumento('FAC', 1)).toBe(`FAC-${año}-001`)
    expect(generarNumeroDocumento('PRE', 42)).toBe(`PRE-${año}-042`)
    expect(generarNumeroDocumento('ALB', 999)).toBe(`ALB-${año}-999`)
  })

  it('mantiene el padding incluso para números >= 1000', () => {
    const año = new Date().getFullYear()
    expect(generarNumeroDocumento('FAC', 1234)).toBe(`FAC-${año}-1234`)
  })
})
