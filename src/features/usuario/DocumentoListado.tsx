/**
 * DocumentoListado.tsx
 * Listado genérico reutilizable para todos los tipos de documento.
 * Si no hay documentos muestra empty state con CTA.
 */
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Plus, FileText, Trash2, ExternalLink, CheckCircle2, Undo2, Send } from 'lucide-react'
import {
  canDeleteFactura,
  canMarkFacturaAsCobrada,
  canMarkFacturaAsEmitida,
  canMarkFacturaAsNoCobrada,
  FACTURA_STATUS_LABELS,
  isFacturaStatus,
} from '../../types/facturaStatus'

export type TipoDocumento =
  | 'facturas' | 'presupuestos' | 'albaranes'
  | 'contratos' | 'ndas' | 'reclamaciones'

const TABLA_CONFIG: Record<TipoDocumento, {
  label: string
  labelSingular: string
  campoTitulo: string
  campoSecundario: string
  campoPrecio?: string
  routeCrear: string
}> = {
  facturas:      { label: 'Facturas',      labelSingular: 'factura',      campoTitulo: 'numero',  campoSecundario: 'cliente_nombre', campoPrecio: 'total',          routeCrear: '/factura' },
  presupuestos:  { label: 'Presupuestos',  labelSingular: 'presupuesto',  campoTitulo: 'numero',  campoSecundario: 'cliente_nombre', campoPrecio: 'total',          routeCrear: '/presupuesto' },
  albaranes:     { label: 'Albaranes',     labelSingular: 'albarán',      campoTitulo: 'numero',  campoSecundario: 'cliente_nombre', campoPrecio: undefined,        routeCrear: '/albaran' },
  contratos:     { label: 'Contratos',     labelSingular: 'contrato',     campoTitulo: 'titulo',  campoSecundario: 'cliente_nombre', campoPrecio: undefined,        routeCrear: '/contrato' },
  ndas:          { label: 'NDAs',          labelSingular: 'NDA',          campoTitulo: 'titulo',  campoSecundario: 'otra_parte_nombre', campoPrecio: undefined,     routeCrear: '/nda' },
  reclamaciones: { label: 'Reclamaciones', labelSingular: 'reclamación',  campoTitulo: 'titulo',  campoSecundario: 'deudor_nombre', campoPrecio: 'importe',       routeCrear: '/reclamacion-pago' },
}

const ESTADO_COLORS: Record<string, string> = {
  borrador:    'var(--color-text-faint)',
  emitida:     'var(--color-primary)',
  enviada:     'var(--color-primary)',
  enviado:     'var(--color-primary)',
  cobrada:     'var(--color-success)',
  aceptado:    'var(--color-success)',
  firmado:     'var(--color-success)',
  finalizado:  'var(--color-success)',
  entregado:   'var(--color-success)',
  cancelada:   'var(--color-error)',
  rechazado:   'var(--color-error)',
  caducado:    'var(--color-gold)',
  pendiente:   'var(--color-gold)',
  resuelta:    'var(--color-success)',
}

