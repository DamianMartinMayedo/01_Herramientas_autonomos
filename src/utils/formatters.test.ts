import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatEuro, formatFecha, fechaHoy } from './formatters'

describe('formatEuro', () => {
  it('formatea cantidad entera con simbolo de euro', () => {
    const r = formatEuro(100)
    expect(r).toContain('€')
    expect(r).toMatch(/100/)
  })

  it('formatea decimales con 2 posiciones', () => {
    const r = formatEuro(1234.5)
    expect(r).toContain('€')
    expect(r.replace(/\s+/g, '')).toMatch(/1\.?234,50/)
  })

  it('formatea cero', () => {
    const r = formatEuro(0)
    expect(r).toMatch(/0,00/)
  })

  it('formatea negativos', () => {
    const r = formatEuro(-50)
    expect(r).toContain('50')
    expect(r).toMatch(/-|−/)
  })
})

describe('formatFecha', () => {
  it('convierte ISO yyyy-mm-dd a dd/mm/yyyy', () => {
    expect(formatFecha('2025-03-14')).toBe('14/03/2025')
  })

  it('cadena vacia devuelve cadena vacia', () => {
    expect(formatFecha('')).toBe('')
  })

  it('mantiene padding de dia y mes', () => {
    expect(formatFecha('2025-01-05')).toBe('05/01/2025')
  })
})

describe('fechaHoy', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('devuelve la fecha actual en formato yyyy-mm-dd', () => {
    vi.setSystemTime(new Date('2026-05-05T10:30:00Z'))
    expect(fechaHoy()).toBe('2026-05-05')
  })

  it('formato siempre 10 caracteres', () => {
    vi.setSystemTime(new Date('2030-12-31T23:59:59Z'))
    expect(fechaHoy()).toBe('2030-12-31')
    expect(fechaHoy()).toHaveLength(10)
  })
})
