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
}

const PREVIEW_ZOOM = 0.88

export function PreviewModal({ documento, totales, onClose }: PreviewModalProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDescargar = async () => {
    if (!previewRef.current) return
    setGenerando(true)
    setError(null)
    try {
      // El nombre del archivo PDF es siempre el número del documento
      await descargarPdf(previewRef.current, documento.numero)
    } catch (e) {
      console.error(e)
      setError('No se pudo abrir el diálogo de impresión. Inténtalo de nuevo.')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8"
        role="dialog"
        aria-modal="true"
        aria-label="Vista previa del documento"
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Vista previa</h2>
            <p className="text-sm text-stone-500">
              Al guardar, elige <strong>Guardar como PDF</strong> en el destino de impresión
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preview escalada y centrada */}
        <div className="bg-stone-100 py-6 flex justify-center overflow-hidden">
          <div style={{ zoom: PREVIEW_ZOOM }}>
            <div className="shadow-lg">
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
          <div className="mx-6 mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200">
          <Button variant="secondary" onClick={onClose} disabled={generando}>
            <Pencil size={16} />
            Volver a editar
          </Button>
          <Button variant="primary" onClick={handleDescargar} disabled={generando}>
            {generando
              ? <Loader2 size={16} className="animate-spin" />
              : <Printer size={16} />}
            {generando ? 'Abriendo...' : 'Guardar como PDF'}
          </Button>
        </div>
      </div>
    </div>
  )
}
