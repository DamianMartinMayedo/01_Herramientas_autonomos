/**
 * DocumentoListado.tsx
 * Listado genérico reutilizable para todos los tipos de documento.
 * Para facturas, divide entre Borradores y Facturas emitidas con acciones específicas.
 */
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import {
  Plus, FileText, Trash2, ExternalLink, CheckCircle2, Undo2, Send,
  Pencil, MoreHorizontal, Eye, Download, Copy, PenLine, Mail, X,
} from 'lucide-react'
import { EmailModal } from '../../components/shared/EmailModal'
import { AlertModal } from '../../components/shared/AlertModal'
import { ConfirmModal } from '../admin/components/ConfirmModal'
import {
  canDeleteFactura,
  canMarkFacturaAsCobrada,
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
  articuloFemenino: boolean
  campoTitulo: string
  campoSecundario: string
  campoPrecio?: string
  routeCrear: string
}> = {
  facturas:      { label: 'Facturas',      labelSingular: 'factura',      articuloFemenino: true,  campoTitulo: 'numero',  campoSecundario: 'cliente_nombre',    campoPrecio: 'total',   routeCrear: '/factura' },
  presupuestos:  { label: 'Presupuestos',  labelSingular: 'presupuesto',  articuloFemenino: false, campoTitulo: 'numero',  campoSecundario: 'cliente_nombre',    campoPrecio: 'total',   routeCrear: '/presupuesto' },
  albaranes:     { label: 'Albaranes',     labelSingular: 'albarán',      articuloFemenino: false, campoTitulo: 'numero',  campoSecundario: 'cliente_nombre',    campoPrecio: undefined, routeCrear: '/albaran' },
  contratos:     { label: 'Contratos',     labelSingular: 'contrato',     articuloFemenino: false, campoTitulo: 'titulo',  campoSecundario: 'cliente_nombre',    campoPrecio: undefined, routeCrear: '/contrato' },
  ndas:          { label: 'NDAs',          labelSingular: 'NDA',          articuloFemenino: false, campoTitulo: 'titulo',  campoSecundario: 'otra_parte_nombre', campoPrecio: undefined, routeCrear: '/nda' },
  reclamaciones: { label: 'Reclamaciones', labelSingular: 'reclamación',  articuloFemenino: true,  campoTitulo: 'titulo',  campoSecundario: 'deudor_nombre',     campoPrecio: 'importe', routeCrear: '/reclamacion-pago' },
}

const ESTADO_COLORS: Record<string, string> = {
  borrador:   'var(--color-text-faint)',
  emitida:    'var(--color-primary)',
  enviada:    'var(--color-primary)',
  enviado:    'var(--color-primary)',
  cobrada:    'var(--color-success)',
  aceptado:   'var(--color-success)',
  firmado:    'var(--color-success)',
  finalizado: 'var(--color-success)',
  entregado:  'var(--color-success)',
  cancelada:  'var(--color-error)',
  rechazado:  'var(--color-error)',
  caducado:   'var(--color-gold)',
  pendiente:  'var(--color-gold)',
  resuelta:   'var(--color-success)',
}

