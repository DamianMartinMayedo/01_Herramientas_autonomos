import { DocumentEngine } from '../../components/document/DocumentEngine'
import type { DocumentoBase, TotalesDocumento } from '../../types/document.types'
import type { RegularClient, RegularClientInput } from '../../types/regularClient.types'
import type { Empresa } from '../../types/empresa.types'
import { Seo } from '../../components/seo/Seo'

interface AlbaranPageProps {
  embedded?: boolean
  onBack?: () => void
  initialData?: DocumentoBase | null
  onSave?: (documento: DocumentoBase, totales: TotalesDocumento) => Promise<void>
  saving?: boolean
  clientes?: RegularClient[]
  empresa?: Empresa | null
  onNavPerfil?: () => void
  onClienteGuardado?: (payload: RegularClientInput) => Promise<void>
  onEmailAlbaran?: (doc: DocumentoBase, totales: TotalesDocumento) => void
  estadoAlbaran?: string
  autoOpenPreview?: boolean
  viewOnlyActions?: { estadoActual?: string }
}

export function AlbaranPage(props: AlbaranPageProps) {
  const defaultNumero = !props.onSave && !props.initialData?.numero
    ? `ALB-${new Date().getFullYear()}-001`
    : undefined

  return (
    <>
      <Seo
        title="Crear albaranes de entrega"
        description="Genera albaranes de entrega profesionales en PDF. Documenta envíos y recepciones de mercancía fácilmente."
      />
      <DocumentEngine
        tipo="albaran"
        titulo="Albaranes"
        toolClass="tool-albaran"
        {...props}
        defaultNumero={defaultNumero}
      />
    </>
  )
}