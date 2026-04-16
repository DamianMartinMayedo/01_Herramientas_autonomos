/**
 * LegalDocPreview.tsx
 * Vista previa A4 para documentos legales de texto estructurado.
 * Cubre: ContratoServiciosDoc | NdaDoc | ReclamacionPagoDoc
 */
import { forwardRef } from 'react'
import type { LegalDoc, ParteLegal, ContratoServiciosDoc, NdaDoc, ReclamacionPagoDoc } from '../../types/legalDoc.types'

// ─── Helpers de formato ───────────────────────────────────────────────────────

function formatFecha(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(
    new Date(Number(y), Number(m) - 1, Number(d))
  )
}

function formatEuro(n: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
}

// ─── Bloque de parte (emisor / receptor / acreedor…) ─────────────────────────

function BlockParte({ label, parte }: { label: string; parte: ParteLegal }) {
  return (
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: '0.25rem' }}>
        {label}
      </p>
      <p style={{ fontWeight: 700, fontSize: '0.75rem', color: '#111827' }}>{parte.nombre || '—'}</p>
      {parte.nif && <p style={{ fontSize: '0.65rem', color: '#6b7280' }}>NIF/ID: {parte.nif}</p>}
      {parte.direccion && <p style={{ fontSize: '0.65rem', color: '#6b7280' }}>{parte.direccion}</p>}
      {(parte.cp || parte.ciudad) && (
        <p style={{ fontSize: '0.65rem', color: '#6b7280' }}>
          {parte.cp} {parte.ciudad}{parte.provincia ? `, ${parte.provincia}` : ''}
        </p>
      )}
      {parte.email && <p style={{ fontSize: '0.65rem', color: '#6b7280' }}>{parte.email}</p>}
      {parte.representante && (
        <p style={{ fontSize: '0.65rem', color: '#374151', marginTop: '0.2rem' }}>
          Rep.: {parte.representante}{parte.cargo ? ` (${parte.cargo})` : ''}
        </p>
      )}
    </div>
  )
}

// ─── Sección con título ───────────────────────────────────────────────────────

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <p style={{
        fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.09em', color: '#9ca3af',
        borderBottom: '1px solid #e5e7eb', paddingBottom: '0.2rem', marginBottom: '0.5rem',
      }}>
        {titulo}
      </p>
      {children}
    </div>
  )
}

function Parrafo({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '0.72rem', color: '#374151', lineHeight: 1.65, marginBottom: '0.4rem' }}>
      {children}
    </p>
  )
}

function Clausula({ numero, titulo, children }: { numero: number; titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#111827', marginBottom: '0.2rem' }}>
        {numero}. {titulo}
      </p>
      <div style={{ paddingLeft: '0.75rem' }}>{children}</div>
    </div>
  )
}

// ─── Bloque de firma ──────────────────────────────────────────────────────────

function BloquesFirma({ partes }: { partes: Array<{ label: string; parte: ParteLegal }> }) {
  return (
    <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem' }}>
      {partes.map(({ label, parte }) => (
        <div key={label} style={{ flex: 1 }}>
          <div style={{ borderBottom: '1px solid #374151', height: '2.5rem', marginBottom: '0.4rem' }} />
          <p style={{ fontSize: '0.65rem', color: '#6b7280' }}>{label}</p>
          <p style={{ fontSize: '0.65rem', fontWeight: 600, color: '#111827' }}>{parte.nombre || '—'}</p>
          {parte.nif && <p style={{ fontSize: '0.6rem', color: '#9ca3af' }}>NIF: {parte.nif}</p>}
        </div>
      ))}
    </div>
  )
}

// ─── Previews por tipo ────────────────────────────────────────────────────────

