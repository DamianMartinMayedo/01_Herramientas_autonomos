import { useCallback, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { nanoid } from 'nanoid'
import type { DocumentoBase, LineaDocumento, MetodoPago } from '../types/document.types'
import { DEFAULT_LINEA } from '../types/document.types'
import { calcularTotales } from '../utils/calculos'
import { fechaHoy, formatEuro } from '../utils/formatters'
import { useDocumentStore } from '../store/documentStore'
import { generarNumeroDocumento } from '../utils/calculos'

const PREFIJOS: Record<DocumentoBase['tipo'], string> = {
  factura: 'FAC',
  presupuesto: 'PRE',
  albaran: 'ALB',
}

export function useDocumentEngine(tipo: DocumentoBase['tipo']) {
  const {
    emisorGuardado,
    setEmisorGuardado,
    presupuestoPendiente,
    limpiarPresupuestoPendiente,
  } = useDocumentStore()

  const form = useForm<DocumentoBase>({
    mode: 'onBlur',
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
      cliente: presupuestoPendiente?.cliente ?? {
        nombre: '',
        nif: '',
        direccion: '',
        ciudad: '',
        cp: '',
        provincia: '',
        email: '',
      },
      lineas: presupuestoPendiente?.lineas ?? [{ id: nanoid(), ...DEFAULT_LINEA }],
      notas: presupuestoPendiente?.notas ?? '',
      mostrarIrpf: presupuestoPendiente?.mostrarIrpf ?? true,
      formaPago: {
        metodo: 'transferencia' as MetodoPago,
        cuenta: '',
        telefono: '',
        email: '',
        detalle: '',
      },
    },
  })

  // Limpiar el presupuesto pendiente tras cargarlo para no reutilizarlo
  useEffect(() => {
    if (tipo === 'factura' && presupuestoPendiente) {
      limpiarPresupuestoPendiente()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  const lineas = form.watch('lineas') as LineaDocumento[]
  const mostrarIrpf = form.watch('mostrarIrpf')
  const totales = calcularTotales(lineas ?? [], mostrarIrpf)

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