interface Props {
  tipo: TipoDocumento
  refreshKey?: number
  onCreate?: () => void
  onOpen?: (id: string) => void
  onView?: (id: string) => void
  onDescargar?: (id: string) => void
  onEmitir?: (id: string) => void
  onDuplicar?: (id: string) => void
  onCorregir?: (id: string) => void
  flashMessage?: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DocRow = Record<string, any>

export function DocumentoListado({
  tipo, refreshKey = 0, onCreate, onOpen, onView, onDescargar, onEmitir, onDuplicar, onCorregir, flashMessage,
}: Props) {
  const { user } = useAuth()
  const cfg = TABLA_CONFIG[tipo]
  const [rows, setRows] = useState<DocRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null)
  const [emitirConfirmId, setEmitirConfirmId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [emailModalRow, setEmailModalRow] = useState<DocRow | null>(null)
  const [activeTab, setActiveTab] = useState<'borradores' | 'emitidas'>('borradores')
  const [alertState, setAlertState] = useState<{ title?: string; msg: string; variant?: 'danger' | 'warning' | 'info' } | null>(null)
  const userId = user?.id

  useEffect(() => {
    setActiveTab('borradores')
  }, [tipo])

  useEffect(() => {
    if (!userId) return
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
    return () => { active = false }
  }, [refreshKey, tipo, userId])

  const handleDeleteRequest = (id: string) => {
    const row = rows.find((item) => item.id === id)
    if (!row) return
    if (tipo === 'facturas' && !canDeleteFactura(row.estado ?? '')) {
      setAlertState({
        title: 'No se puede eliminar',
        msg: 'Solo puedes eliminar facturas en estado borrador. Para conservar trazabilidad fiscal, cambia el estado en lugar de borrar.',
        variant: 'warning',
      })
      return
    }
    setDeleteConfirmId(id)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return
    const id = deleteConfirmId
    setDeleteConfirmId(null)
    setDeleting(id)
    const { error } = await supabase.from(tipo).delete().eq('id', id)
    if (error) {
      setAlertState({ title: 'Error', msg: 'No se pudo eliminar el documento. Inténtalo de nuevo.', variant: 'danger' })
      setDeleting(null)
      return
    }
    setRows(prev => prev.filter(r => r.id !== id))
    setDeleting(null)
  }

  const handleFacturaStatus = async (id: string, estado: 'cobrada' | 'emitida') => {
    const { error } = await supabase.from('facturas').update({ estado }).eq('id', id)
    if (error) {
      setAlertState({ title: 'Error', msg: 'No se pudo actualizar el estado de la factura.', variant: 'danger' })
      return
    }
    setRows(prev => prev.map(row => (row.id === id ? { ...row, estado } : row)))
  }

  const handleCrear = () => {
    if (onCreate) { onCreate(); return }
    window.open(cfg.routeCrear, '_blank')
  }

  // ── Helpers de renderizado ────────────────────────────────────────────────

  const renderStatusBadge = (estado: string) => {
    if (!estado) return null
    const estadoColor = ESTADO_COLORS[estado] ?? 'var(--color-text-muted)'
    const estadoLabel = tipo === 'facturas' && isFacturaStatus(estado)
      ? FACTURA_STATUS_LABELS[estado]
      : estado
    return (
      <span style={{
        fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
        color: estadoColor,
        background: `color-mix(in oklch, ${estadoColor} 12%, var(--color-surface-2))`,
        border: `1px solid color-mix(in oklch, ${estadoColor} 30%, var(--color-border))`,
        borderRadius: 'var(--radius-full)', padding: '1px 7px',
      }}>
        {estadoLabel}
      </span>
    )
  }

  const renderRowBase = (row: DocRow, actions: React.ReactNode, extraBadge?: React.ReactNode) => {
    const titulo  = row[cfg.campoTitulo] ?? '—'
    const cliente = row[cfg.campoSecundario] ?? '—'
    const precio  = cfg.campoPrecio ? row[cfg.campoPrecio] : null
    const fecha   = row.fecha ? new Date(row.fecha).toLocaleDateString('es-ES') : ''

    return (
      <div key={row.id} className="doc-row">
        <div className="icon-box icon-box-md" style={{ background: 'var(--color-surface-offset)' }}>
          <FileText size={16} style={{ color: 'var(--color-text-muted)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
            <span className="doc-row-title">{titulo || 'Sin número'}</span>
            {renderStatusBadge(row.estado ?? '')}
            {extraBadge}
          </div>
          <p className="doc-row-meta">{cliente}{fecha ? ` · ${fecha}` : ''}</p>
        </div>
        {precio !== null && precio !== undefined && (
          <span className="doc-row-price">
            {Number(precio).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </span>
        )}
        <div className="flex gap-2 shrink-0">
          {actions}
        </div>
      </div>
    )
  }

  const renderRectificativaBadge = () => (
    <span style={{
      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
      color: 'var(--color-gold)',
      background: 'color-mix(in oklch, var(--color-gold) 12%, var(--color-surface-2))',
      border: '1px solid color-mix(in oklch, var(--color-gold) 30%, var(--color-border))',
      borderRadius: 'var(--radius-full)', padding: '1px 7px',
    }}>Rectificativa</span>
  )

  // Borrador de factura: Editar · Emitir (solo si no es rectificativa) · Eliminar
  const renderBorradorRow = (row: DocRow) => renderRowBase(row, (
    <>
      <button type="button" title="Editar" className="icon-btn" onClick={() => onOpen?.(row.id)}>
        <Pencil size={13} />
      </button>
      {!row.datos_json?.esRectificativa && (
        <button
          type="button"
          title="Emitir factura"
          className="icon-btn icon-btn--primary"
          onClick={() => setEmitirConfirmId(row.id)}
        >
          <Send size={13} />
        </button>
      )}
      <button
        type="button"
        title="Eliminar"
        className="icon-btn icon-btn--danger"
        onClick={() => handleDeleteRequest(row.id)}
        disabled={deleting === row.id}
      >
        <Trash2 size={13} />
      </button>
    </>
  ), row.datos_json?.esRectificativa ? renderRectificativaBadge() : undefined)

  // Factura emitida: dropdown con múltiples opciones
  const renderEmitidaRow = (row: DocRow) => renderRowBase(row, (
    <div className="dropdown-wrap">
      <button
        type="button"
        title="Más opciones"
        className="icon-btn"
        onClick={(e) => {
          e.stopPropagation()
          setDropdownOpenId(dropdownOpenId === row.id ? null : row.id)
        }}
      >
        <MoreHorizontal size={13} />
      </button>
      {dropdownOpenId === row.id && (
        <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
          <button className="dropdown-item" onClick={() => { setDropdownOpenId(null); onView?.(row.id) }}>
            <Eye size={13} /> Ver
          </button>
          <button className="dropdown-item" onClick={() => { setDropdownOpenId(null); onDescargar?.(row.id) }}>
            <Download size={13} /> Descargar
          </button>
          {canMarkFacturaAsCobrada(row.estado) && (
            <button className="dropdown-item" onClick={() => { setDropdownOpenId(null); void handleFacturaStatus(row.id, 'cobrada') }}>
              <CheckCircle2 size={13} /> Marcar como cobrada
            </button>
          )}
          {canMarkFacturaAsNoCobrada(row.estado) && (
            <button className="dropdown-item" onClick={() => { setDropdownOpenId(null); void handleFacturaStatus(row.id, 'emitida') }}>
              <Undo2 size={13} /> Marcar como no cobrada
            </button>
          )}
          {!row.datos_json?.esRectificativa && (
            <>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => { setDropdownOpenId(null); onDuplicar?.(row.id) }}>
                <Copy size={13} /> Duplicar
              </button>
              <button className="dropdown-item" onClick={() => { setDropdownOpenId(null); onCorregir?.(row.id) }}>
                <PenLine size={13} /> Corregir
              </button>
            </>
          )}
          <div className="dropdown-divider" />
          <button className="dropdown-item" onClick={() => { setDropdownOpenId(null); setEmailModalRow(row) }}>
            <Mail size={13} /> Enviar por correo
          </button>
        </div>
      )}
    </div>
  ), row.datos_json?.esRectificativa ? renderRectificativaBadge() : undefined)

  // Fila genérica para tipos distintos a facturas
  const renderGenericRow = (row: DocRow) => renderRowBase(row, (
    <>
      <button
        type="button"
        title={onOpen ? 'Abrir documento' : 'Abrir herramienta'}
        className="icon-btn"
        onClick={() => {
          if (onOpen) { onOpen(row.id); return }
          window.open(cfg.routeCrear, '_blank')
        }}
      >
        <ExternalLink size={13} />
      </button>
      <button
        type="button"
        onClick={() => handleDeleteRequest(row.id)}
        disabled={deleting === row.id}
        title="Eliminar"
        className="icon-btn icon-btn--danger"
      >
        <Trash2 size={13} />
      </button>
    </>
  ))

  // ── Datos derivados para facturas ─────────────────────────────────────────
  const borradores = tipo === 'facturas' ? rows.filter(r => r.estado === 'borrador') : []
  const emitidas   = tipo === 'facturas' ? rows.filter(r => r.estado !== 'borrador') : []

  const emptyState = (
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
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-5)', maxWidth: '36ch', margin: '0 auto var(--space-5)' }}>
        Crea tu primer{cfg.articuloFemenino ? 'a' : ''} {cfg.labelSingular} con el generador de herramientas.
      </p>
      <button onClick={handleCrear} className="btn btn-primary">
        <Plus size={15} /> Crear {cfg.labelSingular}
      </button>
    </div>
  )

  return (
    <div className="doc-listado-wrap">
      {flashMessage && <div className="doc-flash">{flashMessage}</div>}

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
          {[1, 2, 3].map(i => <div key={i} className="doc-skeleton" />)}
        </div>
      )}

      {/* Vista con pestañas para facturas */}
      {!loading && tipo === 'facturas' && (
        <>
          {borradores.length === 0 && emitidas.length === 0 && emptyState}

          {rows.length > 0 && (
            <>
              <div className="flex gap-2" style={{ marginBottom: 'var(--space-5)' }}>
                <button
                  className={`filter-pill${activeTab === 'borradores' ? ' active' : ''}`}
                  onClick={() => setActiveTab('borradores')}
                >
                  Borradores{borradores.length > 0 ? ` (${borradores.length})` : ''}
                </button>
                <button
                  className={`filter-pill${activeTab === 'emitidas' ? ' active' : ''}`}
                  onClick={() => setActiveTab('emitidas')}
                >
                  Emitidas{emitidas.length > 0 ? ` (${emitidas.length})` : ''}
                </button>
              </div>

              {activeTab === 'borradores' && (
                borradores.length === 0
                  ? <p className="section-sub" style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>No tienes borradores.</p>
                  : <div className="doc-list">{borradores.map(row => renderBorradorRow(row))}</div>
              )}

              {activeTab === 'emitidas' && (
                emitidas.length === 0
                  ? <p className="section-sub" style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>No tienes facturas emitidas.</p>
                  : <div className="doc-list">{emitidas.map(row => renderEmitidaRow(row))}</div>
              )}
            </>
          )}
        </>
      )}

      {/* Vista genérica para otros tipos */}
      {!loading && tipo !== 'facturas' && (
        <>
          {rows.length === 0 && emptyState}
          {rows.length > 0 && (
            <div className="doc-list">
              {rows.map(row => renderGenericRow(row))}
            </div>
          )}
        </>
      )}

      {/* Backdrop para cerrar el dropdown al hacer clic fuera */}
      {dropdownOpenId && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 29 }}
          onClick={() => setDropdownOpenId(null)}
        />
      )}

      {/* Modal de confirmación de emisión */}
      {emitirConfirmId && (
        <div className="overlay overlay-dark overlay-z60">
          <div className="admin-modal-box admin-modal-sm" role="dialog" aria-modal="true" aria-label="Emitir factura">
            <div className="admin-modal-header">
              <div
                className="icon-box icon-box-md"
                style={{ background: 'var(--color-primary-highlight)', color: 'var(--color-primary)' }}
              >
                <Send size={18} />
              </div>
              <h2 className="admin-modal-title">Emitir factura</h2>
              <button onClick={() => setEmitirConfirmId(null)} className="modal-close-btn" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Se asignará un <strong style={{ color: 'var(--color-text)' }}>número de factura definitivo</strong> y el documento
                quedará registrado como emitido. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setEmitirConfirmId(null)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onEmitir?.(emitirConfirmId)
                  setEmitirConfirmId(null)
                }}
              >
                <Send size={15} /> Emitir factura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de envío por correo */}
      {emailModalRow && (
        <EmailModal
          emailCliente={emailModalRow.cliente_email as string | undefined}
          nombreDocumento={emailModalRow.numero ? `Factura ${emailModalRow.numero as string}` : 'Factura'}
          onClose={() => setEmailModalRow(null)}
        />
      )}

      {/* Confirmación de borrado */}
      {deleteConfirmId && (
        <ConfirmModal
          title="Eliminar documento"
          description="¿Eliminar este documento? Esta acción no se puede deshacer."
          confirmLabel="Sí, eliminar"
          confirmVariant="danger"
          onConfirm={() => { void handleDeleteConfirm() }}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}

      {/* Alerta genérica (reemplaza alert() del sistema) */}
      {alertState && (
        <AlertModal
          title={alertState.title}
          message={alertState.msg}
          variant={alertState.variant}
          onConfirm={() => setAlertState(null)}
        />
      )}
    </div>
  )
}
