/**
 * Valida NIF (DNI), NIE y CIF españoles.
 * Devuelve true si es válido, o un string con el mensaje de error.
 *
 * CORRECCIONES respecto a la versión anterior:
 *  - CIF: regex incluye TODAS las letras válidas (A-H, J-N, P-S, U-W)
 *    La versión anterior solo tenía [AHJNPQRSUVW] — faltaban B,C,D,E,F,G
 *  - Se normalizan guiones y puntos: "47.256.831-T" → "47256831T"
 *  - Mensajes de error más descriptivos
 */
export function validarNif(valor: string): true | string {
  // Normalizar: quitar espacios, guiones y puntos que la gente suele escribir
  const nif = valor.trim().toUpperCase().replace(/[\s.-]/g, '')

  if (!nif) return 'El NIF/CIF es obligatorio'

  if (nif.length !== 9) {
    return `Debe tener 9 caracteres (tiene ${nif.length})`
  }

  // ── CIF ──────────────────────────────────────────────────────────────────
  // Primera letra: A-H, J-N, P-S, U-W  (ojo: faltaban B,C,D,E,F,G en la versión anterior)
  // 7 dígitos + dígito o letra de control (0-9 o A-J)
  if (/^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/.test(nif)) {
    return validarCIF(nif) ? true : 'CIF no válido (dígito de control incorrecto)'
  }

  // ── NIE ──────────────────────────────────────────────────────────────────
  // Empieza por X, Y o Z + 7 dígitos + letra de control
  if (/^[XYZ]\d{7}[A-Z]$/.test(nif)) {
    const nifConvertido = nif
      .replace('X', '0')
      .replace('Y', '1')
      .replace('Z', '2')
    return validarDNI(nifConvertido) ? true : 'NIE no válido (letra de control incorrecta)'
  }

  // ── DNI ───────────────────────────────────────────────────────────────────
  // 8 dígitos + letra de control
  if (/^\d{8}[A-Z]$/.test(nif)) {
    return validarDNI(nif) ? true : 'DNI no válido (la letra no coincide)'
  }

  return 'Formato no reconocido — usa DNI (12345678Z), NIE (X1234567A) o CIF (B12345674)'
}

// ─── Funciones internas ───────────────────────────────────────────────────────

const LETRAS_DNI = 'TRWAGMYFPDXBNJZSQVHLCKE'

function validarDNI(nif: string): boolean {
  const numero = parseInt(nif.slice(0, 8), 10)
  const letra = nif.slice(-1)
  return LETRAS_DNI[numero % 23] === letra
}

function validarCIF(cif: string): boolean {
  const letrasControl = 'JABCDEFGHI'
  let suma = 0

  for (let i = 1; i <= 7; i++) {
    let digito = parseInt(cif[i], 10)
    if (i % 2 === 0) {
      suma += digito
    } else {
      digito *= 2
      suma += digito > 9 ? digito - 9 : digito
    }
  }

  const control = (10 - (suma % 10)) % 10
  const ultimo = cif.slice(-1)
  return ultimo === String(control) || ultimo === letrasControl[control]
}
