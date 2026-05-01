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
  onEmailPresupuesto?: (doc: DocumentoBase, totales: TotalesDocumento) => void
  estadoPresupuesto?: string
  onAprobarPresupuesto?: () => void
  onConvertirAFactura?: () => void
}

export function PresupuestoPage(props: PresupuestoPageProps) {
  const defaultNumero = !props.onSave && !props.initialData?.numero
    ? `PRE-${new Date().getFullYear()}-001`
    : undefined

  return (
    <DocumentEngine
      tipo="presupuesto"
      titulo="Presupuestos"
      toolClass="tool-presupuesto"
      {...props}
      defaultNumero={defaultNumero}
    />
  )
}