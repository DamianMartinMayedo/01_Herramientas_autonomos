import { forwardRef } from 'react'
import type { DocumentoBase, TotalesDocumento } from '../../types/document.types'
import { ETIQUETAS_METODO_PAGO } from '../../types/document.types'
import { calcularLinea } from '../../utils/calculos'
import { formatEuro, formatFecha } from '../../utils/formatters'

const ETIQUETAS: Record<DocumentoBase['tipo'], { titulo: string; numero: string }> = {
  factura:      { titulo: 'FACTURA',     numero: 'Nº Factura' },
  presupuesto:  { titulo: 'PRESUPUESTO', numero: 'Nº Presupuesto' },
  albaran:      { titulo: 'ALBARÁN',     numero: 'Nº Albarán' },
}

interface DocumentPreviewProps {
  documento: DocumentoBase
  totales: TotalesDocumento
}

export const DocumentPreview = forwardRef<HTMLDivElement, DocumentPreviewProps>(
  ({ documento, totales }, ref) => {
    const { titulo, numero: labelNumero } = ETIQUETAS[documento.tipo]
    const esFinanciero = documento.tipo !== 'albaran'

    return (
      <div
        ref={ref}
        className="bg-white w-[210mm] min-h-[297mm] p-10 text-stone-800 text-sm font-sans"
      >
        {/* ── CABECERA ──────────────────────────────────────────────────────── */}
        <div className="flex justify-between items-start mb-8">
          {/* Datos del emisor */}
          <div className="space-y-0.5">
            <p className="text-lg font-bold text-stone-900">{documento.emisor.nombre}</p>
            <p className="text-stone-500 text-xs">NIF: {documento.emisor.nif}</p>
            <p className="text-stone-500 text-xs">{documento.emisor.direccion}</p>
            <p className="text-stone-500 text-xs">
              {documento.emisor.cp} {documento.emisor.ciudad}
              {documento.emisor.provincia ? `, ${documento.emisor.provincia}` : ''}
            </p>
            {documento.emisor.email && (
              <p className="text-stone-500 text-xs">{documento.emisor.email}</p>
            )}
            {documento.emisor.telefono && (
              <p className="text-stone-500 text-xs">{documento.emisor.telefono}</p>
            )}
          </div>

          {/* Título y metadatos del documento */}
          <div className="text-right space-y-1">
            <h1 className="text-2xl font-black tracking-tight text-stone-900">{titulo}</h1>
            <div className="text-xs space-y-0.5">
              <p>
                <span className="text-stone-400">{labelNumero}: </span>
                <span className="font-semibold">{documento.numero}</span>
              </p>
              <p>
                <span className="text-stone-400">Fecha: </span>
                <span className="font-medium">{formatFecha(documento.fecha)}</span>
              </p>
              {documento.fechaVencimiento && (
                <p>
                  <span className="text-stone-400">Vencimiento: </span>
                  <span className="font-medium">{formatFecha(documento.fechaVencimiento)}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── SEPARADOR ─────────────────────────────────────────────────────── */}
        <hr className="border-stone-200 mb-6" />

        {/* ── DATOS CLIENTE ─────────────────────────────────────────────────── */}
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
            Facturar a
          </p>
          <p className="font-semibold text-stone-900">{documento.cliente.nombre}</p>
          {documento.cliente.nif && (
            <p className="text-stone-500 text-xs">NIF: {documento.cliente.nif}</p>
          )}
          {documento.cliente.direccion && (
            <p className="text-stone-500 text-xs">{documento.cliente.direccion}</p>
          )}
          {(documento.cliente.cp || documento.cliente.ciudad) && (
            <p className="text-stone-500 text-xs">
              {documento.cliente.cp} {documento.cliente.ciudad}
              {documento.cliente.provincia ? `, ${documento.cliente.provincia}` : ''}
            </p>
          )}
          {documento.cliente.email && (
            <p className="text-stone-500 text-xs">{documento.cliente.email}</p>
          )}
        </div>

        {/* ── TABLA DE LÍNEAS ───────────────────────────────────────────────── */}
        <table className="w-full text-xs mb-6">
          <thead>
            <tr className="bg-stone-100 text-stone-500 uppercase tracking-wider">
              <th className="text-left py-2 px-3 font-semibold rounded-tl-lg">Descripción</th>
              <th className="text-right py-2 px-3 font-semibold">Cant.</th>
              <th className="text-right py-2 px-3 font-semibold">Precio</th>
              {esFinanciero && (
                <>
                  <th className="text-right py-2 px-3 font-semibold">IVA</th>
                  {documento.mostrarIrpf && (
                    <th className="text-right py-2 px-3 font-semibold">IRPF</th>
                  )}
                </>
              )}
              <th className="text-right py-2 px-3 font-semibold rounded-tr-lg">Importe</th>
            </tr>
          </thead>
          <tbody>
            {documento.lineas.map((linea, i) => {
              const { base } = calcularLinea(linea)
              const esPar = i % 2 === 0
              return (
                <tr key={linea.id} className={esPar ? 'bg-white' : 'bg-stone-50'}>
                  <td className="py-2 px-3 text-stone-800">{linea.descripcion}</td>
                  <td className="py-2 px-3 text-right text-stone-600">{linea.cantidad}</td>
                  <td className="py-2 px-3 text-right text-stone-600">
                    {formatEuro(linea.precioUnitario)}
                  </td>
                  {esFinanciero && (
                    <>
                      <td className="py-2 px-3 text-right text-stone-600">{linea.iva}%</td>
                      {documento.mostrarIrpf && (
                        <td className="py-2 px-3 text-right text-stone-600">-{linea.irpf}%</td>
                      )}
                    </>
                  )}
                  <td className="py-2 px-3 text-right font-medium text-stone-800">
                    {formatEuro(base)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* ── TOTALES ───────────────────────────────────────────────────────── */}
        {esFinanciero && (
          <div className="flex justify-end mb-6">
            <div className="w-56 space-y-1 text-xs">
              <div className="flex justify-between text-stone-500">
                <span>Base imponible</span>
                <span>{formatEuro(totales.baseImponible)}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>IVA</span>
                <span>+ {formatEuro(totales.totalIva)}</span>
              </div>
              {documento.mostrarIrpf && totales.totalIrpf > 0 && (
                <div className="flex justify-between text-stone-500">
                  <span>IRPF</span>
                  <span>− {formatEuro(totales.totalIrpf)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-stone-900 text-sm pt-1.5 border-t border-stone-300">
                <span>TOTAL</span>
                <span>{formatEuro(totales.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── FORMA DE PAGO ─────────────────────────────────────────────────── */}
        {esFinanciero && documento.formaPago && (
          <div className="mb-6 pt-4 border-t border-stone-200">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
              Forma de pago
            </p>
            <p className="text-sm font-semibold text-stone-800">
              {ETIQUETAS_METODO_PAGO[documento.formaPago.metodo]}
            </p>
            {documento.formaPago.metodo === 'transferencia' && documento.formaPago.cuenta && (
              <p className="text-xs text-stone-600 mt-0.5">{documento.formaPago.cuenta}</p>
            )}
            {documento.formaPago.metodo === 'bizum' && documento.formaPago.telefono && (
              <p className="text-xs text-stone-600 mt-0.5">{documento.formaPago.telefono}</p>
            )}
            {documento.formaPago.metodo === 'paypal' && (
              <div className="text-xs text-stone-600 mt-0.5 space-y-0.5">
                {documento.formaPago.email && <p>{documento.formaPago.email}</p>}
                {documento.formaPago.telefono && <p>{documento.formaPago.telefono}</p>}
              </div>
            )}
            {documento.formaPago.metodo === 'otro' && documento.formaPago.detalle && (
              <p className="text-xs text-stone-600 mt-0.5 whitespace-pre-wrap">
                {documento.formaPago.detalle}
              </p>
            )}
          </div>
        )}

        {/* ── NOTAS ─────────────────────────────────────────────────────────── */}
        {documento.notas && (
          <div className="pt-4 border-t border-stone-200">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-1">
              Notas
            </p>
            <p className="text-xs text-stone-600 whitespace-pre-wrap">{documento.notas}</p>
          </div>
        )}

        {/* ── MARCA DE AGUA ─────────────────────────────────────────────────── */}
        <div className="mt-12 pt-4 border-t border-stone-100 text-center">
          <p className="text-[10px] text-stone-300">
            Creado con{' '}
            <span className="font-semibold text-teal-400">HerramientasAutonomos.es</span>
            {' '}— Herramientas gratuitas para autónomos en España
          </p>
        </div>
      </div>
    )
  }
)

DocumentPreview.displayName = 'DocumentPreview'
