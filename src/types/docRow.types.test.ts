import { describe, it, expect } from 'vitest'
import { getClienteEmail, type DocRow } from './docRow.types'

describe('getClienteEmail', () => {
  it('lee cliente_email (facturas/presupuestos/albaranes)', () => {
    const row: DocRow = { cliente_email: 'a@b.com' }
    expect(getClienteEmail(row)).toBe('a@b.com')
  })

  it('lee otra_parte_email (NDA)', () => {
    const row: DocRow = { otra_parte_email: 'nda@b.com' }
    expect(getClienteEmail(row)).toBe('nda@b.com')
  })

  it('lee deudor_email (reclamación)', () => {
    const row: DocRow = { deudor_email: 'deudor@b.com' }
    expect(getClienteEmail(row)).toBe('deudor@b.com')
  })

  it('cliente_email tiene prioridad sobre los demás', () => {
    const row: DocRow = {
      cliente_email: 'c@b.com',
      otra_parte_email: 'nda@b.com',
      deudor_email: 'deudor@b.com',
    }
    expect(getClienteEmail(row)).toBe('c@b.com')
  })

  it('fallback a datos_json.cliente.email cuando no hay columna desnormalizada', () => {
    const row: DocRow = { datos_json: { cliente: { email: 'inner@b.com' } } }
    expect(getClienteEmail(row)).toBe('inner@b.com')
  })

  it('fallback a datos_json.cliente.correo (alias)', () => {
    const row: DocRow = { datos_json: { cliente: { correo: 'alias@b.com' } } }
    expect(getClienteEmail(row)).toBe('alias@b.com')
  })

  it('devuelve undefined cuando no hay email', () => {
    expect(getClienteEmail({})).toBeUndefined()
    expect(getClienteEmail({ datos_json: {} })).toBeUndefined()
    expect(getClienteEmail({ datos_json: { cliente: {} } })).toBeUndefined()
  })

  it('ignora valores no string en cliente_email', () => {
    const row: DocRow = { cliente_email: 123 }
    expect(getClienteEmail(row)).toBeUndefined()
  })
})
