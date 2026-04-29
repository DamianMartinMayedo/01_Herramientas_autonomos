import { DocumentEngine } from '../../components/document/DocumentEngine'
import type { DocumentoBase, TotalesDocumento } from '../../types/document.types'
import type { RegularClient, RegularClientInput } from '../../types/regularClient.types'
import type { Empresa } from '../../types/empresa.types'

interface PresupuestoPageProps {
  embedded?: boolean
  onBack?: () => void
  initialData?: DocumentoBase | null
  onSave?: (documento: DocumentoBase, totales: TotalesDocumento, finalizar?: boolean) => Promise<void>
  saving?: boolean
  clientes?: RegularClient[]
  empresa?: Empresa | null
  onNavPerfil?: () => void
  onClienteGuardado?: (payload: RegularClientInput) => Promise<void>
  viewOnlyActions?: { estadoActual?: string }
  autoOpenPreview?: boolean
  onEmailPresupuesto?: (doc: import('../../types/document.types').DocumentoBase, totales: import('../../types/document.types').TotalesDocumento) => void
}

export function PresupuestoPage(props: PresupuestoPageProps) {
  return (
    <DocumentEngine
      tipo="presupuesto"
      titulo="Presupuestos"
      toolClass="tool-presupuesto"
      {...props}
    />
  )
}
