import { describe, it, expect } from 'vitest'
import { validarNif } from './validarNif'

describe('validarNif — DNI', () => {
  it('acepta DNIs válidos', () => {
    expect(validarNif('12345678Z')).toBe(true)
    expect(validarNif('00000000T')).toBe(true)
  })

  it('rechaza DNI con letra de control incorrecta', () => {
    expect(validarNif('12345678A')).toBe('DNI no válido (la letra no coincide)')
  })

  it('normaliza puntos y guiones', () => {
    expect(validarNif('12.345.678-Z')).toBe(true)
  })

  it('normaliza espacios y mayúsculas', () => {
    expect(validarNif(' 12345678z ')).toBe(true)
  })
})

describe('validarNif — NIE', () => {
  it('acepta NIE válido empezando por X', () => {
    expect(validarNif('X1234567L')).toBe(true)
  })

  it('rechaza NIE con letra incorrecta', () => {
    expect(validarNif('X1234567A')).toBe('NIE no válido (letra de control incorrecta)')
  })
})

describe('validarNif — CIF', () => {
  it('acepta CIF válido con dígito de control', () => {
    expect(validarNif('B12345674')).toBe(true)
  })

  it('acepta CIF válido empezando por A (sociedad anónima)', () => {
    expect(validarNif('A12345674')).toBe(true)
  })

  it('rechaza CIF con dígito de control incorrecto', () => {
    expect(validarNif('B12345670')).toBe('CIF no válido (dígito de control incorrecto)')
  })

  it('rechaza CIF cuya primera letra no es válida (O no es organización)', () => {
    expect(validarNif('O12345674')).toMatch(/Formato no reconocido/)
  })
})

describe('validarNif — errores generales', () => {
  it('valor vacío devuelve mensaje obligatorio', () => {
    expect(validarNif('')).toBe('El NIF/CIF es obligatorio')
    expect(validarNif('   ')).toBe('El NIF/CIF es obligatorio')
  })

  it('longitud distinta de 9 devuelve error específico', () => {
    expect(validarNif('1234567')).toBe('Debe tener 9 caracteres (tiene 7)')
    expect(validarNif('1234567890')).toBe('Debe tener 9 caracteres (tiene 10)')
  })

  it('formato no reconocido cuando no encaja con DNI/NIE/CIF', () => {
    expect(validarNif('ABCDEFGHI')).toMatch(/Formato no reconocido/)
  })
})
