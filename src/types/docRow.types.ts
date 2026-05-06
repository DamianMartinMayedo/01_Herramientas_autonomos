// ─── Tipos para filas de listado (DocumentoListado) ────────────────────────────
// DocRow es un tipo genérico porque DocumentoListado trabaja con 6 tablas distintas.
// Se mantiene como any para evitar casts en cada acceso a row.* en el componente.

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- intentionally any per AGENTS.md rule #2: DocRow must be Record<string, any>
export type DocRow = Record<string, any>

export function getClienteEmail(row: DocRow): string | undefined {
  if (typeof row.cliente_email === 'string') return row.cliente_email
  if (typeof row.otra_parte_email === 'string') return row.otra_parte_email
  if (typeof row.deudor_email === 'string') return row.deudor_email
  const datos = row.datos_json as Record<string, unknown> | undefined
  if (datos?.cliente && typeof datos.cliente === 'object') {
    const cliente = datos.cliente as Record<string, unknown>
    if (typeof cliente.email === 'string') return cliente.email
    if (typeof cliente.correo === 'string') return cliente.correo
  }
  if (datos?.parteB && typeof datos.parteB === 'object') {
    const parteB = datos.parteB as Record<string, unknown>
    if (typeof parteB.email === 'string') return parteB.email
  }
  if (datos?.deudor && typeof datos.deudor === 'object') {
    const deudor = datos.deudor as Record<string, unknown>
    if (typeof deudor.email === 'string') return deudor.email
  }
  return undefined
}