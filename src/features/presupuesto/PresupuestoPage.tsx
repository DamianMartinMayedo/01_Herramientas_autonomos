import { DocumentEngine } from '../../components/document/DocumentEngine'
import type { DocumentoBase, TotalesDocumento } from '../../types/document.types'
import type { RegularClient } from '../../types/regularClient.types'

interface PresupuestoPageProps {
  embedded?: boolean
  onBack?: () => void
  initialData?: DocumentoBase | null
  onSave?: (documento: DocumentoBase, totales: TotalesDocumento) => Promise<void>
  saving?: boolean
  clientes?: RegularClient[]
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
