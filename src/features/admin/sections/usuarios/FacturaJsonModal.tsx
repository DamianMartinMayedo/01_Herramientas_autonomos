/**
 * FacturaJsonModal.tsx
 * Modal de solo lectura para inspeccionar el JSON crudo de una factura.
 */
import { FileText } from 'lucide-react'
import { AdminModal } from '../../components/AdminModal'
import type { Factura } from './types'

interface Props {
  factura: Factura | null
  onClose: () => void
}

export function FacturaJsonModal({ factura, onClose }: Props) {
  return (
    <AdminModal
      open={factura !== null}
      size="lg"
      title={factura ? `Factura ${factura.numero || 'S/N'}` : ''}
      icon={<FileText size={18} />}
      iconAccent="copper"
      onClose={onClose}
      footer={
        <button className="btn btn-secondary btn-sm" onClick={onClose}>
          Cerrar
        </button>
      }
    >
      <pre className="json-pre">
        {factura ? JSON.stringify(factura.datos_json, null, 2) : ''}
      </pre>
    </AdminModal>
  )
}
