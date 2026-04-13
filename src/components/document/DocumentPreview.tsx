import { forwardRef } from 'react'
import type { DocumentoBase, TotalesDocumento } from '../../types/document.types'
import { calcularLinea } from '../../utils/calculos'
import { formatEuro, formatFecha } from '../../utils/formatters'

const ETIQUETAS: Record<DocumentoBase['tipo'], { titulo: string; numero: string }> = {
  factura: { titulo: 'FACTURA', numero: 'Nº Factura' },
  presupuesto: { titulo: 'PRESUPUESTO', numero: 'Nº Presupuesto' },
  albaran: { titulo: 'ALBARÁN', numero: 'Nº Albarán' },
}

interface DocumentPreviewProps {
  documento: DocumentoBase
  totales: TotalesDocumento
}

export const DocumentPreview = forwardRef<HTMLDivElement, DocumentPreviewProps>(
  ({ documento, totales }, ref) => {
    const { titulo, numero: labelNumero } = ETIQUETAS[documento.tipo]
    const esDocumentoFinanciero = documento.tipo !== 'albaran'

    return (
      <div
        ref={ref}
        className="bg-white text-stone-900 font-sans relative"
        style={{ width: '210mm', minHeight: '297mm', padding: '16mm', boxSizing: 'border-box' }}
      >
        {/* CABECERA */}
        <div className="flex justify-between items-start mb-10">
          <div>
            <h1 className="text-2xl font-bold text-teal-800 tracking-wide">{titulo}</h1>
            <div className="mt-4 space-y-0.5 text-sm">
              <p className="font-semibold text-stone-800">{documento.emisor.nombre}</p>
              <p className="text-stone-600">NIF: {documento.emisor.nif}</p>
              <p className="text-stone-600">{documento.emisor.direccion}</p>
              <p className="text-stone-600">
                {documento.emisor.cp} {documento.emisor.ciudad}, {documento.emisor.provincia}
              </p>
              {documento.emisor.email && (
                <p className="text-stone-600">{documento.emisor.email}</p>
              )}
              {documento.emisor.telefono && (
                <p className="text-stone-600">{documento.emisor.telefono}</p>
              )}
            </div>
          </div>

          <div className="text-right space-y-1.5">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wider">{labelNumero}</p>
              <p className="text-lg font-bold text-stone-800">{documento.numero}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wider">Fecha</p>
              <p className="text-sm font-medium">{formatFecha(documento.fecha)}</p>
            </div>
            {documento.fechaVencimiento && (
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider">Vencimiento</p>
                <p className="text-sm font-medium">{formatFecha(documento.fechaVencimiento)}</p>
              </div>
            )}
          </div>
        </div>

        {/* SEPARADOR */}
        <div className="h-px bg-stone-200 mb-6" />

        {/* DATOS CLIENTE */}
        <div className="mb-8">
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Facturar a</p>
          <p className="font-semibold text-stone-800">{documento.cliente.nombre}</p>
          {documento.cliente.nif && (
            <p className="text-sm text-stone-600">NIF: {documento.cliente.nif}</p>
          )}
          {documento.cliente.direccion && (
            <p className="text-sm text-stone-600">{documento.cliente.direccion}</p>
          )}
          {(documento.cliente.cp || documento.cliente.ciudad) && (
            <p className="text-sm text-stone-600">
              {documento.cliente.cp} {documento.cliente.ciudad}
              {documento.cliente.provincia ? `, ${documento.cliente.provincia}` : ''}
            </p>
          )}
          {documento.cliente.email && (
            <p className="text-sm text-stone-600">{documento.cliente.email}</p>
          )}
        </div>

        {/* TABLA DE LÍNEAS */}
        <table className="w-full text-sm mb-6" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="bg-stone-100">
              <th className="text-left py-2 px-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-stone-500 uppercase tracking-wider w-16">
                Cant.
              </th>
              <th className="text-right py-2 px-3 text-xs font-semibold text-stone-500 uppercase tracking-wider w-24">
                Precio
              </th>
              {esDocumentoFinanciero && (
                <>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-stone-500 uppercase tracking-wider w-16">
                    IVA
                  </th>
                  {documento.mostrarIrpf && (
                    <th className="text-right py-2 px-3 text-xs font-semibold text-stone-500 uppercase tracking-wider w-16">
                      IRPF
                    </th>
                  )}
                </>
              )}
              <th className="text-right py-2 px-3 text-xs font-semibold text-stone-500 uppercase tracking-wider w-24">
                Importe
              </th>
            </tr>
          </thead>
          <tbody>
            {documento.lineas.map((linea) => {
              const { base } = calcularLinea(linea)
              return (
                <tr key={linea.id} style={{ borderBottom: '1px solid #e7e5e4' }}>
                  <td className="py-2.5 px-3 text-stone-800">{linea.descripcion}</td>
                  <td className="py-2.5 px-3 text-right text-stone-600">{linea.cantidad}</td>
                  <td className="py-2.5 px-3 text-right text-stone-600">
                    {formatEuro(linea.precioUnitario)}
                  </td>
                  {esDocumentoFinanciero && (
                    <>
                      <td className="py-2.5 px-3 text-right text-stone-600">{linea.iva}%</td>
                      {documento.mostrarIrpf && (
                        <td className="py-2.5 px-3 text-right text-stone-600">-{linea.irpf}%</td>
                      )}
                    </>
                  )}
                  <td className="py-2.5 px-3 text-right font-medium text-stone-800">
                    {formatEuro(base)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* TOTALES */}
        {esDocumentoFinanciero && (
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-1.5">
              <div className="flex justify-between text-sm text-stone-600">
                <span>Base imponible</span>
                <span>{formatEuro(totales.baseImponible)}</span>
              </div>
              <div className="flex justify-between text-sm text-stone-600">
                <span>IVA</span>
                <span>+ {formatEuro(totales.totalIva)}</span>
              </div>
              {documento.mostrarIrpf && totales.totalIrpf > 0 && (
                <div className="flex justify-between text-sm text-stone-600">
                  <span>IRPF</span>
                  <span className="text-red-600">− {formatEuro(totales.totalIrpf)}</span>
                </div>
              )}
              <div
                className="flex justify-between text-base font-bold text-stone-900 pt-2"
                style={{ borderTop: '2px solid #0f766e' }}
              >
                <span>TOTAL</span>
                <span className="text-teal-800">{formatEuro(totales.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* NOTAS */}
        {documento.notas && (
          <div className="pt-6" style={{ borderTop: '1px solid #e7e5e4' }}>
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Notas</p>
            <p className="text-sm text-stone-600 whitespace-pre-wrap">{documento.notas}</p>
          </div>
        )}

        {/* ── MARCA DE AGUA ─────────────────────────────────────────────────
            Posicionada en la parte inferior del documento.
            A futuro: condicional según plan (gratis muestra watermark, premium no).
        ──────────────────────────────────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            bottom: '8mm',
            left: '16mm',
            right: '16mm',
            borderTop: '1px solid #f0ede8',
            paddingTop: '4mm',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '8px', color: '#c8c5bf', letterSpacing: '0.03em' }}>
            Creado con{' '}
            <span style={{ color: '#9fb8b5' }}>HerramientasAutonomos.es</span>
            {' '}— Herramientas gratuitas para autónomos en España
          </span>
        </div>
      </div>
    )
  }
)

DocumentPreview.displayName = 'DocumentPreview'
