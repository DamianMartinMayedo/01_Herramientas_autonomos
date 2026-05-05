/**
 * LegalDocModal.tsx
 * Modal de exportación para documentos legales.
 * Mismo patrón que PreviewModal pero usa LegalDocPreview.
 */
import { useRef, useState } from 'react'
import { X, Printer, Pencil, AlertTriangle, Loader2 } from 'lucide-react'
import type { LegalDoc } from '../../types/legalDoc.types'
import { LegalDocPreview } from './LegalDocPreview'
import { Button } from '../ui/Button'
import { descargarPdf } from '../../utils/downloadPdf'

const NOMBRE_ARCHIVO: Record<LegalDoc['tipo'], string> = {
  contrato: 'Contrato-servicios',
  nda: 'NDA-confidencialidad',
  reclamacion: 'Reclamacion-pago',
}

const PREVIEW_ZOOM = 0.78

interface LegalDocModalProps {
  documento: LegalDoc
  onClose: () => void
  isGuest?: boolean
}

export function LegalDocModal({ documento, onClose, isGuest = false }: LegalDocModalProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDescargar = async () => {
    if (!previewRef.current) return
    setGenerando(true)
    setError(null)
    try {
      const ref = documento.metadatos.referencia?.trim()
      const nombreArchivo = ref
        ? `${NOMBRE_ARCHIVO[documento.tipo]}-${ref}`
        : NOMBRE_ARCHIVO[documento.tipo]
      await descargarPdf(previewRef.current, nombreArchivo)
    } catch (e) {
      console.error(e)
      setError('No se pudo abrir el diálogo de impresión. Inténtalo de nuevo.')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <>
      <div
        className="overlay overlay-dark overlay-z60"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="admin-modal-box admin-modal-lg"
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa del documento legal"
        >
          {/* Cabecera */}
          <div className="modal-header">
            <div>
              <h2 className="modal-header-title">Exportar documento</h2>
              <p className="modal-header-sub">
                Al guardar, elige <strong>Guardar como PDF</strong> en el destino de impresión
              </p>
            </div>
            <button onClick={onClose} className="modal-close-btn" aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>

          {/* Preview escalada */}
          <div className="modal-body-scroll">
            <div style={{ zoom: PREVIEW_ZOOM }}>
              <div className="doc-shadow">
                <LegalDocPreview ref={previewRef} documento={documento} />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="error-box">
              <AlertTriangle size={16} className="error-box-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Acciones */}
          <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
            {isGuest && (
              <Button variant="secondary" onClick={onClose} disabled={generando}>
                <Pencil size={16} />
                Volver a editar
              </Button>
            )}
            <Button variant="primary" onClick={handleDescargar} disabled={generando}>
              {generando
                ? <Loader2 size={16} className="spin" />
                : <Printer size={16} />}
              {generando ? 'Abriendo...' : 'Guardar como PDF'}
            </Button>
          </div>
</div>
      </div>
    </>
  )
}
