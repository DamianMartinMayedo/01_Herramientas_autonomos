import { useRef, useState } from 'react'
import { X, Printer, Pencil, AlertTriangle, Loader2 } from 'lucide-react'
import type { DocumentoBase, TotalesDocumento } from '../../types/document.types'
import { DocumentPreview } from './DocumentPreview'
import { Button } from '../ui/Button'
import { descargarPdf } from '../../utils/downloadPdf'

interface PreviewModalProps {
  documento: DocumentoBase
  totales: TotalesDocumento
  onClose: () => void
  isGuest?: boolean
}

const PREVIEW_ZOOM = 0.88

export function PreviewModal({ documento, totales, onClose, isGuest = false }: PreviewModalProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDescargar = async () => {
    if (!previewRef.current) return
    setGenerando(true)
    setError(null)
    try {
      const nombreArchivo =
        documento.numero?.trim() ||
        (documento.tipo === 'factura' ? 'Factura' :
         documento.tipo === 'presupuesto' ? 'Presupuesto' :
         documento.tipo === 'albaran' ? 'Albaran' : 'Documento')
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
          aria-label="Vista previa del documento"
        >
          {/* Cabecera */}
          <div className="modal-header">
            <div>
              <h2 className="modal-header-title">Exportar</h2>
              <p className="modal-header-sub">
                Al guardar, elige <strong>Guardar como PDF</strong> en el destino de impresión
              </p>
            </div>
            <button onClick={onClose} className="modal-close-btn" aria-label="Cerrar">
              <X size={20} />
            </button>
          </div>

          {/* Preview escalada y centrada */}
          <div className="modal-body-scroll">
            <div style={{ zoom: PREVIEW_ZOOM }}>
              <div className="doc-shadow">
                <DocumentPreview
                  ref={previewRef}
                  documento={documento}
                  totales={totales}
                />
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
              <>
                <p className="preview-guest-hint">
                  Esta factura <strong>no está conectada con VeriFactu</strong>.
                  Para activar el registro fiscal AEAT en todas tus facturas,{' '}
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('ha:open-auth', { detail: { view: 'register' } }))}
                  >
                    crea una cuenta gratis
                  </button>
                  .
                </p>
                <Button variant="secondary" onClick={onClose} disabled={generando}>
                  <Pencil size={16} />
                  Volver a editar
                </Button>
              </>
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
