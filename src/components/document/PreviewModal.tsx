import { useRef, useState } from 'react'
import { X, Download, Pencil, AlertTriangle } from 'lucide-react'
import type { DocumentoBase, TotalesDocumento } from '../../types/document.types'
import { DocumentPreview } from './DocumentPreview'
import { Button } from '../ui/Button'
import { abrirVistaImpresion } from '../../utils/printDocument'

interface PreviewModalProps {
  documento: DocumentoBase
  totales: TotalesDocumento
  onClose: () => void
}

export function PreviewModal({ documento, totales, onClose }: PreviewModalProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [popupBloqueado, setPopupBloqueado] = useState(false)

  const handleConfirmar = () => {
    if (!previewRef.current) return
    setPopupBloqueado(false)
    try {
      abrirVistaImpresion(
        previewRef.current,
        `${documento.numero} — ${documento.emisor.nombre}`
      )
    } catch {
      // El navegador bloqueó la ventana emergente
      setPopupBloqueado(true)
    }
  }

  return (
    // Overlay oscuro — clic fuera cierra el modal
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full my-8 mx-4"
        style={{ maxWidth: '820px' }}
        role="dialog"
        aria-modal="true"
        aria-label="Vista previa del documento"
      >
        {/* ── Cabecera del modal ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <div>
            <h2 className="text-base font-semibold text-stone-800">
              Vista previa
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Revisa el documento antes de guardar
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
            aria-label="Cerrar vista previa"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Documento preview ───────────────────────────────────────── */}
        <div className="bg-stone-100 px-6 py-6 overflow-x-auto">
          {/* Contenedor con scroll horizontal en pantallas pequeñas */}
          <div style={{ minWidth: '210mm' }} className="mx-auto">
            <div className="shadow-lg">
              <DocumentPreview
                ref={previewRef}
                documento={documento}
                totales={totales}
              />
            </div>
          </div>
        </div>

        {/* ── Aviso popup bloqueado ───────────────────────────────────── */}
        {popupBloqueado && (
          <div className="mx-6 mt-4 flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong>El navegador bloqueó la ventana emergente.</strong>
              <br />
              Haz clic en el icono de bloqueo en la barra de direcciones y permite
              las ventanas emergentes para esta página. Luego vuelve a intentarlo.
            </div>
          </div>
        )}

        {/* ── Acciones ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200">
          <Button variant="ghost" size="md" onClick={onClose}>
            <Pencil className="w-4 h-4" />
            Volver a editar
          </Button>

          <Button size="md" onClick={handleConfirmar}>
            <Download className="w-4 h-4" />
            Confirmar y guardar PDF
          </Button>
        </div>
      </div>
    </div>
  )
}