interface Props {
  tipo: TipoDocumento
  refreshKey?: number
  onCreate?: () => void
  onOpen?: (id: string) => void
  flashMessage?: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DocRow = Record<string, any>

export function DocumentoListado({ tipo, refreshKey = 0, onCreate, onOpen, flashMessage }: Props) {
  const { user } = useAuth()
  const cfg = TABLA_CONFIG[tipo]
  const [rows, setRows] = useState<DocRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const userId = user?.id

  useEffect(() => {
    if (!userId) {
      return
    }

    let active = true

    async function fetchRows() {
      setLoading(true)
      const { data } = await supabase
        .from(tipo)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (!active) return
      setRows(data ?? [])
      setLoading(false)
    }

    void fetchRows()

    return () => {
      active = false
    }
  }, [refreshKey, tipo, userId])

  const handleDelete = async (id: string) => {
    const row = rows.find((item) => item.id === id)
    if (!row) return
    if (tipo === 'facturas' && !canDeleteFactura(row.estado ?? '')) {
      alert('Solo puedes eliminar facturas en estado borrador. Para conservar trazabilidad fiscal, cambia el estado en lugar de borrar.')
      return
    }
    if (!confirm('¿Eliminar este documento? Esta acción no se puede deshacer.')) return
    setDeleting(id)
    const { error } = await supabase.from(tipo).delete().eq('id', id)
    if (error) {
      alert('No se pudo eliminar el documento. Inténtalo de nuevo.')
      setDeleting(null)
      return
    }
    setRows(prev => prev.filter(r => r.id !== id))
    setDeleting(null)
  }

  const handleFacturaStatus = async (id: string, estado: 'cobrada' | 'emitida') => {
    const { error } = await supabase
      .from('facturas')
      .update({ estado })
      .eq('id', id)

    if (error) {
      alert('No se pudo actualizar el estado de la factura.')
      return
    }

    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, estado } : row)))
  }

  const handleCrear = () => {
    if (onCreate) {
      onCreate()
      return
    }
    window.open(cfg.routeCrear, '_blank')
  }

  return (
    <div className="doc-listado-wrap">
      {flashMessage && (
        <div className="doc-flash">{flashMessage}</div>
      )}

      <div className="doc-listado-header">
        <div>
          <h1 className="section-title">{cfg.label}</h1>
          <p className="section-sub" style={{ marginTop: 2 }}>
            {loading ? 'Cargando…' : `${rows.length} ${rows.length === 1 ? cfg.labelSingular : cfg.label.toLowerCase()}`}
          </p>
        </div>
        <button onClick={handleCrear} className="btn btn-primary">
          <Plus size={15} /> Nueva {cfg.labelSingular}
        </button>
      </div>

      {loading && (
        <div className="doc-list">
          {[1, 2, 3].map(i => (
            <div key={i} className="doc-skeleton" />
          ))}
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="empty-state empty-state--xl">
          <div
            className="icon-box icon-box-lg mx-auto"
            style={{ background: 'var(--color-surface-offset)', marginBottom: 'var(--space-4)' }}
          >
            <FileText size={24} style={{ color: 'var(--color-text-faint)' }} />
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
            Todavía no tienes {cfg.label.toLowerCase()}
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-5)', maxWidth: '36ch' }}>
            Crea tu primer{cfg.labelSingular === 'NDA' || cfg.labelSingular === 'albarán' ? '' : 'a'} {cfg.labelSingular} con el generador de herramientas.
          </p>
          <button onClick={handleCrear} className="btn btn-primary">
            <Plus size={15} /> Crear {cfg.labelSingular}
          </button>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="doc-list">
          {rows.map(row => {
            const titulo   = row[cfg.campoTitulo] ?? '—'
            const cliente  = row[cfg.campoSecundario] ?? '—'
            const precio   = cfg.campoPrecio ? row[cfg.campoPrecio] : null
            const estado   = row.estado ?? ''
            const fecha    = row.fecha ? new Date(row.fecha).toLocaleDateString('es-ES') : ''
            const estadoColor = ESTADO_COLORS[estado] ?? 'var(--color-text-muted)'
            const estadoLabel = tipo === 'facturas' && isFacturaStatus(estado)
              ? FACTURA_STATUS_LABELS[estado]
              : estado

            return (
              <div key={row.id} className="doc-row">
                <div
                  className="icon-box icon-box-md"
                  style={{ background: 'var(--color-surface-offset)' }}
                >
                  <FileText size={16} style={{ color: 'var(--color-text-muted)' }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
                    <span className="doc-row-title">{titulo}</span>
                    {estado && (
                      <span style={{
                        fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        color: estadoColor,
                        background: `color-mix(in oklch, ${estadoColor} 12%, var(--color-surface-2))`,
                        border: `1px solid color-mix(in oklch, ${estadoColor} 30%, var(--color-border))`,
                        borderRadius: 'var(--radius-full)', padding: '1px 7px',
                      }}>{estadoLabel}</span>
                    )}
                  </div>
                  <p className="doc-row-meta">
                    {cliente}{fecha ? ` · ${fecha}` : ''}
                  </p>
                </div>

                {precio !== null && precio !== undefined && (
                  <span className="doc-row-price">
                    {Number(precio).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </span>
                )}

                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    title={onOpen ? 'Abrir documento' : 'Abrir herramienta'}
                    className="icon-btn"
                    onClick={() => {
                      if (onOpen) {
                        onOpen(row.id)
                        return
                      }
                      window.open(cfg.routeCrear, '_blank')
                    }}
                  >
                    <ExternalLink size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(row.id)}
                    disabled={deleting === row.id}
                    title="Eliminar"
                    className="icon-btn icon-btn--danger"
                  >
                    <Trash2 size={13} />
                  </button>
                  {tipo === 'facturas' && canMarkFacturaAsCobrada(estado) && (
                    <button
                      onClick={() => { void handleFacturaStatus(row.id, 'cobrada') }}
                      title="Marcar como cobrada"
                      className="icon-btn icon-btn--success"
                    >
                      <CheckCircle2 size={13} />
                    </button>
                  )}
                  {tipo === 'facturas' && canMarkFacturaAsEmitida(estado) && (
                    <button
                      onClick={() => { void handleFacturaStatus(row.id, 'emitida') }}
                      title="Marcar como emitida"
                      className="icon-btn icon-btn--primary"
                    >
                      <Send size={13} />
                    </button>
                  )}
                  {tipo === 'facturas' && canMarkFacturaAsNoCobrada(estado) && (
                    <button
                      onClick={() => { void handleFacturaStatus(row.id, 'emitida') }}
                      title="Marcar como no cobrada"
                      className="icon-btn icon-btn--gold"
                    >
                      <Undo2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
