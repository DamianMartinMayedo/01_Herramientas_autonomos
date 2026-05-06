import { useCallback, useEffect, useRef } from 'react'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { nanoid } from 'nanoid'
import type { DocumentoBase, LineaDocumento, MetodoPago } from '../types/document.types'
import { DEFAULT_LINEA } from '../types/document.types'
import type { Empresa } from '../types/empresa.types'
import { calcularTotales } from '../utils/calculos'
import { fechaHoy, formatEuro } from '../utils/formatters'
import { useDocumentStore } from '../store/documentStore'
import { useClienteExteriorRules } from './useClienteExteriorRules'

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

export function useDocumentEngine(
  tipo: DocumentoBase['tipo'],
  initialData?: DocumentoBase | null,
  empresa?: Empresa | null,
  defaultNumero?: string,
  numero?: string | null,
) {
  const {
    emisorGuardado,
    setEmisorGuardado,
    presupuestoPendiente,
    limpiarPresupuestoPendiente,
  } = useDocumentStore()
  const clientePendiente = presupuestoPendiente?.cliente

  const createDefaultDocument = (): DocumentoBase => {
    const numeroFinal = numero ?? (initialData ? (initialData.numero ?? (defaultNumero ?? '')) : (defaultNumero ?? ''))
    if (initialData) {
      return { ...ensureDocumentDefaults(tipo, initialData), numero: numeroFinal }
    }
    return ({
      tipo,
      numero: numeroFinal || (defaultNumero ?? ''),
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
  }

  const form = useForm<DocumentoBase>({
    mode: 'onBlur',
    defaultValues: createDefaultDocument(),
  })

  // Limpiar el presupuesto pendiente tras cargarlo para no reutilizarlo
  useEffect(() => {
    if (tipo === 'factura' && presupuestoPendiente) {
      limpiarPresupuestoPendiente()
    }
  }, [tipo, presupuestoPendiente, limpiarPresupuestoPendiente])

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

  useClienteExteriorRules(form, tipo, clienteExterior)

  const guardarEmisor = useCallback(() => {
    const emisor = form.getValues('emisor')
    setEmisorGuardado(emisor)
  }, [form, setEmisorGuardado])

  const emisorValues = useWatch({ control: form.control, name: 'emisor' })
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!emisorValues) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      setEmisorGuardado(emisorValues as DocumentoBase['emisor'])
    }, 1000)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [emisorValues, setEmisorGuardado])

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
