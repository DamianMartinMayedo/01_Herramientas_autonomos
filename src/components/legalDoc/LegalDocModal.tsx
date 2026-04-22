/**
 * LegalDocModal.tsx
 * Modal de exportación para documentos legales.
 * Mismo patrón que PreviewModal pero usa LegalDocPreview.
 */
import { useRef, useState } from 'react'
import { X, Printer, Pencil, AlertTriangle, Loader2, Mail } from 'lucide-react'
import type { LegalDoc } from '../../types/legalDoc.types'
import { LegalDocPreview } from './LegalDocPreview'
import { Button } from '../ui/Button'
import { descargarPdf } from '../../utils/downloadPdf'
import { EmailModal } from '../shared/EmailModal'

const NOMBRE_ARCHIVO: Record<LegalDoc['tipo'], string> = {
  contrato: 'Contrato-servicios',
  nda: 'NDA-confidencialidad',
  reclamacion: 'Reclamacion-pago',
}

const LABEL_DOC: Record<LegalDoc['tipo'], string> = {
  contrato: 'Contrato de servicios',
  nda: 'NDA — Confidencialidad',
  reclamacion: 'Reclamación de pago',
}

const PREVIEW_ZOOM = 0.78

interface LegalDocModalProps {
  documento: LegalDoc
  /** Email del cliente/receptor para autorellenar el modal de correo */
  clienteEmail?: string
  onClose: () => void
}

/**
 * Intenta extraer el email de la parte receptora del documento:
 * - Contrato → cliente.email
 * - NDA → parteB.email
 * - Reclamación → deudor.email
 * Si el llamador ya pasó clienteEmail explícitamente, se usa ese.
 */
function resolverEmailCliente(documento: LegalDoc): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = documento as any
  return (
    doc?.cliente?.email ||
    doc?.parteB?.email ||
    doc?.deudor?.email ||
    undefined
  )
}

export function LegalDocModal({ documento, clienteEmail, onClose }: LegalDocModalProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailModalAbierto, setEmailModalAbierto] = useState(false)

  const emailResuelto = clienteEmail ?? resolverEmailCliente(documento)

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

  const nombreDocumento = [
    LABEL_DOC[documento.tipo],
    documento.metadatos.referencia?.trim(),
  ].filter(Boolean).join(' — ')

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col"
          style={{ maxHeight: 'calc(100vh - 2rem)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa del documento legal"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Exportar documento</h2>
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

          {/* Preview escalada */}
          <div className="bg-stone-100 flex-1 overflow-auto py-6 flex justify-center" style={{ minHeight: 0 }}>
            <div style={{ zoom: PREVIEW_ZOOM }}>
              <div className="shadow-lg">
                <LegalDocPreview ref={previewRef} documento={documento} />
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
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <Button
                variant="secondary"
                onClick={() => setEmailModalAbierto(true)}
                disabled={generando}
                type="button"
              >
                <Mail size={16} />
                Enviar por correo
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
      </div>

      {/* Email modal — z-60, se superpone al modal principal */}
      {emailModalAbierto && (
        <EmailModal
          emailCliente={emailResuelto}
          nombreDocumento={nombreDocumento}
          onClose={() => setEmailModalAbierto(false)}
        />
      )}
    </>
  )
}
