import { DocumentEngine } from '../../components/document/DocumentEngine'
import type { DocumentoBase, TotalesDocumento } from '../../types/document.types'
import type { RegularClient } from '../../types/regularClient.types'

interface FacturaPageProps {
  embedded?: boolean
  onBack?: () => void
  initialData?: DocumentoBase | null
  onSave?: (documento: DocumentoBase, totales: TotalesDocumento) => Promise<void>
  saving?: boolean
  clientes?: RegularClient[]
}

export function FacturaPage(props: FacturaPageProps) {
  return (
    <DocumentEngine
      tipo="factura"
      titulo="Facturas"
      toolClass="tool-factura"
      {...props}
    />
  )
}
