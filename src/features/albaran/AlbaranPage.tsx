import { DocumentEngine } from '../../components/document/DocumentEngine'
import type { DocumentoBase, TotalesDocumento } from '../../types/document.types'
import type { RegularClient } from '../../types/regularClient.types'

interface AlbaranPageProps {
  embedded?: boolean
  onBack?: () => void
  initialData?: DocumentoBase | null
  onSave?: (documento: DocumentoBase, totales: TotalesDocumento) => Promise<void>
  saving?: boolean
  clientes?: RegularClient[]
}

export function AlbaranPage(props: AlbaranPageProps) {
  return (
    <DocumentEngine
      tipo="albaran"
      titulo="Albaranes"
      toolClass="tool-albaran"
      {...props}
    />
  )
}
