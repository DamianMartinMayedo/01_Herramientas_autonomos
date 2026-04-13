import { DocumentEngine } from '../../components/document/DocumentEngine'

export function FacturaPage() {
  return (
    <DocumentEngine
      tipo="factura"
      titulo="Facturas"
      toolClass="tool-factura"
    />
  )
}
