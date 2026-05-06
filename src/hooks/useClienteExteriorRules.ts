import { useEffect } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { DocumentoBase } from '../types/document.types'
import { DEFAULT_LINEA, TIPOS_IVA } from '../types/document.types'

/**
 * Cuando el cliente es exterior (operación intracomunitaria/exportación):
 *   - se oculta el IRPF
 *   - se fuerza IVA 0 en todas las líneas
 * Al desmarcar, se restituye IRPF y se devuelve a IVA por defecto las líneas
 * que quedaron en un valor no estándar.
 *
 * No aplica a albaranes — su template no tiene IRPF ni IVA editable.
 */
export function useClienteExteriorRules(
  form: UseFormReturn<DocumentoBase>,
  tipo: DocumentoBase['tipo'],
  clienteExterior: boolean,
) {
  useEffect(() => {
    if (tipo === 'albaran') return
    const lineasActuales = form.getValues('lineas')

    if (clienteExterior) {
      form.setValue('mostrarIrpf', false, { shouldDirty: true, shouldValidate: true })
      lineasActuales.forEach((linea, index) => {
        if (linea.iva !== 0) {
          form.setValue(`lineas.${index}.iva`, 0, { shouldDirty: true, shouldValidate: true })
        }
      })
      return
    }

    form.setValue('mostrarIrpf', true, { shouldDirty: true, shouldValidate: true })
    lineasActuales.forEach((linea, index) => {
      if (!TIPOS_IVA.includes(linea.iva as (typeof TIPOS_IVA)[number])) {
        form.setValue(`lineas.${index}.iva`, DEFAULT_LINEA.iva, { shouldDirty: true, shouldValidate: true })
      }
    })
  }, [clienteExterior, form, tipo])
}
