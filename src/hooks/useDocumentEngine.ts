import { useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { nanoid } from 'nanoid'
import type { DocumentoBase, LineaDocumento } from '../types/document.types'
import { DEFAULT_LINEA } from '../types/document.types'
import { calcularTotales } from '../utils/calculos'
import { fechaHoy, formatEuro } from '../utils/formatters'
import { useDocumentStore } from '../store/documentStore'
import { generarNumeroDocumento } from '../utils/calculos'

const PREFIJOS: Record<string, string> = {
  factura: 'FAC',
  presupuesto: 'PRE',
  albaran: 'ALB',
}

export function useDocumentEngine(tipo: DocumentoBase['tipo']) {
  const { emisorGuardado, setEmisorGuardado } = useDocumentStore()

  const form = useForm<DocumentoBase>({
    mode: 'onBlur', // valida al salir del campo, no en cada tecla
    defaultValues: {
      tipo,
      numero: generarNumeroDocumento(PREFIJOS[tipo], 1),
      fecha: fechaHoy(),
      emisor: emisorGuardado ?? {
        nombre: '',
        nif: '',
        direccion: '',
        ciudad: '',
        cp: '',
        provincia: '',
        email: '',
        telefono: '',
      },
      cliente: {
        nombre: '',
        nif: '',
        direccion: '',
        ciudad: '',
        cp: '',
        provincia: '',
        email: '',
      },
      lineas: [{ id: nanoid(), ...DEFAULT_LINEA }],
      notas: '',
      mostrarIrpf: true,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineas',
  })

  const agregarLinea = useCallback(() => {
    append({ id: nanoid(), ...DEFAULT_LINEA })
  }, [append])

  const eliminarLinea = useCallback(
    (index: number) => {
      if (fields.length > 1) remove(index)
    },
    [fields.length, remove]
  )

  // Totales calculados en tiempo real observando el formulario
  const lineas = form.watch('lineas') as LineaDocumento[]
  const mostrarIrpf = form.watch('mostrarIrpf')
  const totales = calcularTotales(lineas ?? [], mostrarIrpf)

  // Guarda los datos del emisor en localStorage para reutilizarlos
  const guardarEmisor = useCallback(() => {
    const emisor = form.getValues('emisor')
    setEmisorGuardado(emisor)
  }, [form, setEmisorGuardado])

  return {
    form,
    fields,
    totales,
    mostrarIrpf,
    agregarLinea,
    eliminarLinea,
    guardarEmisor,
    formatEuro,
  }
}
