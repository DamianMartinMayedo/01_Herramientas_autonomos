import { useCallback, useEffect } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { nanoid } from 'nanoid'
import type { DocumentoBase, LineaDocumento, MetodoPago } from '../types/document.types'
import { DEFAULT_LINEA, TIPOS_IVA } from '../types/document.types'
import type { Empresa } from '../types/empresa.types'
import { calcularTotales } from '../utils/calculos'
import { fechaHoy, formatEuro } from '../utils/formatters'
import { useDocumentStore } from '../store/documentStore'
import { generarNumeroDocumento } from '../utils/calculos'

const PREFIJOS: Record<DocumentoBase['tipo'], string> = {
  factura: 'FAC',
  presupuesto: 'PRE',
  albaran: 'ALB',
}

function ensureDocumentDefaults(tipo: DocumentoBase['tipo'], document: DocumentoBase): DocumentoBase {
  return {
    ...document,
    tipo,
    lineas: document.lineas?.length ? document.lineas : [{ id: nanoid(), ...DEFAULT_LINEA }],
    formaPago: {
      metodo: 'transferencia',
      cuenta: '',
      telefono: '',
      email: '',
      detalle: '',
      ...document.formaPago,
    },
  }
}

export function useDocumentEngine(tipo: DocumentoBase['tipo'], initialData?: DocumentoBase | null, empresa?: Empresa | null) {
  const {
    emisorGuardado,
    setEmisorGuardado,
    presupuestoPendiente,
    limpiarPresupuestoPendiente,
  } = useDocumentStore()
  const clientePendiente = presupuestoPendiente?.cliente

  const createDefaultDocument = (): DocumentoBase => initialData
    ? ensureDocumentDefaults(tipo, initialData)
    : ({
    tipo,
    // En factura y presupuesto el número se asigna al guardar en BD. Albarán lo introduce el usuario.
    numero: (tipo === 'factura' || tipo === 'presupuesto') ? '' : generarNumeroDocumento(PREFIJOS[tipo], 1),
    fecha: fechaHoy(),
    emisor: empresa
      ? {
          nombre:    empresa.nombre,
          nif:       empresa.nif,
          email:     empresa.email,
          direccion: empresa.direccion,
          cp:        empresa.cp,
          ciudad:    empresa.ciudad,
          provincia: empresa.provincia,
          telefono:  empresa.telefono ?? '',
        }
      : (emisorGuardado ?? {
          nombre: '', nif: '', direccion: '',
          ciudad: '', cp: '', provincia: '', email: '', telefono: '',
        }),
    cliente: {
      nombre: clientePendiente?.nombre ?? '',
      nif: clientePendiente?.nif ?? '',
      direccion: clientePendiente?.direccion ?? '',
      ciudad: clientePendiente?.ciudad ?? '',
      cp: clientePendiente?.cp ?? '',
      provincia: clientePendiente?.provincia ?? '',
      email: clientePendiente?.email ?? '',
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
  })

  const form = useForm<DocumentoBase>({
    mode: 'onBlur',
    defaultValues: createDefaultDocument(),
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
    const clienteExterior = form.getValues('cliente.clienteExterior')
    append({
      id: nanoid(),
      ...DEFAULT_LINEA,
      iva: clienteExterior ? 0 : DEFAULT_LINEA.iva,
    })
  }, [append, form])

  const eliminarLinea = useCallback(
    (index: number) => {
      if (fields.length > 1) remove(index)
    },
    [fields.length, remove]
  )

  const lineas = (useWatch({ control: form.control, name: 'lineas' }) ?? []) as LineaDocumento[]
  const mostrarIrpf = Boolean(useWatch({ control: form.control, name: 'mostrarIrpf' }))
  const clienteExterior = Boolean(useWatch({ control: form.control, name: 'cliente.clienteExterior' }))
  const totales = calcularTotales(lineas ?? [], mostrarIrpf)

  useEffect(() => {
    const lineasActuales = form.getValues('lineas')
    if (tipo === 'albaran') return

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
