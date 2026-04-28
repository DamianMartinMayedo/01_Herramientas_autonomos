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

    const formatDireccion = (
      direccion?: string, cp?: string, ciudad?: string, provincia?: string, pais?: string,
    ) => [
      direccion,
      [cp, ciudad].filter(Boolean).join(' '),
      provincia,
      pais,
    ].filter(Boolean).join(', ')

    return (
      <div ref={ref} className="doc-page doc-page-fixed">
        <div className="doc-inner">

          {/* CABECERA */}
          <div className="doc-header">
            <div className="doc-emisor">
              <p className="doc-emisor-name">{documento.emisor.nombre}</p>
              <p className="doc-text-muted">NIF: {documento.emisor.nif}</p>
              {(documento.emisor.direccion || documento.emisor.cp || documento.emisor.ciudad) && (
                <p className="doc-text-muted">
                  {formatDireccion(documento.emisor.direccion, documento.emisor.cp, documento.emisor.ciudad, documento.emisor.provincia)}
                </p>
              )}
              {documento.emisor.email    && <p className="doc-text-muted">{documento.emisor.email}</p>}
              {documento.emisor.telefono && <p className="doc-text-muted">{documento.emisor.telefono}</p>}
            </div>

            <div className="doc-info">
              <p className="doc-title">{titulo}</p>
              <div className="doc-ref-block">
                <p>
                  <span className="doc-ref-label">{labelNumero}: </span>
                  <span className="doc-ref-value">{documento.numero}</span>
                </p>
                <p>
                  <span className="doc-ref-label">Fecha: </span>
                  <span className="doc-ref-value-m">{formatFecha(documento.fecha)}</span>
                </p>
                {documento.fechaVencimiento && (
                  <p>
                    <span className="doc-ref-label">Vencimiento: </span>
                    <span className="doc-ref-value-m">{formatFecha(documento.fechaVencimiento)}</span>
                  </p>
                )}
              </div>

              {/* CLIENTE — debajo del bloque de referencia */}
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.12)' }}>
                <p className="doc-client-name">{documento.cliente.nombre}</p>
                {documento.cliente.nif && <p className="doc-text-muted">NIF: {documento.cliente.nif}</p>}
                {(documento.cliente.direccion || documento.cliente.cp || documento.cliente.ciudad) && (
                  <p className="doc-text-muted">
                    {formatDireccion(documento.cliente.direccion, documento.cliente.cp, documento.cliente.ciudad, documento.cliente.provincia, documento.cliente.pais)}
                  </p>
                )}
                {documento.cliente.email && <p className="doc-text-muted">{documento.cliente.email}</p>}
              </div>
            </div>
          </div>

          <hr className="doc-divider" />

          {/* TABLA DE LÍNEAS */}
          <table className="doc-table">
            <thead>
              <tr className="doc-thead-row">
                <th className="doc-th-left">Descripción</th>
                <th className="doc-th-right">Cant.</th>
                <th className="doc-th-right">Precio</th>
                {esFinanciero && (
                  <>
                    <th className="doc-th-right">IVA</th>
                    {documento.mostrarIrpf && <th className="doc-th-right">IRPF</th>}
                  </>
                )}
                <th className="doc-th-right-last">Importe</th>
              </tr>
            </thead>
            <tbody>
              {documento.lineas.map((linea, i) => {
                const { base } = calcularLinea(linea)
                return (
                  <tr key={linea.id} className={i % 2 === 0 ? 'doc-tr-even' : 'doc-tr-odd'}>
                    <td className="doc-td">{linea.descripcion}</td>
                    <td className="doc-td-right">{linea.cantidad}</td>
                    <td className="doc-td-right">{formatEuro(linea.precioUnitario)}</td>
                    {esFinanciero && (
                      <>
                        <td className="doc-td-right">{linea.iva}%</td>
                        {documento.mostrarIrpf && <td className="doc-td-right">-{linea.irpf}%</td>}
                      </>
                    )}
                    <td className="doc-td-amount">{formatEuro(base)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* TOTALES */}
          {esFinanciero && (
            <div className="doc-totals-wrap">
              <div className="doc-totals-box">
                <div className="doc-total-row">
                  <span>Base imponible</span>
                  <span>{formatEuro(totales.baseImponible)}</span>
                </div>
                <div className="doc-total-row">
                  <span>IVA</span>
                  <span>+ {formatEuro(totales.totalIva)}</span>
                </div>
                {documento.mostrarIrpf && totales.totalIrpf > 0 && (
                  <div className="doc-total-row">
                    <span>IRPF</span>
                    <span>− {formatEuro(totales.totalIrpf)}</span>
                  </div>
                )}
                <div className="doc-total-final">
                  <span>TOTAL</span>
                  <span>{formatEuro(totales.total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* FORMA DE PAGO */}
          {esFinanciero && documento.formaPago && (
            <div className="doc-section">
              <p className="doc-section-label">Forma de pago</p>
              <p className="doc-section-value">
                {ETIQUETAS_METODO_PAGO[documento.formaPago.metodo]}
              </p>
              {documento.formaPago.metodo === 'transferencia' && documento.formaPago.cuenta && (
                <p className="doc-section-detail">{documento.formaPago.cuenta}</p>
              )}
              {documento.formaPago.metodo === 'bizum' && documento.formaPago.telefono && (
                <p className="doc-section-detail">{documento.formaPago.telefono}</p>
              )}
              {documento.formaPago.metodo === 'paypal' && (
                <div className="doc-section-detail-list">
                  {documento.formaPago.email    && <p>{documento.formaPago.email}</p>}
                  {documento.formaPago.telefono && <p>{documento.formaPago.telefono}</p>}
                </div>
              )}
              {documento.formaPago.metodo === 'otro' && documento.formaPago.detalle && (
                <p className="doc-section-detail-wrap">{documento.formaPago.detalle}</p>
              )}
            </div>
          )}

          {/* NOTAS */}
          {documento.notas && (
            <div className="doc-notes-section">
              <p className="doc-section-label">Notas</p>
              <p className="doc-section-detail-wrap">{documento.notas}</p>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="doc-footer">
          <p className="doc-footer-text">
            Creado con{' '}
            <span className="doc-footer-brand" style={{ color: 'var(--color-primary)' }}>HerramientasAutonomos</span>
            {' '}— Herramientas para autónomos en España
          </p>
        </div>

      </div>
    )
  }
)

DocumentPreview.displayName = 'DocumentPreview'
