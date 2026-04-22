/**
 * DocumentoListado.tsx
 * Listado genérico reutilizable para todos los tipos de documento.
 * Si no hay documentos muestra empty state con CTA.
 */
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { Plus, FileText, Trash2, ExternalLink } from 'lucide-react'

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
  enviada:     'var(--color-blue)',
  enviado:     'var(--color-blue)',
  cobrada:     'var(--color-success)',
  aceptado:    'var(--color-success)',
  firmado:     'var(--color-success)',
  finalizado:  'var(--color-success)',
  entregado:   'var(--color-success)',
  cancelada:   'var(--color-error)',
  rechazado:   'var(--color-error)',
  caducado:    'var(--color-warning)',
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
    if (!confirm('¿Eliminar este documento? Esta acción no se puede deshacer.')) return
    setDeleting(id)
    await supabase.from(tipo).delete().eq('id', id)
    setRows(prev => prev.filter(r => r.id !== id))
    setDeleting(null)
  }

  const handleCrear = () => {
    if (onCreate) {
      onCreate()
      return
    }
    window.open(cfg.routeCrear, '_blank')
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Confirmación de guardado desde el editor embebido */}
      {flashMessage && (
        <div
          style={{
            marginBottom: 'var(--space-5)',
            padding: 'var(--space-4)',
            background: 'var(--color-primary-highlight)',
            border: '1.5px solid var(--color-primary)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-primary)',
            fontWeight: 600,
          }}
        >
          {flashMessage}
        </div>
      )}

      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text)' }}>{cfg.label}</h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 2 }}>
            {loading ? 'Cargando…' : `${rows.length} ${rows.length === 1 ? cfg.labelSingular : cfg.label.toLowerCase()}`}
          </p>
        </div>
        <button onClick={handleCrear} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Plus size={15} /> Nueva {cfg.labelSingular}
        </button>
      </div>

      {/* Estado cargando */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ height: 64, borderRadius: 'var(--radius-lg)', background: 'var(--color-surface)', border: '2px solid var(--color-border)', animation: 'shimmer 1.5s ease-in-out infinite', backgroundSize: '200% 100%' }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && rows.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 'var(--space-16) var(--space-8)',
          background: 'var(--color-surface)', border: '2px dashed var(--color-border)',
          borderRadius: 'var(--radius-xl)', textAlign: 'center',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 'var(--radius-lg)',
            background: 'var(--color-surface-offset)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 'var(--space-4)',
          }}>
            <FileText size={24} style={{ color: 'var(--color-text-faint)' }} />
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
            Todavía no tienes {cfg.label.toLowerCase()}
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-5)', maxWidth: '36ch' }}>
            Crea tu primer{cfg.labelSingular === 'NDA' || cfg.labelSingular === 'albarán' ? '' : 'a'} {cfg.labelSingular} con el generador de herramientas.
          </p>
          <button onClick={handleCrear} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Plus size={15} /> Crear {cfg.labelSingular}
          </button>
        </div>
      )}

      {/* Listado */}
      {!loading && rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {rows.map(row => {
            const titulo   = row[cfg.campoTitulo] ?? '—'
            const cliente  = row[cfg.campoSecundario] ?? '—'
            const precio   = cfg.campoPrecio ? row[cfg.campoPrecio] : null
            const estado   = row.estado ?? ''
            const fecha    = row.fecha ? new Date(row.fecha).toLocaleDateString('es-ES') : ''
            const estadoColor = ESTADO_COLORS[estado] ?? 'var(--color-text-muted)'

            return (
              <div
                key={row.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-4)',
                  background: 'var(--color-surface)',
                  border: '2px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  boxShadow: '2px 2px 0px 0px var(--color-border)',
                  transition: 'box-shadow 90ms',
                }}
              >
                {/* Icono */}
                <div style={{
                  width: 36, height: 36, flexShrink: 0,
                  background: 'var(--color-surface-offset)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileText size={16} style={{ color: 'var(--color-text-muted)' }} />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{titulo}</span>
                    {estado && (
                      <span style={{
                        fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        color: estadoColor,
                        background: `color-mix(in oklch, ${estadoColor} 12%, var(--color-surface-2))`,
                        border: `1px solid color-mix(in oklch, ${estadoColor} 30%, var(--color-border))`,
                        borderRadius: 'var(--radius-full)', padding: '1px 7px',
                      }}>{estado}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {cliente}{fecha ? ` · ${fecha}` : ''}
                  </p>
                </div>

                {/* Precio */}
                {precio !== null && precio !== undefined && (
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {Number(precio).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </span>
                )}

                {/* Acciones */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                  <button
                    type="button"
                    title={onOpen ? 'Abrir documento' : 'Abrir herramienta'}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 32, height: 32, borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--color-border)',
                      background: 'var(--color-surface-2)',
                      color: 'var(--color-text-muted)',
                      transition: 'background 100ms, color 100ms',
                      textDecoration: 'none',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      if (onOpen) {
                        onOpen(row.id)
                        return
                      }
                      window.open(cfg.routeCrear, '_blank')
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-offset)'; e.currentTarget.style.color = 'var(--color-text)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface-2)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
                  >
                    <ExternalLink size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(row.id)}
                    disabled={deleting === row.id}
                    title="Eliminar"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 32, height: 32, borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--color-border)',
                      background: 'var(--color-surface-2)',
                      color: 'var(--color-text-muted)',
                      cursor: 'pointer',
                      transition: 'background 100ms, color 100ms',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-error-highlight)'; e.currentTarget.style.color = 'var(--color-error)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface-2)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
