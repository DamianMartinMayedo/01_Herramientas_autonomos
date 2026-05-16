import { DocumentEngine } from '../../components/document/DocumentEngine'
import type { DocumentoBase, TotalesDocumento } from '../../types/document.types'
import type { RegularClient, RegularClientInput } from '../../types/regularClient.types'
import type { Empresa } from '../../types/empresa.types'
import { Seo } from '../../components/seo/Seo'

interface FacturaPageProps {
  embedded?: boolean
  onBack?: () => void
  initialData?: DocumentoBase | null
  onSave?: (documento: DocumentoBase, totales: TotalesDocumento, finalizar?: boolean) => Promise<void>
  saving?: boolean
  clientes?: RegularClient[]
  empresa?: Empresa | null
  onNavPerfil?: () => void
  onClienteGuardado?: (payload: RegularClientInput) => Promise<void>
  viewOnlyActions?: { onRectificar: () => void; onMarcarCobrada: () => void; onDuplicar: () => void; estadoActual?: string }
  autoOpenPreview?: boolean
  numero?: string | null
  facturaId?: string | null
}

export function FacturaPage(props: FacturaPageProps) {
  const defaultNumero = !props.onSave && !props.initialData?.numero
    ? `FAC-${new Date().getFullYear()}-001`
    : undefined

  return (
    <>
      <Seo
        title="Crear facturas online"
        description="Genera facturas profesionales en PDF para tus clientes. Sin complicaciones y con todos los campos obligatorios."
      />
      <DocumentEngine
        tipo="factura"
        titulo="Facturas"
        toolClass="tool-factura"
      {...props}
      defaultNumero={defaultNumero}
    />
    </>
  )
}