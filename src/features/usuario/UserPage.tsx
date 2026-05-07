/**
 * UserPage.tsx
 * Página raíz del panel de usuario.
 */
import { useEffect, useMemo, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { UserLayout, type UserSection } from './UserLayout'
import { UserDashboard } from './UserDashboard'
import { DocumentoListado, type TipoDocumento } from './DocumentoListado'
import { PerfilPage } from './PerfilPage'
import { useAuth } from '../../hooks/useAuth'
import { RouteLoading } from '../../components/routing/RouteLoading'
import { AlertModal } from '../../components/shared/AlertModal'
import { EmailModal } from '../../components/shared/EmailModal'
import { CuotaCalculator } from '../calculadoras/CuotaAutonomosPage'
import { PrecioHoraCalculator } from '../calculadoras/PrecioHoraPage'
import { IvaIrpfCalculator } from '../calculadoras/IvaIrpfPage'
import { FacturaPage } from '../factura/FacturaPage'
import { PresupuestoPage } from '../presupuesto/PresupuestoPage'
import { AlbaranPage } from '../albaran/AlbaranPage'
import { ContratoPage } from '../contrato/ContratoPage'
import { NdaPage } from '../nda/NdaPage'
import { ReclamacionPage } from '../reclamacion/ReclamacionPage'
import { getStoredUserDocument, saveBusinessDocument, saveLegalDocument, emitirFactura, duplicarFactura, corregirFactura, marcarFacturaCobrada, marcarFacturaEmitida, enviarPresupuesto, aprobarPresupuesto, convertirPresupuestoAFactura, enviarAlbaran, marcarPresupuestoEntregado, enviarContrato, enviarNda, enviarReclamacion, type UserDocumentTable } from '../../lib/userDocuments'
import { listRegularClients, createRegularClient } from '../../lib/regularClients'
import { getEmpresa } from '../../lib/empresa'
import { OnboardingEmpresaModal } from './OnboardingEmpresaModal'
import type { Empresa } from '../../types/empresa.types'
import type { DocumentoBase, TotalesDocumento } from '../../types/document.types'
import type { ContratoServiciosDoc, NdaDoc, ReclamacionPagoDoc } from '../../types/legalDoc.types'
import type { RegularClient, RegularClientInput } from '../../types/regularClient.types'

const DOCUMENT_SECTIONS: UserSection[] = [
  'facturas', 'presupuestos', 'albaranes', 'contratos', 'ndas', 'reclamaciones',
]

type EditorState =
  | { section: 'facturas'; id?: string; data?: DocumentoBase | null; viewOnly?: boolean; estado?: string | null; autoDownload?: boolean; numero?: string | null }
  | { section: 'presupuestos'; id?: string; data?: DocumentoBase | null; viewOnly?: boolean; estado?: string | null; autoDownload?: boolean }
  | { section: 'albaranes'; id?: string; data?: DocumentoBase | null; viewOnly?: boolean; estado?: string | null; autoDownload?: boolean }
  | { section: 'contratos'; id?: string; data?: ContratoServiciosDoc | null; estado?: string | null; autoDownload?: boolean }
  | { section: 'ndas'; id?: string; data?: NdaDoc | null; estado?: string | null; autoDownload?: boolean }
  | { section: 'reclamaciones'; id?: string; data?: ReclamacionPagoDoc | null; estado?: string | null; autoDownload?: boolean }
  | null

const SECTION_TO_TABLE: Record<TipoDocumento, UserDocumentTable> = {
  facturas: 'facturas',
  presupuestos: 'presupuestos',
  albaranes: 'albaranes',
  contratos: 'contratos',
  ndas: 'ndas',
  reclamaciones: 'reclamaciones',
}

export function UserPage() {
  const { user, loading } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const section = (searchParams.get('s') as UserSection) ?? 'dashboard'
  const [refreshKey, setRefreshKey] = useState(0)
  const [editor, setEditor] = useState<EditorState>(null)
  const [saving, setSaving] = useState(false)
  const [clientes, setClientes] = useState<RegularClient[]>([])
  const [clientesLoading, setClientesLoading] = useState(true)
  const userId = user?.id
  const [flashMessage, setFlashMessage] = useState<string | null>(null)
  const [alertState, setAlertState] = useState<{ msg: string; variant?: 'danger' | 'warning' | 'info' } | null>(null)
  const [empresa, setEmpresa] = useState<Empresa | null | undefined>(undefined)
  const [calcOrigin, setCalcOrigin] = useState<UserSection | null>(null)
  const [emailPresupuestoState, setEmailPresupuestoState] = useState<{
    email?: string; nombre: string
    doc: DocumentoBase; totals: TotalesDocumento; id?: string; isReenviar?: boolean
  } | null>(null)
  const [emailAlbaranState, setEmailAlbaranState] = useState<{
    email?: string; nombre: string; doc: DocumentoBase; totals: TotalesDocumento; id?: string; isReenviar: boolean
  } | null>(null)
  const [emailContratoState, setEmailContratoState] = useState<{
    email?: string; nombre: string; doc: ContratoServiciosDoc; id?: string; isReenviar: boolean
  } | null>(null)
  const [emailNdaState, setEmailNdaState] = useState<{
    email?: string; nombre: string; doc: NdaDoc; id?: string; isReenviar: boolean
  } | null>(null)
  const [emailReclamacionState, setEmailReclamacionState] = useState<{
    email?: string; nombre: string; doc: ReclamacionPagoDoc; id?: string; isReenviar: boolean
  } | null>(null)

  useEffect(() => {
    if (!userId) return
    let active = true
    async function loadEmpresa() {
      const { data } = await getEmpresa(userId as string)
      if (!active) return
      setEmpresa(data)
    }
    void loadEmpresa()
    return () => { active = false }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      return
    }

    let active = true

    async function fetchClients() {
      setClientesLoading(true)
      const result = await listRegularClients(userId as string)
      if (!active) return
      setClientes(result.data)
      setClientesLoading(false)
    }

    void fetchClients()

    return () => {
      active = false
    }
  }, [userId])

  const clientesDisponibles = useMemo(() => (clientesLoading ? [] : clientes), [clientes, clientesLoading])

  if (loading || empresa === undefined) return <RouteLoading />
  if (!user) return <Navigate to="/" replace />

  const closeEditor = () => setEditor(null)

  const bumpRefresh = () => setRefreshKey((value) => value + 1)

  const handleCreateDocument = (targetSection: TipoDocumento) => {
    setSearchParams({ s: targetSection })
    setEditor({ section: targetSection })
  }

  const handleOpenDocument = async (targetSection: TipoDocumento, id: string) => {
    const result = await getStoredUserDocument(SECTION_TO_TABLE[targetSection], id)
    if (result.error) {
      setAlertState({ msg: 'No se pudo abrir el documento. Inténtalo de nuevo.', variant: 'danger' })
      return
    }
    if (!result.data?.datos_json) {
      setAlertState({ msg: 'Este documento no tiene datos guardados y no se puede abrir.', variant: 'warning' })
      return
    }

    setSearchParams({ s: targetSection })

    // Documentos legales: datos_json YA es el documento completo (NdaDoc, ContratoServiciosDoc, etc.)
    // No hacer spread como DocumentoBase porque pierde los campos específicos
    if (targetSection === 'ndas' || targetSection === 'contratos' || targetSection === 'reclamaciones') {
      const datosJson = result.data.datos_json as Record<string, unknown>
      if (result.data.numero) {
        datosJson.numero = result.data.numero
      }
      setEditor({
        section: targetSection,
        id,
        data: datosJson,
        estado: result.data.estado,
      } as EditorState)
    } else {
      const datosJson: DocumentoBase = { ...(result.data.datos_json as DocumentoBase) }
      if (result.data.numero) {
        datosJson.numero = result.data.numero
      }
      setEditor({
        section: targetSection,
        id,
        data: datosJson,
        estado: result.data.estado,
      } as EditorState)
    }
  }

  const saveBusiness = async (table: 'facturas' | 'presupuestos' | 'albaranes', document: DocumentoBase, totals: TotalesDocumento, id?: string, finalizar?: boolean, skipClose?: boolean) => {
    if (!userId) throw new Error('No hay sesión activa')
    setSaving(true)
    const result = await saveBusinessDocument({ table, userId, document, totals, id, finalizar })
    setSaving(false)
    if (result.error) {
      throw new Error('No se pudo guardar el documento')
    }
    if (result.data?.id) {
      setEditor((current) => (current ? { ...current, id: result.data?.id } : current))
    }
    const numeroGuardado = result.numero
    if (table === 'facturas' && finalizar) {
      setFlashMessage(`Factura emitida${numeroGuardado ? `: ${numeroGuardado}` : ''}.`)
    } else if (table === 'facturas') {
      setFlashMessage('Borrador guardado.')
    } else if (table === 'presupuestos' && finalizar) {
      setFlashMessage(`Presupuesto enviado${numeroGuardado ? `: ${numeroGuardado}` : ''}.`)
    } else if (table === 'presupuestos') {
      setFlashMessage(`Borrador guardado${numeroGuardado ? `: ${numeroGuardado}` : ''}.`)
    } else if (table === 'albaranes' && finalizar) {
      setFlashMessage(`Albarán enviado${numeroGuardado ? `: ${numeroGuardado}` : ''}.`)
    } else {
      setFlashMessage(`Albarán guardado${numeroGuardado ? `: ${numeroGuardado}` : ''}.`)
    }
    setTimeout(() => setFlashMessage(null), 3000)
    if (!skipClose) closeEditor()
    bumpRefresh()
  }

  const handleViewDocument = async (targetSection: TipoDocumento, id: string) => {
    const result = await getStoredUserDocument(SECTION_TO_TABLE[targetSection], id)
    if (result.error || !result.data?.datos_json) {
      setAlertState({ msg: 'Este documento no tiene datos guardados y no se puede abrir.', variant: 'warning' })
      return
    }
    setSearchParams({ s: targetSection })
    const isViewOnly = targetSection === 'facturas' || (targetSection === 'presupuestos' && result.data.estado === 'convertido')
    setEditor({
      section: targetSection,
      id,
      data: result.data.datos_json as EditorState extends { data: infer T } ? T : never,
      viewOnly: isViewOnly,
      estado: result.data.estado,
    } as EditorState)
  }

  const handleDescargarFactura = async (id: string) => {
    const result = await getStoredUserDocument('facturas', id)
    if (result.error || !result.data?.datos_json) return
    setSearchParams({ s: 'facturas' })
    setEditor({
      section: 'facturas',
      id,
      data: result.data.datos_json as DocumentoBase,
      viewOnly: true,
      estado: result.data.estado,
      autoDownload: true,
      numero: result.data.numero ?? undefined,
    })
  }

  const handleDescargarPresupuesto = async (id: string) => {
    const result = await getStoredUserDocument('presupuestos', id)
    if (result.error || !result.data?.datos_json) return
    setSearchParams({ s: 'presupuestos' })
    const isConvertido = result.data.estado === 'convertido'
    setEditor({
      section: 'presupuestos',
      id,
      data: result.data.datos_json as DocumentoBase,
      viewOnly: isConvertido,
      estado: result.data.estado,
      autoDownload: true,
    })
  }

  const handleDescargarAlbaran = async (id: string) => {
    const result = await getStoredUserDocument('albaranes', id)
    if (result.error || !result.data?.datos_json) return
    setSearchParams({ s: 'albaranes' })
    setEditor({
      section: 'albaranes',
      id,
      data: result.data.datos_json as DocumentoBase,
      estado: result.data.estado,
      autoDownload: true,
    })
  }

  const handleDescargarContrato = async (id: string) => {
    const result = await getStoredUserDocument('contratos', id)
    if (result.error || !result.data?.datos_json) return
    setSearchParams({ s: 'contratos' })
    setEditor({
      section: 'contratos',
      id,
      data: result.data.datos_json as ContratoServiciosDoc,
      estado: result.data.estado,
      autoDownload: true,
    })
  }

  const handleDescargarNda = async (id: string) => {
    const result = await getStoredUserDocument('ndas', id)
    if (result.error || !result.data?.datos_json) return
    setSearchParams({ s: 'ndas' })
    setEditor({
      section: 'ndas',
      id,
      data: result.data.datos_json as NdaDoc,
      estado: result.data.estado,
      autoDownload: true,
    })
  }

  const handleDescargarReclamacion = async (id: string) => {
    const result = await getStoredUserDocument('reclamaciones', id)
    if (result.error || !result.data?.datos_json) return
    setSearchParams({ s: 'reclamaciones' })
    setEditor({
      section: 'reclamaciones',
      id,
      data: result.data.datos_json as ReclamacionPagoDoc,
      estado: result.data.estado,
      autoDownload: true,
    })
  }

  const handleEmitirFactura = async (id: string) => {
    if (!userId) return
    const result = await emitirFactura(userId, id)
    if (result.error) {
      setAlertState({ msg: 'No se pudo emitir la factura. Inténtalo de nuevo.', variant: 'danger' })
      return
    }
    setFlashMessage(`Factura emitida${result.numero ? `: ${result.numero}` : ''}.`)
    setTimeout(() => setFlashMessage(null), 3000)
    bumpRefresh()
  }

  const handleDuplicarFactura = async (id: string) => {
    if (!userId) return
    const result = await duplicarFactura(userId, id)
    if (result.error) {
      setAlertState({ msg: 'No se pudo duplicar la factura.', variant: 'danger' })
      return
    }
    setFlashMessage('Borrador duplicado creado.')
    setTimeout(() => setFlashMessage(null), 3000)
    bumpRefresh()
  }

  const handleCorregirFactura = async (id: string) => {
    if (!userId) return
    const result = await corregirFactura(userId, id)
    if (result.error) {
      setAlertState({ msg: 'No se pudo crear la factura rectificativa.', variant: 'danger' })
      return
    }
    setFlashMessage('Factura rectificativa creada como borrador.')
    setTimeout(() => setFlashMessage(null), 3000)
    bumpRefresh()
  }

  const saveLegal = async (table: 'contratos' | 'ndas' | 'reclamaciones', document: ContratoServiciosDoc | NdaDoc | ReclamacionPagoDoc, id?: string) => {
    if (!userId) throw new Error('No hay sesión activa')
    setSaving(true)
    const result = await saveLegalDocument({
      table,
      userId,
      document,
      id,
    })
    setSaving(false)
    if (result.error) {
      throw new Error('No se pudo guardar el documento')
    }
    if (result.data?.id) {
      setEditor((current) => (current ? { ...current, id: result.data?.id } : current))
    }
    setFlashMessage(`${table === 'contratos' ? 'Contrato guardado' : table === 'ndas' ? 'NDA guardado' : 'Reclamación guardada'}.`)
    setTimeout(() => setFlashMessage(null), 3000)
    closeEditor()
    bumpRefresh()
  }

  const handleMarcarCobrada = async (id: string) => {
    const result = await marcarFacturaCobrada(id)
    if (result.error) {
      setAlertState({ msg: 'No se pudo marcar la factura como cobrada.', variant: 'danger' })
      return
    }
    setEditor((current) => current ? { ...current, estado: 'cobrada' } : current)
    bumpRefresh()
  }

  const handleMarcarNoCobrada = async (id: string) => {
    const result = await marcarFacturaEmitida(id)
    if (result.error) {
      setAlertState({ msg: 'No se pudo desmarcar la factura como cobrada.', variant: 'danger' })
      return
    }
    setEditor((current) => current ? { ...current, estado: 'emitida' } : current)
    bumpRefresh()
  }

  const handleEnviarPresupuesto = async (id: string) => {
    if (!userId) return
    const result = await enviarPresupuesto(userId, id)
    if (result.error) {
      setAlertState({ msg: 'No se pudo enviar el presupuesto. Inténtalo de nuevo.', variant: 'danger' })
      return
    }
    setFlashMessage(`Presupuesto enviado${result.numero ? `: ${result.numero}` : ''}.`)
    setTimeout(() => setFlashMessage(null), 3000)
    bumpRefresh()
  }

  const handleAprobarPresupuesto = async (id: string) => {
    const result = await aprobarPresupuesto(id)
    if (result.error) {
      setAlertState({ msg: 'No se pudo marcar como aprobado.', variant: 'danger' })
      return
    }
    setFlashMessage('Presupuesto aprobado.')
    setTimeout(() => setFlashMessage(null), 3000)
    bumpRefresh()
  }

  const handleConvertirAFactura = async (id: string) => {
    if (!userId) return
    const result = await convertirPresupuestoAFactura(userId, id)
    if (result.error) {
      setAlertState({ msg: 'No se pudo convertir a factura. Inténtalo de nuevo.', variant: 'danger' })
      return
    }
    setFlashMessage('Presupuesto convertido. Borrador de factura creado.')
    setTimeout(() => setFlashMessage(null), 4000)
    setSearchParams({ s: 'facturas' })
    bumpRefresh()
  }

  const handleMarcarPresupuestoEntregado = async (id: string) => {
    const result = await marcarPresupuestoEntregado(id)
    if (result.error) {
      setAlertState({ msg: 'No se pudo marcar como entregado.', variant: 'danger' })
      return
    }
    setFlashMessage('Presupuesto marcado como entregado.')
    setTimeout(() => setFlashMessage(null), 3000)
    bumpRefresh()
  }

  const handleEnviarAlbaranDesdeListado = async (id: string) => {
    const result = await enviarAlbaran(id)
    if (result.error) {
      setAlertState({ msg: 'No se pudo enviar el albarán.', variant: 'danger' })
      return
    }
    setFlashMessage('Albarán marcado como enviado.')
    setTimeout(() => setFlashMessage(null), 3000)
    bumpRefresh()
  }

  const handleEnviarContratoDesdeListado = async (id: string) => {
    if (!userId) return
    const result = await enviarContrato(userId, id)
    if (result.error) {
      setAlertState({ msg: 'No se pudo enviar el contrato.', variant: 'danger' })
      return
    }
    setFlashMessage(`Contrato enviado${result.numero ? `: ${result.numero}` : ''}.`)
    setTimeout(() => setFlashMessage(null), 3000)
    bumpRefresh()
  }

  const handleEnviarNdaDesdeListado = async (id: string) => {
    if (!userId) return
    const result = await enviarNda(userId, id)
    if (result.error) {
      setAlertState({ msg: 'No se pudo enviar el NDA.', variant: 'danger' })
      return
    }
    setFlashMessage(`NDA enviado${result.numero ? `: ${result.numero}` : ''}.`)
    setTimeout(() => setFlashMessage(null), 3000)
    bumpRefresh()
  }

  const handleEnviarReclamacionDesdeListado = async (id: string) => {
    if (!userId) return
    const result = await enviarReclamacion(userId, id)
    if (result.error) {
      setAlertState({ msg: 'No se pudo enviar la reclamación.', variant: 'danger' })
      return
    }
    setFlashMessage(`Reclamación enviada${result.numero ? `: ${result.numero}` : ''}.`)
    setTimeout(() => setFlashMessage(null), 3000)
    bumpRefresh()
  }

  const handleClienteGuardado = async (payload: RegularClientInput) => {
    if (!userId) throw new Error('No hay sesión activa')
    const result = await createRegularClient(userId, payload)
    if (result.error || !result.data) {
      throw new Error('No se pudo guardar el cliente')
    }
    setClientes((prev) => [...prev, result.data!].sort((a, b) => a.nombre.localeCompare(b.nombre)))
  }

  const renderDocumentWorkspace = () => {
    if (!editor || editor.section !== section) {
      return (
        <DocumentoListado
          tipo={section as TipoDocumento}
          refreshKey={refreshKey}
          onCreate={() => handleCreateDocument(section as TipoDocumento)}
          onOpen={(id) => { void handleOpenDocument(section as TipoDocumento, id) }}
          onView={(id) => { void handleViewDocument(section as TipoDocumento, id) }}
          onDescargar={(id) => {
            if (section === 'facturas') void handleDescargarFactura(id)
            else if (section === 'presupuestos') void handleDescargarPresupuesto(id)
            else if (section === 'albaranes') void handleDescargarAlbaran(id)
            else if (section === 'contratos') void handleDescargarContrato(id)
            else if (section === 'ndas') void handleDescargarNda(id)
            else if (section === 'reclamaciones') void handleDescargarReclamacion(id)
          }}
          onEmitir={(id) => { void handleEmitirFactura(id) }}
          onDuplicar={(id) => { void handleDuplicarFactura(id) }}
          onCorregir={(id) => { void handleCorregirFactura(id) }}
          onEnviarPresupuesto={(id) => { void handleEnviarPresupuesto(id) }}
          onAprobarPresupuesto={(id) => { void handleAprobarPresupuesto(id) }}
          onConvertirAFactura={(id) => { void handleConvertirAFactura(id) }}
          onMarcarPresupuestoEntregado={(id) => { void handleMarcarPresupuestoEntregado(id) }}
          onEnviarAlbaran={(id) => { void handleEnviarAlbaranDesdeListado(id) }}
          onEnviarContrato={(id) => { void handleEnviarContratoDesdeListado(id) }}
          onEnviarNda={(id) => { void handleEnviarNdaDesdeListado(id) }}
          onEnviarReclamacion={(id) => { void handleEnviarReclamacionDesdeListado(id) }}
          onNavCalc={(s) => { setCalcOrigin(section as UserSection); setSearchParams({ s }) }}
          flashMessage={flashMessage}
        />
      )
    }

    if (section === 'facturas') {
      const isViewOnly = editor.section === 'facturas' && editor.viewOnly === true
      const editorId = editor.id
      const editorEstado = editor.section === 'facturas' ? (editor.estado ?? null) : null
      const autoDownload = editor.section === 'facturas' ? (editor.autoDownload ?? false) : false
      return (
        <FacturaPage
          key={editorId ?? 'new-factura'}
          embedded
          onBack={closeEditor}
          initialData={editor.data as DocumentoBase | null | undefined}
          onSave={isViewOnly ? undefined : (document, totals, finalizar) => saveBusiness('facturas', document, totals, editorId, finalizar)}
          saving={saving}
          clientes={clientesDisponibles}
          empresa={empresa}
          onNavPerfil={() => { closeEditor(); setSearchParams({ s: 'perfil' }) }}
          onClienteGuardado={handleClienteGuardado}
          autoOpenPreview={autoDownload}
          viewOnlyActions={isViewOnly && editorId ? {
            onRectificar:     () => { closeEditor(); void handleCorregirFactura(editorId) },
            onMarcarCobrada:  () => { void handleMarcarCobrada(editorId) },
            /* @ts-expect-error ViewOnlyActions type mismatch in cached build */
            onMarcarNoCobrada: () => { void handleMarcarNoCobrada(editorId) },
            onDuplicar:       () => { closeEditor(); void handleDuplicarFactura(editorId) },
            estadoActual:     editorEstado ?? undefined,
          } : undefined}
          numero={'numero' in editor ? editor.numero : undefined}
        />
      )
    }

    if (section === 'presupuestos') {
      const isViewOnly = editor.section === 'presupuestos' && editor.viewOnly === true
      const editorId = editor.id
      const editorEstado = editor.section === 'presupuestos' ? (editor.estado ?? null) : null
      const autoDownload = editor.section === 'presupuestos' ? (editor.autoDownload ?? false) : false
      return (
        <PresupuestoPage
          key={editorId ?? 'new-presupuesto'}
          embedded
          onBack={closeEditor}
          initialData={editor.data as DocumentoBase | null | undefined}
          onSave={isViewOnly ? undefined : (document, totals, finalizar) => saveBusiness('presupuestos', document, totals, editorId, finalizar)}
          saving={saving}
          clientes={clientesDisponibles}
          empresa={empresa}
          onNavPerfil={() => { closeEditor(); setSearchParams({ s: 'perfil' }) }}
          onClienteGuardado={handleClienteGuardado}
          autoOpenPreview={autoDownload}
          viewOnlyActions={isViewOnly ? { estadoActual: editorEstado ?? undefined } : undefined}
          estadoPresupuesto={!isViewOnly ? (editorEstado ?? undefined) : undefined}
          onAprobarPresupuesto={!isViewOnly && editorId && editorEstado === 'enviado'
            ? () => { closeEditor(); void handleAprobarPresupuesto(editorId) }
            : undefined}
          onConvertirAFactura={!isViewOnly && editorId && (editorEstado === 'enviado' || editorEstado === 'aprobado')
            ? () => { void handleConvertirAFactura(editorId) }
            : undefined}
          onEmailPresupuesto={isViewOnly ? undefined : (doc, totals) => {
            const id = editor?.section === 'presupuestos' ? editor.id : undefined
            const estado = editor?.section === 'presupuestos' ? editor.estado : null
            setEmailPresupuestoState({
              email: doc.cliente?.email,
              nombre: doc.numero ? `Presupuesto ${doc.numero}` : 'Presupuesto',
              doc, totals, id,
              isReenviar: Boolean(estado && estado !== 'borrador'),
            })
            // No cerramos el editor aquí: si el usuario cancela el email, puede seguir editando
          }}
        />
      )
    }

    if (section === 'albaranes') {
      const isViewOnly = editor.section === 'albaranes' && editor.viewOnly === true
      const editorId = editor.id
      const editorEstado = editor.section === 'albaranes' ? (editor.estado ?? null) : null
      const autoDownload = editor.section === 'albaranes' ? (editor.autoDownload ?? false) : false
      return (
        <AlbaranPage
          key={editorId ?? 'new-albaran'}
          embedded
          onBack={closeEditor}
          initialData={editor.data as DocumentoBase | null | undefined}
          onSave={isViewOnly ? undefined : (document, totals) => saveBusiness('albaranes', document, totals, editorId)}
          saving={saving}
          clientes={clientesDisponibles}
          empresa={empresa}
          onNavPerfil={() => { closeEditor(); setSearchParams({ s: 'perfil' }) }}
          onClienteGuardado={handleClienteGuardado}
          estadoAlbaran={editorEstado ?? undefined}
          autoOpenPreview={autoDownload}
          viewOnlyActions={isViewOnly ? { estadoActual: editorEstado ?? undefined } : undefined}
          onEmailAlbaran={isViewOnly ? undefined : (doc, totals) => {
            setEmailAlbaranState({
              email: doc.cliente?.email,
              nombre: doc.numero ? `Albarán ${doc.numero}` : 'Albarán',
              doc, totals, id: editorId,
              isReenviar: Boolean(editorEstado && editorEstado !== 'pendiente'),
            })
          }}
        />
      )
    }

    if (section === 'contratos') {
      const estadoContrato = (editor as { estado?: string | null }).estado
      return (
        <ContratoPage
          key={editor.id ?? 'new-contrato'}
          embedded
          onBack={closeEditor}
          defaultValues={(editor.data as ContratoServiciosDoc | undefined) ?? undefined}
          onSave={(document) => saveLegal('contratos', document, editor.id)}
          saving={saving}
          clientes={clientesDisponibles}
          empresa={empresa}
          estadoContrato={estadoContrato ?? undefined}
          autoOpenPreview={'autoDownload' in editor ? editor.autoDownload : undefined}
          onEmailContrato={(doc) => {
            setEmailContratoState({
              email: doc.cliente?.email,
              nombre: doc.metadatos?.referencia ? `Contrato ${doc.metadatos.referencia}` : 'Contrato',
              doc,
              id: editor.id,
              isReenviar: Boolean(estadoContrato && estadoContrato !== 'borrador'),
            })
          }}
        />
      )
    }

    if (section === 'ndas') {
      const estadoNda = (editor as { estado?: string | null }).estado
      return (
        <NdaPage
          key={editor.id ?? 'new-nda'}
          embedded
          onBack={closeEditor}
          defaultValues={(editor.data as NdaDoc | undefined) ?? undefined}
          onSave={(document) => saveLegal('ndas', document, editor.id)}
          saving={saving}
          clientes={clientesDisponibles}
          empresa={empresa}
          estadoNda={estadoNda ?? undefined}
          autoOpenPreview={'autoDownload' in editor ? editor.autoDownload : undefined}
          onEmailNda={(doc) => {
            setEmailNdaState({
              email: doc.parteB?.email,
              nombre: doc.metadatos?.referencia ? `NDA ${doc.metadatos.referencia}` : 'NDA',
              doc,
              id: editor.id,
              isReenviar: Boolean(estadoNda && estadoNda !== 'borrador'),
            })
          }}
        />
      )
    }

    if (section === 'reclamaciones') {
      const estadoReclamacion = (editor as { estado?: string | null }).estado
      return (
        <ReclamacionPage
          key={editor.id ?? 'new-reclamacion'}
          embedded
          onBack={closeEditor}
          defaultValues={(editor.data as ReclamacionPagoDoc | undefined) ?? undefined}
          onSave={(document) => saveLegal('reclamaciones', document, editor.id)}
          saving={saving}
          clientes={clientesDisponibles}
          empresa={empresa}
          userId={userId}
          estadoReclamacion={estadoReclamacion ?? undefined}
          autoOpenPreview={'autoDownload' in editor ? editor.autoDownload : undefined}
          onEmailReclamacion={(doc) => {
            setEmailReclamacionState({
              email: doc.deudor?.email,
              nombre: doc.metadatos?.referencia ? `Reclamación ${doc.metadatos.referencia}` : 'Reclamación',
              doc,
              id: editor.id,
              isReenviar: Boolean(estadoReclamacion && estadoReclamacion !== 'borrador'),
            })
          }}
        />
      )
    }

    return null
  }

  const renderContent = () => {
    if (section === 'dashboard') {
      return <UserDashboard onNav={(s) => setSearchParams({ s })} nombreEmpresa={empresa?.nombre} />
    }
    if (section === 'perfil') {
      return <PerfilPage userId={user.id} clientes={clientes} onClientsChange={setClientes} />
    }
    if (DOCUMENT_SECTIONS.includes(section)) {
      return renderDocumentWorkspace()
    }
    if (section === 'cuota-autonomos' || section === 'precio-hora' || section === 'iva-irpf') {
      const CalcMap = {
        'cuota-autonomos': CuotaCalculator,
        'precio-hora':     PrecioHoraCalculator,
        'iva-irpf':        IvaIrpfCalculator,
      }
      const BACK_LABELS: Partial<Record<UserSection, string>> = {
        presupuestos: 'Volver a presupuestos',
        facturas:     'Volver a facturas',
        albaranes:    'Volver a albaranes',
        dashboard:    'Volver al dashboard',
      }
      const Calc = CalcMap[section]
      const backSection = calcOrigin ?? 'dashboard'
      return (
        <div className="doc-listado-wrap">
          <nav className="post-breadcrumb" style={{ marginBottom: 'var(--space-5)' }}>
            <button type="button" onClick={() => { setCalcOrigin(null); setSearchParams({ s: backSection }) }} className="back-link">
              <ArrowLeft size={13} /> {BACK_LABELS[backSection] ?? 'Volver'}
            </button>
          </nav>
          <Calc />
        </div>
      )
    }
    return null
  }

  return (
    <>
      <UserLayout
        section={section}
        nombreEmpresa={empresa?.nombre}
        onNav={(nextSection) => {
          if (!['cuota-autonomos', 'precio-hora', 'iva-irpf'].includes(nextSection)) {
            setCalcOrigin(null)
          }
          if (nextSection === section && DOCUMENT_SECTIONS.includes(nextSection)) {
            closeEditor()
          }
          setSearchParams({ s: nextSection })
        }}
      >
        {renderContent()}
      </UserLayout>

      {empresa === null && (
        <OnboardingEmpresaModal
          userId={user.id}
          onComplete={(saved) => setEmpresa(saved)}
        />
      )}

      {alertState && (
        <AlertModal
          message={alertState.msg}
          variant={alertState.variant}
          onConfirm={() => setAlertState(null)}
        />
      )}

      {emailPresupuestoState && (
        <EmailModal
          emailCliente={emailPresupuestoState.email}
          nombreDocumento={emailPresupuestoState.nombre}
          onSent={async () => {
            await saveBusiness(
              'presupuestos',
              emailPresupuestoState.doc,
              emailPresupuestoState.totals,
              emailPresupuestoState.id,
              !emailPresupuestoState.isReenviar,
            )
          }}
          onClose={() => setEmailPresupuestoState(null)}
        />
      )}

      {emailAlbaranState && (
        <EmailModal
          emailCliente={emailAlbaranState.email}
          nombreDocumento={emailAlbaranState.nombre}
          onSent={async () => {
            await saveBusiness(
              'albaranes',
              emailAlbaranState.doc,
              emailAlbaranState.totals,
              emailAlbaranState.id,
              true,
              true,
            )
          }}
          onClose={() => setEmailAlbaranState(null)}
        />
      )}

      {emailContratoState && (
        <EmailModal
          emailCliente={emailContratoState.email}
          nombreDocumento={emailContratoState.nombre}
          onSent={async () => {
            if (!emailContratoState.id) return
            await enviarContrato(userId as string, emailContratoState.id)
            bumpRefresh()
          }}
          onClose={() => setEmailContratoState(null)}
        />
      )}

      {emailNdaState && (
        <EmailModal
          emailCliente={emailNdaState.email}
          nombreDocumento={emailNdaState.nombre}
          onSent={async () => {
            if (!emailNdaState.id) return
            await enviarNda(userId as string, emailNdaState.id)
            bumpRefresh()
          }}
          onClose={() => setEmailNdaState(null)}
        />
      )}

      {emailReclamacionState && (
        <EmailModal
          emailCliente={emailReclamacionState.email}
          nombreDocumento={emailReclamacionState.nombre}
          onSent={async () => {
            if (!emailReclamacionState.id) return
            await enviarReclamacion(userId as string, emailReclamacionState.id)
            bumpRefresh()
          }}
          onClose={() => setEmailReclamacionState(null)}
        />
      )}
    </>
  )
}