function PreviewContrato({ doc }: { doc: ContratoServiciosDoc }) {
  const PERIODO_LABEL: Record<string, string> = {
    pago_unico: 'Pago único', mensual: 'Mensual', quincenal: 'Quincenal',
    semanal: 'Semanal', por_hito: 'Por hito / entregable',
  }
  const DURACION_LABEL: Record<string, string> = {
    indefinido: 'Indefinida', fecha_fin: 'Con fecha de fin', por_proyecto: 'Por proyecto',
  }

  return (
    <>
      <Seccion titulo="Partes">
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <BlockParte label="Prestador del servicio" parte={doc.prestador} />
          <BlockParte label="Cliente" parte={doc.cliente} />
        </div>
      </Seccion>

      <Seccion titulo="Cláusulas">
        <Clausula numero={1} titulo="Objeto del contrato">
          <Parrafo>
            {doc.objetoContrato ||
              'El prestador se compromete a realizar los servicios acordados entre ambas partes.'}
          </Parrafo>
        </Clausula>

        <Clausula numero={2} titulo="Duración">
          <Parrafo>
            La duración del presente contrato es <strong>{DURACION_LABEL[doc.duracion]}</strong>,
            con inicio el <strong>{formatFecha(doc.fechaInicio)}</strong>
            {doc.duracion === 'fecha_fin' && doc.fechaFin
              ? ` y fecha de finalización el ${formatFecha(doc.fechaFin)}.`
              : '.'}
          </Parrafo>
        </Clausula>

        <Clausula numero={3} titulo="Condiciones económicas">
          <Parrafo>
            {doc.importeTotal !== undefined && doc.importeTotal > 0
              ? `El importe total acordado es de ${formatEuro(doc.importeTotal)}.`
              : 'El importe se acordará por las partes.'}
            {' '}La facturación se realizará de forma{' '}
            <strong>{PERIODO_LABEL[doc.periodoFacturacion].toLowerCase()}</strong>.
            {doc.formaPago ? ` Forma de pago: ${doc.formaPago}.` : ''}
          </Parrafo>
        </Clausula>

        {doc.clausulaConfidencialidad && (
          <Clausula numero={4} titulo="Confidencialidad">
            <Parrafo>
              Ambas partes se comprometen a mantener la más estricta confidencialidad sobre
              toda información intercambiada en el marco de este contrato.
            </Parrafo>
          </Clausula>
        )}

        {doc.clausulaPropiedadIntelectual && (
          <Clausula numero={doc.clausulaConfidencialidad ? 5 : 4} titulo="Propiedad intelectual">
            <Parrafo>
              Todos los entregables y resultados generados durante la prestación de los servicios
              serán propiedad del cliente una vez recibido el pago íntegro correspondiente.
            </Parrafo>
          </Clausula>
        )}

        {doc.penalizacionIncumplimiento && (
          <Clausula numero={6} titulo="Penalización por incumplimiento">
            <Parrafo>{doc.penalizacionIncumplimiento}</Parrafo>
          </Clausula>
        )}

        <Clausula numero={7} titulo="Jurisdicción">
          <Parrafo>
            Ante cualquier controversia, ambas partes se someten a los juzgados y tribunales de{' '}
            <strong>{doc.jurisdiccion || doc.metadatos.lugar || '—'}</strong>.
          </Parrafo>
        </Clausula>
      </Seccion>

      {doc.notas && (
        <Seccion titulo="Notas">
          <Parrafo style={{ whiteSpace: 'pre-wrap' } as React.CSSProperties}>{doc.notas}</Parrafo>
        </Seccion>
      )}

      <BloquesFirma partes={[
        { label: 'Prestador del servicio', parte: doc.prestador },
        { label: 'Cliente', parte: doc.cliente },
      ]} />
    </>
  )
}

function PreviewNda({ doc }: { doc: NdaDoc }) {
  return (
    <>
      <Seccion titulo="Partes">
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <BlockParte label={doc.direction === 'bilateral' ? 'Parte A' : 'Parte divulgadora'} parte={doc.parteA} />
          <BlockParte label={doc.direction === 'bilateral' ? 'Parte B' : 'Parte receptora'} parte={doc.parteB} />
        </div>
      </Seccion>

      <Seccion titulo="Cláusulas">
        <Clausula numero={1} titulo="Objeto">
          <Parrafo>
            El presente acuerdo de confidencialidad{' '}
            <strong>{doc.direction === 'bilateral' ? 'bilateral' : 'unilateral'}</strong>{' '}
            tiene por objeto proteger la siguiente información:
          </Parrafo>
          <Parrafo style={{ fontStyle: 'italic', paddingLeft: '0.5rem' } as React.CSSProperties}>
            {doc.objetoConfidencialidad || '— (pendiente de definir)'}
          </Parrafo>
        </Clausula>

        {doc.excepciones && (
          <Clausula numero={2} titulo="Excepciones">
            <Parrafo>{doc.excepciones}</Parrafo>
          </Clausula>
        )}

        <Clausula numero={doc.excepciones ? 3 : 2} titulo="Vigencia">
          <Parrafo>
            La obligación de confidencialidad tendrá una duración de{' '}
            <strong>{doc.duracionMeses} meses</strong> desde la fecha de la firma.
          </Parrafo>
        </Clausula>

        {doc.penalizacion && (
          <Clausula numero={4} titulo="Penalización">
            <Parrafo>{doc.penalizacion}</Parrafo>
          </Clausula>
        )}

        <Clausula numero={5} titulo="Jurisdicción">
          <Parrafo>
            Ante cualquier disputa, ambas partes se someten a los tribunales de{' '}
            <strong>{doc.jurisdiccion || doc.metadatos.lugar || '—'}</strong>.
          </Parrafo>
        </Clausula>
      </Seccion>

      {doc.notas && (
        <Seccion titulo="Notas">
          <Parrafo>{doc.notas}</Parrafo>
        </Seccion>
      )}

      <BloquesFirma partes={[
        { label: doc.direction === 'bilateral' ? 'Parte A' : 'Parte divulgadora', parte: doc.parteA },
        { label: doc.direction === 'bilateral' ? 'Parte B' : 'Parte receptora', parte: doc.parteB },
      ]} />
    </>
  )
}

