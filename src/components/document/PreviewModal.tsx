/**
 * PreviewModal.tsx
 *
 * - La preview se muestra escalada al ancho disponible del modal (zoom CSS).
 *   zoom afecta layout real (a diferencia de transform:scale), así el modal
 *   no queda con espacio vacío.
 * - El ref apunta a DocumentPreview directamente, fuera del wrapper con zoom,
 *   por lo que el PDF se genera siempre a resolución completa (794px).
 * - zoom no se hereda al clone en downloadPdf porque el clone es un nodo
 *   huérfano con width:794px explícito.
 */
import { useRef, useState } from 'react'
import { X, Download, Pencil, AlertTriangle, Loader2 } from 'lucide-react'
import type { DocumentoBase, TotalesDocumento } from '../../types/document.types'
import { DocumentPreview } from './DocumentPreview'
import { Button } from '../ui/Button'
import { descargarPdf } from '../../utils/downloadPdf'

interface PreviewModalProps {
  documento: DocumentoBase
  totales: TotalesDocumento
  onClose: () => void
}

// Factor de escala visual para el modal.
// 794px (210mm) × 0.82 = ~651px → cabe en max-w-3xl con padding
const PREVIEW_ZOOM = 0.82

export function PreviewModal({ documento, totales, onClose }: PreviewModalProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [descargando, setDescargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDescargar = async () => {
    if (!previewRef.current) return
    setDescargando(true)
    setError(null)
    try {
      const nombre = `${documento.numero} — ${documento.emisor.nombre}`
      await descargarPdf(previewRef.current, nombre)
    } catch (e) {
      console.error(e)
      setError('No se pudo generar el PDF. Inténtalo de nuevo.')
    } finally {
      setDescargando(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">

        {/* ── Cabecera ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">Vista previa</h2>
            <p className="text-sm text-stone-500">Revisa el documento antes de guardar</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Preview escalada ───────────────────────────────────────────── */}
        {/*
          El wrapper tiene overflow:hidden para recortar el espacio sobrante
          del zoom. El div interior con `zoom` escala la preview visualmente
          y contrae su espacio en el layout.
          El ref va en DocumentPreview (dentro del zoom) — downloadPdf clona
          el elemento con width:794px explícito, ignorando el zoom del padre.
        */}
        <div className="overflow-hidden bg-stone-50 px-4 pt-4 pb-2">
          <div style={{ zoom: PREVIEW_ZOOM }}>
            <DocumentPreview
              ref={previewRef}
              documento={documento}
              totales={totales}
            />
          </div>
        </div>

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && (
          <div className="mx-6 mb-2 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Acciones ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200">
          <Button variant="secondary" onClick={onClose} disabled={descargando}>
            <Pencil size={16} />
            Volver a editar
          </Button>
          <Button variant="primary" onClick={handleDescargar} disabled={descargando}>
            {descargando
              ? <Loader2 size={16} className="animate-spin" />
              : <Download size={16} />}
            {descargando ? 'Generando PDF...' : 'Descargar PDF'}
          </Button>
        </div>

      </div>
    </div>
  )
}
