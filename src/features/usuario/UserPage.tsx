/**
 * UserPage.tsx
 * Página raíz del panel de usuario.
 */
import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { UserLayout, type UserSection } from './UserLayout'
import { UserDashboard } from './UserDashboard'
import { DocumentoListado, type TipoDocumento } from './DocumentoListado'
import { PerfilPage } from './PerfilPage'
import { useAuth } from '../../hooks/useAuth'
import { RouteLoading } from '../../components/routing/RouteLoading'
import { AlertModal } from '../../components/shared/AlertModal'
import { CuotaAutonomosWidget } from '../calculadoras/CuotaAutonomosPage'
import { PrecioHoraWidget } from '../calculadoras/PrecioHoraPage'
import { IvaIrpfWidget } from '../calculadoras/IvaIrpfPage'
import { FacturaPage } from '../factura/FacturaPage'
import { PresupuestoPage } from '../presupuesto/PresupuestoPage'
import { AlbaranPage } from '../albaran/AlbaranPage'
import { ContratoPage } from '../contrato/ContratoPage'
import { NdaPage } from '../nda/NdaPage'
import { ReclamacionPage } from '../reclamacion/ReclamacionPage'
import { getStoredUserDocument, saveBusinessDocument, saveLegalDocument, emitirFactura, duplicarFactura, corregirFactura, type UserDocumentTable } from '../../lib/userDocuments'
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
  | { section: 'facturas'; id?: string; data?: DocumentoBase | null; viewOnly?: boolean }
  | { section: 'presupuestos'; id?: string; data?: DocumentoBase | null }
  | { section: 'albaranes'; id?: string; data?: DocumentoBase | null }
  | { section: 'contratos'; id?: string; data?: ContratoServiciosDoc | null }
  | { section: 'ndas'; id?: string; data?: NdaDoc | null }
  | { section: 'reclamaciones'; id?: string; data?: ReclamacionPagoDoc | null }
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
  const [section, setSection] = useState<UserSection>('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [editor, setEditor] = useState<EditorState>(null)
  const [saving, setSaving] = useState(false)
  const [clientes, setClientes] = useState<RegularClient[]>([])
  const [clientesLoading, setClientesLoading] = useState(true)
  const userId = user?.id
  const [flashMessage, setFlashMessage] = useState<string | null>(null)
  const [alertState, setAlertState] = useState<{ msg: string; variant?: 'danger' | 'warning' | 'info' } | null>(null)
  const [empresa, setEmpresa] = useState<Empresa | null | undefined>(undefined)

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
    setSection(targetSection)
    setEditor({ section: targetSection })
  }

  const handleOpenDocument = async (targetSection: TipoDocumento, id: string) => {
    const result = await getStoredUserDocument(SECTION_TO_TABLE[targetSection], id)
    if (result.error || !result.data?.datos_json) {
      return
    }

    setSection(targetSection)
    setEditor({
      section: targetSection,
      id,
      data: result.data.datos_json as EditorState extends { data: infer T } ? T : never,
    } as EditorState)
  }

  const saveBusiness = async (table: 'facturas' | 'presupuestos' | 'albaranes', document: DocumentoBase, totals: TotalesDocumento, id?: string, finalizar?: boolean) => {
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
    const numeroGuardado = table === 'facturas' ? result.numero : document.numero
    if (table === 'facturas' && finalizar) {
      setFlashMessage(`Factura emitida${numeroGuardado ? `: ${numeroGuardado}` : ''}.`)
    } else if (table === 'facturas') {
      setFlashMessage('Borrador guardado.')
    } else {
      setFlashMessage(`${table === 'presupuestos' ? 'Presupuesto' : 'Albarán'} guardado${numeroGuardado ? `: ${numeroGuardado}` : ''}.`)
    }
    setTimeout(() => setFlashMessage(null), 3000)
    closeEditor()
    bumpRefresh()
  }

  const handleViewDocument = async (targetSection: TipoDocumento, id: string) => {
    const result = await getStoredUserDocument(SECTION_TO_TABLE[targetSection], id)
    if (result.error || !result.data?.datos_json) return
    setSection(targetSection)
    setEditor({
      section: targetSection,
      id,
      data: result.data.datos_json as EditorState extends { data: infer T } ? T : never,
      viewOnly: true,
    } as EditorState)
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
    setFlashMessage(`${table === 'contratos' ? 'Contrato' : table === 'ndas' ? 'NDA' : 'Reclamación'} guardado.`)
    setTimeout(() => setFlashMessage(null), 3000)
    closeEditor()
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
          onEmitir={(id) => { void handleEmitirFactura(id) }}
          onDuplicar={(id) => { void handleDuplicarFactura(id) }}
          onCorregir={(id) => { void handleCorregirFactura(id) }}
          flashMessage={flashMessage}
        />
      )
    }

    if (section === 'facturas') {
      const isViewOnly = editor.section === 'facturas' && editor.viewOnly === true
      return (
        <FacturaPage
          embedded
          onBack={closeEditor}
          initialData={editor.data as DocumentoBase | null | undefined}
          onSave={isViewOnly ? undefined : (document, totals, finalizar) => saveBusiness('facturas', document, totals, editor.id, finalizar)}
          saving={saving}
          clientes={clientesDisponibles}
          empresa={empresa}
          onNavPerfil={() => { closeEditor(); setSection('perfil') }}
          onClienteGuardado={handleClienteGuardado}
        />
      )
    }

    if (section === 'presupuestos') {
      return (
        <PresupuestoPage
          embedded
          onBack={closeEditor}
          initialData={editor.data as DocumentoBase | null | undefined}
          onSave={(document, totals) => saveBusiness('presupuestos', document, totals, editor.id)}
          saving={saving}
          clientes={clientesDisponibles}
          empresa={empresa}
          onNavPerfil={() => { closeEditor(); setSection('perfil') }}
          onClienteGuardado={handleClienteGuardado}
        />
      )
    }

    if (section === 'albaranes') {
      return (
        <AlbaranPage
          embedded
          onBack={closeEditor}
          initialData={editor.data as DocumentoBase | null | undefined}
          onSave={(document, totals) => saveBusiness('albaranes', document, totals, editor.id)}
          saving={saving}
          clientes={clientesDisponibles}
          empresa={empresa}
          onNavPerfil={() => { closeEditor(); setSection('perfil') }}
          onClienteGuardado={handleClienteGuardado}
        />
      )
    }

    if (section === 'contratos') {
      return (
        <ContratoPage
          embedded
          onBack={closeEditor}
          defaultValues={(editor.data as ContratoServiciosDoc | undefined) ?? undefined}
          onSave={(document) => saveLegal('contratos', document, editor.id)}
          saving={saving}
          clientes={clientesDisponibles}
        />
      )
    }

    if (section === 'ndas') {
      return (
        <NdaPage
          embedded
          onBack={closeEditor}
          defaultValues={(editor.data as NdaDoc | undefined) ?? undefined}
          onSave={(document) => saveLegal('ndas', document, editor.id)}
          saving={saving}
          clientes={clientesDisponibles}
        />
      )
    }

    if (section === 'reclamaciones') {
      return (
        <ReclamacionPage
          embedded
          onBack={closeEditor}
          defaultValues={(editor.data as ReclamacionPagoDoc | undefined) ?? undefined}
          onSave={(document) => saveLegal('reclamaciones', document, editor.id)}
          saving={saving}
          clientes={clientesDisponibles}
        />
      )
    }

    return null
  }

  const renderContent = () => {
    if (section === 'dashboard') {
      return <UserDashboard onNav={setSection} />
    }
    if (section === 'perfil') {
      return <PerfilPage userId={user.id} clientes={clientes} onClientsChange={setClientes} />
    }
    if (DOCUMENT_SECTIONS.includes(section)) {
      return renderDocumentWorkspace()
    }
    if (section === 'cuota-autonomos') return <CuotaAutonomosWidget />
    if (section === 'precio-hora') return <PrecioHoraWidget />
    if (section === 'iva-irpf') return <IvaIrpfWidget />
    return null
  }

  return (
    <>
      <UserLayout
        section={section}
        onNav={(nextSection) => {
          if (nextSection === section && DOCUMENT_SECTIONS.includes(nextSection)) {
            closeEditor()
          }
          setSection(nextSection)
          if (nextSection !== section) closeEditor()
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
    </>
  )
}
