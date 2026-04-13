import { DocumentEngine } from '../../components/document/DocumentEngine'

export function FacturaPage() {
  return (
    <DocumentEngine
      tipo="factura"
      titulo="Generador de facturas"
      toolClass="tool-factura"
    />
  )
}