function PreviewReclamacion({ doc }: { doc: ReclamacionPagoDoc }) {
  const TONO_SALUDO: Record<string, string> = {
    amistoso: 'Estimado/a',
    formal: 'De mi consideración:',
    urgente: 'Por la presente y de forma urgente,',
  }
  const diasLabel = doc.plazoRespuesta === 1 ? '1 día hábil' : `${doc.plazoRespuesta} días hábiles`

  return (
    <>
      <Seccion titulo="Destinatario">
        <BlockParte label="" parte={doc.deudor} />
      </Seccion>

      <div style={{ margin: '0.75rem 0', fontSize: '0.72rem', color: '#374151' }}>
        <p style={{ marginBottom: '0.6rem' }}>
          {TONO_SALUDO[doc.tono]}{doc.tono === 'amistoso' ? ` ${doc.deudor.nombre || ''}:` : ''}
        </p>

        <p style={{ marginBottom: '0.5rem', lineHeight: 1.7 }}>
          Por medio de la presente, <strong>{doc.acreedor.nombre}</strong>, con NIF{' '}
          <strong>{doc.acreedor.nif}</strong>, le comunicamos que a fecha de hoy,{' '}
          <strong>{formatFecha(doc.metadatos.fecha)}</strong>, se encuentra pendiente de pago
          la factura n.º <strong>{doc.referenciaFactura}</strong>, emitida el{' '}
          <strong>{formatFecha(doc.fechaFactura)}</strong>, con fecha de vencimiento{' '}
          <strong>{formatFecha(doc.fechaVencimiento)}</strong>, por importe de{' '}
          <strong>{formatEuro(doc.importeDeuda)}</strong>.
        </p>

        <p style={{ marginBottom: '0.5rem', lineHeight: 1.7 }}>
          Le rogamos proceda a la liquidación de dicho importe en un plazo máximo de{' '}
          <strong>{diasLabel}</strong> a partir de la recepción de esta comunicación.
        </p>

        {doc.tono === 'formal' && (
          <p style={{ marginBottom: '0.5rem', lineHeight: 1.7 }}>
            En caso de no recibir el pago en el plazo indicado, nos veremos en la necesidad
            de adoptar las medidas oportunas para la reclamación de la deuda.
          </p>
        )}

        {doc.tono === 'urgente' && doc.mencionAccionLegal && (
          <p style={{ marginBottom: '0.5rem', lineHeight: 1.7, fontWeight: 600, color: '#dc2626' }}>
            De no regularizarse la situación en el plazo indicado, procederemos a iniciar las
            acciones legales pertinentes, incluyendo reclamación judicial y comunicación a
            registros de morosidad, sin que sea necesario previo aviso adicional.
          </p>
        )}

        {doc.notas && (
          <p style={{ marginBottom: '0.5rem', lineHeight: 1.7, fontStyle: 'italic' }}>
            {doc.notas}
          </p>
        )}

        <p style={{ marginTop: '0.75rem', lineHeight: 1.7 }}>Atentamente,</p>
      </div>

      <BloquesFirma partes={[
        { label: 'El acreedor', parte: doc.acreedor },
      ]} />
    </>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface LegalDocPreviewProps {
  documento: LegalDoc
}

const TITULO_DOC: Record<LegalDoc['tipo'], string> = {
  contrato: 'CONTRATO DE PRESTACIÓN DE SERVICIOS',
  nda: 'ACUERDO DE CONFIDENCIALIDAD (NDA)',
  reclamacion: 'CARTA DE RECLAMACIÓN DE PAGO',
}

export const LegalDocPreview = forwardRef<HTMLDivElement, LegalDocPreviewProps>(
  ({ documento }, ref) => {
    const titulo = TITULO_DOC[documento.tipo]
    const { metadatos } = documento

    return (
      <div
        ref={ref}
        className="bg-white w-[210mm] min-h-[297mm] p-10 text-zinc-800 text-sm relative"
        style={{ fontFamily: "'Figtree', ui-sans-serif, system-ui, sans-serif" }}
      >
        {/* CABECERA */}
        <div style={{ borderBottom: '2px solid #111827', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '-0.01em', color: '#111827' }}>
                {titulo}
              </h1>
              {metadatos.referencia && (
                <p style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '0.15rem' }}>
                  Ref.: {metadatos.referencia}
                </p>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                {metadatos.lugar || '—'}, {formatFecha(metadatos.fecha)}
              </p>
            </div>
          </div>
        </div>

        {/* CUERPO — delega en el componente específico */}
        {documento.tipo === 'contrato' && <PreviewContrato doc={documento as ContratoServiciosDoc} />}
        {documento.tipo === 'nda'      && <PreviewNda      doc={documento as NdaDoc} />}
        {documento.tipo === 'reclamacion' && <PreviewReclamacion doc={documento as ReclamacionPagoDoc} />}

        {/* FOOTER */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '0.75rem 2.5rem', borderTop: '1px solid #f3f4f6',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.55rem', color: '#d1d5db' }}>
            Creado con{' '}
            <span style={{ fontWeight: 700, color: 'var(--color-primary, #01696f)' }}>HerramientasAutonomos</span>
            {' '}— Herramientas para autónomos en España
          </p>
        </div>
      </div>
    )
  }
)

LegalDocPreview.displayName = 'LegalDocPreview'
