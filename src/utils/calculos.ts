import type { LineaDocumento, TotalesDocumento } from '../types/document.types'

export function calcularLinea(linea: LineaDocumento) {
  const base = linea.cantidad * linea.precioUnitario
  const iva = base * (linea.iva / 100)
  const irpf = base * (linea.irpf / 100)
  return { base, iva, irpf, total: base + iva - irpf }
}

export function calcularTotales(
  lineas: LineaDocumento[],
  mostrarIrpf: boolean
): TotalesDocumento {
  return lineas.reduce(
    (acc, linea) => {
      const { base, iva, irpf } = calcularLinea(linea)
      return {
        baseImponible: acc.baseImponible + base,
        totalIva: acc.totalIva + iva,
        totalIrpf: mostrarIrpf ? acc.totalIrpf + irpf : 0,
        total:
          acc.baseImponible + base + acc.totalIva + iva - (mostrarIrpf ? acc.totalIrpf + irpf : 0),
      }
    },
    { baseImponible: 0, totalIva: 0, totalIrpf: 0, total: 0 }
  )
}

// Genera número de documento secuencial: FAC-2025-001
export function generarNumeroDocumento(
  prefijo: string,
  secuencia: number
): string {
  const año = new Date().getFullYear()
  return `${prefijo}-${año}-${String(secuencia).padStart(3, '0')}`
}
