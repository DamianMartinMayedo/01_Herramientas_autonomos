/**
 * DocumentoListado.tsx
 * Listado genérico reutilizable para todos los tipos de documento.
 * Facturas y presupuestos usan pestañas (Borradores / Emitidas|Enviados).
 */
import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabaseClient'
import {
  Plus, FileText, Trash2, ExternalLink, CheckCircle2, Undo2, Send,
  Pencil, MoreHorizontal, Eye, Download, Copy, PenLine, Mail, X,
  ArrowRight, Calculator, TrendingUp, Clock,
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
import {
  PRESUPUESTO_STATUS_LABELS,
  isPresupuestoStatus,
} from '../../types/presupuestoStatus'

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
  aprobado:   'var(--color-success)',
  firmado:    'var(--color-success)',
  finalizado: 'var(--color-success)',
  entregado:  'var(--color-success)',
  convertido: 'var(--color-teal)',
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
  onEnviarPresupuesto?: (id: string) => Promise<void> | void
  onAprobarPresupuesto?: (id: string) => void
  onConvertirAFactura?: (id: string) => void
  onNavCalc?: (section: string) => void
  flashMessage?: string | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DocRow = Record<string, any>

export function DocumentoListado({
  tipo, refreshKey = 0, onCreate, onOpen, onView, onDescargar, onEmitir, onDuplicar, onCorregir,
  onEnviarPresupuesto, onAprobarPresupuesto, onConvertirAFactura, onNavCalc,
  flashMessage,
}: Props) {
  const { user } = useAuth()
  const cfg = TABLA_CONFIG[tipo]
  const [rows, setRows] = useState<DocRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null)
  const [emitirConfirmId, setEmitirConfirmId] = useState<string | null>(null)
  const [emailPresupuestoEnviarRow, setEmailPresupuestoEnviarRow] = useState<DocRow | null>(null)
  const [convertirFacturaConfirmId, setConvertirFacturaConfirmId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [emailModalRow, setEmailModalRow] = useState<DocRow | null>(null)
  const [factFilter, setFactFilter] = useState<'todos' | 'borrador' | 'emitida' | 'cobrada' | 'anulada' | 'rectificativa'>('todos')
  const [presFilter, setPresFilter] = useState<'todos' | 'sin-enviar' | 'enviado' | 'aprobado' | 'convertido'>('todos')
  const [currentPage, setCurrentPage] = useState(1)
  const [alertState, setAlertState] = useState<{ title?: string; msg: string; variant?: 'danger' | 'warning' | 'info' } | null>(null)
  const userId = user?.id

  const PAGE_SIZE = 10

  useEffect(() => {
    setFactFilter('todos')
    setPresFilter('todos')
    setCurrentPage(1)
  }, [tipo])

  useEffect(() => { setCurrentPage(1) }, [factFilter, presFilter])

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
    const estadoLabel =
      tipo === 'facturas' && isFacturaStatus(estado)
        ? FACTURA_STATUS_LABELS[estado]
        : tipo === 'presupuestos' && isPresupuestoStatus(estado)
          ? PRESUPUESTO_STATUS_LABELS[estado]
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

  const renderRowBase = (row: DocRow, actions: React.ReactNode, extraBadge?: React.ReactNode, overrideBadge?: React.ReactNode) => {
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
            {overrideBadge ?? renderStatusBadge(row.estado ?? '')}
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

  // ── Facturas ─────────────────────────────────────────────────────────────

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

  // ── Presupuestos ──────────────────────────────────────────────────────────

  const renderPresupuestoBadges = (row: DocRow) => {
    const estado: string = row.estado ?? ''
    const fueAprobado = Boolean(row.fue_aprobado)

    if (estado === 'borrador') {
      return (
        <span style={{
          fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
          color: 'var(--color-error)',
          background: 'color-mix(in oklch, var(--color-error) 12%, var(--color-surface-2))',
          border: '1px solid color-mix(in oklch, var(--color-error) 30%, var(--color-border))',
          borderRadius: 'var(--radius-full)', padding: '1px 7px',
        }}>
          Sin enviar
        </span>
      )
    }

    return (
      <>
        {renderStatusBadge('enviado')}
        {(estado === 'aprobado' || (estado === 'convertido' && fueAprobado)) && renderStatusBadge('aprobado')}
        {estado === 'convertido' && renderStatusBadge('convertido')}
      </>
    )
  }

  const renderPresupuestoRow = (row: DocRow) => {
    const esBorrador = row.estado === 'borrador'
    const actions = esBorrador ? (
      <>
        <button type="button" title="Editar" className="icon-btn" onClick={() => onOpen?.(row.id)}>
          <Pencil size={13} />
        </button>
        <button type="button" title="Enviar presupuesto" className="icon-btn icon-btn--primary" onClick={() => setEmailPresupuestoEnviarRow(row)}>
          <Send size={13} />
        </button>
        <button type="button" title="Eliminar" className="icon-btn icon-btn--danger" onClick={() => handleDeleteRequest(row.id)} disabled={deleting === row.id}>
          <Trash2 size={13} />
        </button>
      </>
    ) : (
      <>
        {row.estado !== 'convertido' && (
          <button type="button" title="Editar" className="icon-btn" onClick={() => onOpen?.(row.id)}>
            <Pencil size={13} />
          </button>
        )}
        <div className="dropdown-wrap">
          <button
            type="button"
            title="Más opciones"
            className="icon-btn"
            onClick={(e) => { e.stopPropagation(); setDropdownOpenId(dropdownOpenId === row.id ? null : row.id) }}
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
              {row.estado === 'enviado' && (
                <button className="dropdown-item" onClick={() => { setDropdownOpenId(null); onAprobarPresupuesto?.(row.id) }}>
                  <CheckCircle2 size={13} /> Marcar como aprobado
                </button>
              )}
              {(row.estado === 'enviado' || row.estado === 'aprobado') && (
                <>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={() => { setDropdownOpenId(null); setConvertirFacturaConfirmId(row.id) }}>
                    <ArrowRight size={13} /> Convertir a factura
                  </button>
                </>
              )}
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => { setDropdownOpenId(null); setEmailModalRow(row) }}>
                <Mail size={13} /> Enviar por correo
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item dropdown-item--danger" onClick={() => { setDropdownOpenId(null); handleDeleteRequest(row.id) }}>
                <Trash2 size={13} /> Eliminar
              </button>
            </div>
          )}
        </div>
      </>
    )
    return renderRowBase(row, actions, undefined, renderPresupuestoBadges(row))
  }

  // ── Fila genérica ─────────────────────────────────────────────────────────

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

  // ── Datos derivados ───────────────────────────────────────────────────────

  const paginar = <T,>(list: T[]) => ({
    items: list.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    totalPages: Math.ceil(list.length / PAGE_SIZE),
    total: list.length,
  })

  const renderPaginacion = (totalPages: number) => {
    if (totalPages <= 1) return null
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
        <button
          className="btn btn-secondary btn-sm"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(p => p - 1)}
        >
          ← Anterior
        </button>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {currentPage} / {totalPages}
        </span>
        <button
          className="btn btn-secondary btn-sm"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(p => p + 1)}
        >
          Siguiente →
        </button>
      </div>
    )
  }

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
          <Plus size={15} /> Nuevo {cfg.labelSingular}
        </button>
      </div>

      {loading && (
        <div className="doc-list">
          {[1, 2, 3].map(i => <div key={i} className="doc-skeleton" />)}
        </div>
      )}

      {/* Vista con filtros para facturas */}
      {!loading && tipo === 'facturas' && (
        <>
          {rows.length === 0 && emptyState}

          {rows.length > 0 && (() => {
            const FACT_FILTERS: { key: typeof factFilter; label: string }[] = [
              { key: 'todos',          label: 'Todas' },
              { key: 'borrador',       label: 'Borrador' },
              { key: 'emitida',        label: 'Emitida' },
              { key: 'cobrada',        label: 'Cobrada' },
              { key: 'anulada',        label: 'Anulada' },
              { key: 'rectificativa',  label: 'Rectificativa' },
            ]
            const rowsFiltrados = factFilter === 'todos'         ? rows
              : factFilter === 'rectificativa' ? rows.filter(r => r.datos_json?.esRectificativa)
              : rows.filter(r => r.estado === factFilter)
            return (
              <>
                <div className="flex gap-2" style={{ marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
                  {FACT_FILTERS.map(({ key, label }) => {
                    const n = key === 'todos'         ? rows.length
                      : key === 'rectificativa' ? rows.filter(r => r.datos_json?.esRectificativa).length
                      : rows.filter(r => r.estado === key).length
                    if (key !== 'todos' && n === 0) return null
                    return (
                      <button
                        key={key}
                        className={`filter-pill${factFilter === key ? ' active' : ''}`}
                        onClick={() => setFactFilter(key)}
                      >
                        {label}{n > 0 && key !== 'todos' ? ` (${n})` : ''}
                      </button>
                    )
                  })}
                </div>
                {rowsFiltrados.length === 0
                  ? <p className="section-sub" style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>No hay facturas en este estado.</p>
                  : (() => {
                    const { items, totalPages } = paginar(rowsFiltrados)
                    return (
                      <>
                        <div className="doc-list">
                          {items.map(row => row.estado === 'borrador' ? renderBorradorRow(row) : renderEmitidaRow(row))}
                        </div>
                        {renderPaginacion(totalPages)}
                      </>
                    )
                  })()
                }
              </>
            )
          })()}
        </>
      )}

      {/* Vista lista única para presupuestos */}
      {!loading && tipo === 'presupuestos' && (
        <>
          {rows.length === 0 && emptyState}

          {rows.length > 0 && (() => {
            const PRES_FILTERS: { key: typeof presFilter; label: string }[] = [
              { key: 'todos',      label: 'Todos' },
              { key: 'sin-enviar', label: 'Sin enviar' },
              { key: 'enviado',    label: 'Enviado' },
              { key: 'aprobado',   label: 'Aprobado' },
              { key: 'convertido', label: 'Convertido' },
            ]
            const rowsFiltrados = presFilter === 'todos' ? rows
              : presFilter === 'sin-enviar' ? rows.filter(r => r.estado === 'borrador')
              : rows.filter(r => r.estado === presFilter)
            return (
              <>
                <div className="flex gap-2" style={{ marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
                  {PRES_FILTERS.map(({ key, label }) => (
                    <button
                      key={key}
                      className={`filter-pill${presFilter === key ? ' active' : ''}`}
                      onClick={() => setPresFilter(key)}
                    >
                      {label}
                      {key !== 'todos' && (() => {
                        const n = key === 'sin-enviar'
                          ? rows.filter(r => r.estado === 'borrador').length
                          : rows.filter(r => r.estado === key).length
                        return n > 0 ? ` (${n})` : ''
                      })()}
                    </button>
                  ))}
                </div>
                {rowsFiltrados.length === 0
                  ? <p className="section-sub" style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>No hay presupuestos en este estado.</p>
                  : (() => {
                    const { items, totalPages } = paginar(rowsFiltrados)
                    return <><div className="doc-list">{items.map(row => renderPresupuestoRow(row))}</div>{renderPaginacion(totalPages)}</>
                  })()
                }
              </>
            )
          })()}

          {/* Calculadoras útiles */}
          {onNavCalc && (
            <div style={{ marginTop: 'var(--space-8)', borderTop: '1px solid var(--color-divider)', paddingTop: 'var(--space-5)' }}>
              <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                Calculadoras útiles
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                {[
                  { label: 'Cuota autónomos', section: 'cuota-autonomos', color: 'var(--color-primary)',  Icon: Calculator },
                  { label: 'Precio / hora',   section: 'precio-hora',     color: 'var(--color-purple)',   Icon: TrendingUp },
                  { label: 'IVA / IRPF',      section: 'iva-irpf',        color: 'var(--color-teal)',     Icon: Clock },
                ].map(({ label, section, color, Icon }) => (
                  <button
                    key={section}
                    onClick={() => onNavCalc(section)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Icon size={13} style={{ color }} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Vista genérica para otros tipos */}
      {!loading && tipo !== 'facturas' && tipo !== 'presupuestos' && (
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

      {/* Modal confirmación emitir factura */}
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

      {/* EmailModal para enviar presupuesto borrador (asigna número + cambia estado) */}
      {emailPresupuestoEnviarRow && (
        <EmailModal
          emailCliente={emailPresupuestoEnviarRow.cliente_email as string | undefined}
          nombreDocumento={emailPresupuestoEnviarRow.numero
            ? `Presupuesto ${emailPresupuestoEnviarRow.numero as string}`
            : 'Presupuesto'}
          onSent={async () => {
            await onEnviarPresupuesto?.(emailPresupuestoEnviarRow.id)
          }}
          onClose={() => setEmailPresupuestoEnviarRow(null)}
        />
      )}

      {/* Modal confirmación convertir a factura */}
      {convertirFacturaConfirmId && (
        <div className="overlay overlay-dark overlay-z60">
          <div className="admin-modal-box admin-modal-sm" role="dialog" aria-modal="true" aria-label="Convertir a factura">
            <div className="admin-modal-header">
              <div
                className="icon-box icon-box-md"
                style={{ background: 'var(--color-primary-highlight)', color: 'var(--color-primary)' }}
              >
                <ArrowRight size={18} />
              </div>
              <h2 className="admin-modal-title">Convertir a factura</h2>
              <button onClick={() => setConvertirFacturaConfirmId(null)} className="modal-close-btn" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                Se creará una <strong style={{ color: 'var(--color-text)' }}>factura en borrador</strong> con los datos del presupuesto.
                El presupuesto quedará marcado como convertido.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setConvertirFacturaConfirmId(null)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onConvertirAFactura?.(convertirFacturaConfirmId)
                  setConvertirFacturaConfirmId(null)
                }}
              >
                <ArrowRight size={15} /> Convertir a factura
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de envío por correo */}
      {emailModalRow && (
        <EmailModal
          emailCliente={emailModalRow.cliente_email as string | undefined}
          nombreDocumento={
            emailModalRow.numero
              ? `${tipo === 'presupuestos' ? 'Presupuesto' : 'Factura'} ${emailModalRow.numero as string}`
              : (tipo === 'presupuestos' ? 'Presupuesto' : 'Factura')
          }
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

      {/* Alerta genérica */}
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
