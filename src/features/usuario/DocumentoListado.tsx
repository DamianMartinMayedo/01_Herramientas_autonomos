/**
 * DocumentoListado.tsx
 * Listado genérico reutilizable para todos los tipos de documento.
 * Facturas y presupuestos usan pestañas (Borradores / Emitidas|Enviados).
 */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
import { getClienteEmail, type DocRow } from '../../types/docRow.types'
import { documentRegistry, type UserDocumentTable } from '../../lib/documentRegistry'

export type TipoDocumento = UserDocumentTable

interface TablaConfig {
  label: string
  labelSingular: string
  articuloFemenino: boolean
  campoTitulo: string
  campoSecundario: string
  campoPrecio?: string
  routeCrear: string
}

const TABLA_CONFIG: Record<TipoDocumento, TablaConfig> = Object.fromEntries(
  (Object.keys(documentRegistry) as TipoDocumento[]).map((tipo) => {
    const entry = documentRegistry[tipo]
    return [tipo, {
      label: entry.label.plural,
      labelSingular: entry.label.singular,
      articuloFemenino: entry.listado.articuloFemenino,
      campoTitulo: entry.listado.campoTitulo,
      campoSecundario: entry.listado.campoSecundario,
      campoPrecio: entry.listado.campoPrecio,
      routeCrear: entry.routePath,
    }]
  }),
) as Record<TipoDocumento, TablaConfig>

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
  onMarcarPresupuestoEntregado?: (id: string) => void
  onEnviarAlbaran?: (id: string) => Promise<void> | void
  onEnviarContrato?: (id: string) => Promise<void> | void
  onEnviarNda?: (id: string) => Promise<void> | void
  onEnviarReclamacion?: (id: string) => Promise<void> | void
  onNavCalc?: (section: string) => void
  flashMessage?: string | null
}



export function DocumentoListado({
  tipo, refreshKey = 0, onCreate, onOpen, onView, onDescargar, onEmitir, onDuplicar, onCorregir,
  onEnviarPresupuesto, onAprobarPresupuesto, onConvertirAFactura,
  onMarcarPresupuestoEntregado, onEnviarAlbaran, onEnviarContrato, onEnviarNda, onEnviarReclamacion, onNavCalc,
  flashMessage,
}: Props) {
  const { user } = useAuth()
  const cfg = TABLA_CONFIG[tipo]
  const [rows, setRows] = useState<DocRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null)
  const [emitirConfirmId, setEmitirConfirmId] = useState<string | null>(null)
  const [emailPresupuestoEnviarRow, setEmailPresupuestoEnviarRow] = useState<DocRow | null>(null)
  const [emailAlbaranListadoRow, setEmailAlbaranListadoRow] = useState<DocRow | null>(null)
  const [convertirFacturaConfirmId, setConvertirFacturaConfirmId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [emailModalRow, setEmailModalRow] = useState<DocRow | null>(null)
  const [factFilter, setFactFilter] = useState<'todos' | 'borrador' | 'emitida' | 'cobrada' | 'anulada' | 'rectificativa'>('todos')
  const [presFilter, setPresFilter] = useState<'todos' | 'sin-enviar' | 'enviado' | 'aprobado' | 'convertido'>('todos')
  const [albFilter, setAlbFilter] = useState<'todos' | 'pendiente' | 'enviado'>('todos')
  const [contrFilter, setContrFilter] = useState<'todos' | 'borrador' | 'enviado' | 'firmado' | 'finalizado'>('todos')
  const [emailContratoListadoRow, setEmailContratoListadoRow] = useState<DocRow | null>(null)
  const [ndaFilter, setNdaFilter] = useState<'todos' | 'borrador' | 'enviado' | 'firmado'>('todos')
  const [emailNdaListadoRow, setEmailNdaListadoRow] = useState<DocRow | null>(null)
  const [recFilter, setRecFilter] = useState<'todos' | 'borrador' | 'enviada' | 'resuelta'>('todos')
  const [emailReclamacionListadoRow, setEmailReclamacionListadoRow] = useState<DocRow | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [alertState, setAlertState] = useState<{ title?: string; msg: string; variant?: 'danger' | 'warning' | 'info' } | null>(null)
  const userId = user?.id

  const PAGE_SIZE = 10

  useEffect(() => {
    setFactFilter('todos')
    setPresFilter('todos')
    setAlbFilter('todos')
    setContrFilter('todos')
    setNdaFilter('todos')
    setRecFilter('todos')
    setCurrentPage(1)
  }, [tipo])

  useEffect(() => { setCurrentPage(1) }, [factFilter, presFilter, albFilter, contrFilter, ndaFilter, recFilter])

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

  const closeDropdown = () => { setDropdownOpenId(null); setDropdownPos(null) }

  const openDropdownAtElement = (el: Element, id: string) => {
    if (dropdownOpenId === id) { closeDropdown(); return }
    const rect = el.getBoundingClientRect()
    setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    setDropdownOpenId(id)
  }

  const handleDropdownKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openDropdownAtElement(e.currentTarget, id)
    }
    if (e.key === 'Escape') closeDropdown()
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      openDropdownAtElement(e.currentTarget, id)
    }
  }

  const openDropdown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    openDropdownAtElement(e.currentTarget, id)
  }

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
      <span className="status-pill" style={{ '--pill-color': estadoColor } as React.CSSProperties}>
        {estadoLabel}
      </span>
    )
  }

  const renderTableHeader = () => {
    const labelTitulo  = cfg.campoTitulo === 'numero' ? 'Número' : 'Título'
    const labelCliente = cfg.campoSecundario === 'otra_parte_nombre' ? 'Otra parte'
      : cfg.campoSecundario === 'deudor_nombre' ? 'Deudor'
      : 'Cliente'
    const labelPrecio  = tipo === 'reclamaciones' ? 'Importe' : 'Total'
    return (
      <thead>
        <tr className="data-thead-row">
          <th className="data-th">{labelTitulo}</th>
          <th className="data-th">{labelCliente}</th>
          <th className="data-th">Fecha</th>
          {cfg.campoPrecio && <th className="data-th-right">{labelPrecio}</th>}
          <th className="data-th">Estado</th>
          <th className="data-th-right">Acciones</th>
        </tr>
      </thead>
    )
  }

  const renderRowBase = (row: DocRow, actions: React.ReactNode, extraBadge?: React.ReactNode, overrideBadge?: React.ReactNode) => {
    const titulo  = row[cfg.campoTitulo] || ((tipo === 'contratos' || tipo === 'ndas' || tipo === 'reclamaciones') ? row.titulo : null) || '—'
    const cliente = row[cfg.campoSecundario] ?? '—'
    const precio  = cfg.campoPrecio ? row[cfg.campoPrecio] : null
    const fecha   = row.fecha ? new Date(row.fecha).toLocaleDateString('es-ES') : ''

    return (
      <tr key={row.id} className="data-tr">
        <td className="data-td" style={{ fontWeight: 600 }}>{titulo || 'Sin número'}</td>
        <td className="data-td" style={{ color: 'var(--color-text-muted)' }}>{cliente}</td>
        <td className="data-td data-td--meta">{fecha}</td>
        {cfg.campoPrecio && (
          <td className="data-td-right data-td-right--strong">
            {precio !== null && precio !== undefined
              ? `${Number(precio).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`
              : '—'}
          </td>
        )}
        <td className="data-td">
          <div className="status-cell">
            {overrideBadge ?? renderStatusBadge(row.estado ?? '')}
            {extraBadge}
          </div>
        </td>
        <td className="data-td-right">
          <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
            {actions}
          </div>
        </td>
      </tr>
    )
  }

  const renderRectificativaBadge = () => (
    <span className="status-pill status-pill--gold">Rectificativa</span>
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
    <button type="button" title="Más opciones" aria-label="Más opciones" className="icon-btn" onClick={(e) => openDropdown(e, row.id)} onKeyDown={(e) => handleDropdownKeyDown(e, row.id)}>
      <MoreHorizontal size={13} />
    </button>
  ), row.datos_json?.esRectificativa ? renderRectificativaBadge() : undefined)

  // ── Presupuestos ──────────────────────────────────────────────────────────

  const renderPresupuestoBadges = (row: DocRow) => {
    const estado: string = row.estado ?? ''
    const fueAprobado = Boolean(row.fue_aprobado)

    if (estado === 'borrador') {
      return (
        <span className="status-pill status-pill--error">
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
    const actions = (
      <>
        {row.estado !== 'convertido' && (
          <button type="button" title="Editar" className="icon-btn" onClick={() => onOpen?.(row.id)}>
            <Pencil size={13} />
          </button>
        )}
        <button type="button" title="Más opciones" aria-label="Más opciones" className="icon-btn" onClick={(e) => openDropdown(e, row.id)} onKeyDown={(e) => handleDropdownKeyDown(e, row.id)}>
          <MoreHorizontal size={13} />
        </button>
      </>
    )
    return renderRowBase(row, actions, undefined, renderPresupuestoBadges(row))
  }

  // ── Albaranes ─────────────────────────────────────────────────────────────

  const renderAlbaranRow = (row: DocRow) => {
    const actions = (
      <>
        <button type="button" title="Editar" className="icon-btn" onClick={() => onOpen?.(row.id)}>
          <Pencil size={13} />
        </button>
        <button type="button" title="Más opciones" aria-label="Más opciones" className="icon-btn" onClick={(e) => openDropdown(e, row.id)} onKeyDown={(e) => handleDropdownKeyDown(e, row.id)}>
          <MoreHorizontal size={13} />
        </button>
      </>
    )
    return renderRowBase(row, actions)
  }

  // ── Contratos ─────────────────────────────────────────────────────────────

  const renderContratoRow = (row: DocRow) => {
    const actions = (
      <>
        <button type="button" title="Editar" className="icon-btn" onClick={() => onOpen?.(row.id)}>
          <Pencil size={13} />
        </button>
        <button type="button" title="Más opciones" aria-label="Más opciones" className="icon-btn" onClick={(e) => openDropdown(e, row.id)} onKeyDown={(e) => handleDropdownKeyDown(e, row.id)}>
          <MoreHorizontal size={13} />
        </button>
      </>
    )
    return renderRowBase(row, actions)
  }

  const renderNdaRow = (row: DocRow) => {
    const actions = (
      <>
        <button type="button" title="Editar" className="icon-btn" onClick={() => onOpen?.(row.id)}>
          <Pencil size={13} />
        </button>
        <button type="button" title="Más opciones" aria-label="Más opciones" className="icon-btn" onClick={(e) => openDropdown(e, row.id)} onKeyDown={(e) => handleDropdownKeyDown(e, row.id)}>
          <MoreHorizontal size={13} />
        </button>
      </>
    )
    return renderRowBase(row, actions)
  }

  const renderReclamacionRow = (row: DocRow) => {
    const actions = (
      <>
        <button type="button" title="Editar" className="icon-btn" onClick={() => onOpen?.(row.id)}>
          <Pencil size={13} />
        </button>
        <button type="button" title="Más opciones" aria-label="Más opciones" className="icon-btn" onClick={(e) => openDropdown(e, row.id)} onKeyDown={(e) => handleDropdownKeyDown(e, row.id)}>
          <MoreHorizontal size={13} />
        </button>
      </>
    )
    return renderRowBase(row, actions)
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
      <div className="pagination-row">
        <button
          className="btn btn-secondary btn-sm"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(p => p - 1)}
        >
          ← Anterior
        </button>
        <span className="pagination-info">
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
      <div className="icon-box icon-box-lg mx-auto empty-state-icon-surface">
        <FileText size={24} style={{ color: 'var(--color-text-faint)' }} />
      </div>
      <p className="empty-state-title--display">
        Todavía no tienes {cfg.label.toLowerCase()}
      </p>
      <p className="empty-state-text--narrow">
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
                <div className="filter-row">
                  {FACT_FILTERS.map(({ key, label }) => {
                    const n = key === 'todos'         ? rows.length
                      : key === 'rectificativa' ? rows.filter(r => r.datos_json?.esRectificativa).length
                      : rows.filter(r => r.estado === key).length
                    if (key !== 'todos' && n === 0) return null
                    return (
                      <button
                        key={key}
                        className={`filter-pill${factFilter === key ? ' active' : ''}`}
                        aria-selected={factFilter === key}
                        onClick={() => setFactFilter(key)}
                      >
                        {label}{n > 0 && key !== 'todos' ? ` (${n})` : ''}
                      </button>
                    )
                  })}
                </div>
                {rowsFiltrados.length === 0
                  ? <p className="section-sub list-empty-msg">No hay facturas en este estado.</p>
                  : (() => {
                    const { items, totalPages } = paginar(rowsFiltrados)
                    return (
                      <>
                        <div className="card card-no-pad">
                          <table className="data-table">
                            {renderTableHeader()}
                            <tbody>
                              {items.map(row => row.estado === 'borrador' ? renderBorradorRow(row) : renderEmitidaRow(row))}
                            </tbody>
                          </table>
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
                <div className="filter-row">
                  {PRES_FILTERS.map(({ key, label }) => (
                    <button
                      key={key}
                      className={`filter-pill${presFilter === key ? ' active' : ''}`}
                      aria-selected={presFilter === key}
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
                  ? <p className="section-sub list-empty-msg">No hay presupuestos en este estado.</p>
                  : (() => {
                    const { items, totalPages } = paginar(rowsFiltrados)
                    return (
                      <>
                        <div className="card card-no-pad">
                          <table className="data-table">
                            {renderTableHeader()}
                            <tbody>{items.map(row => renderPresupuestoRow(row))}</tbody>
                          </table>
                        </div>
                        {renderPaginacion(totalPages)}
                      </>
                    )
                  })()
                }
              </>
            )
          })()}

          {/* Calculadoras útiles */}
          {onNavCalc && (
            <div className="calc-shortcuts-section">
              <p className="calc-shortcuts-label">
                Calculadoras útiles
              </p>
              <div className="calc-shortcuts-row">
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

      {/* Vista con filtros para albaranes */}
      {!loading && tipo === 'albaranes' && (
        <>
          {rows.length === 0 && emptyState}
          {rows.length > 0 && (() => {
            const ALB_FILTERS: { key: typeof albFilter; label: string }[] = [
              { key: 'todos',    label: 'Todos' },
              { key: 'pendiente', label: 'Sin enviar' },
              { key: 'enviado',  label: 'Enviados' },
            ]
            const rowsFiltrados = albFilter === 'todos' ? rows : rows.filter(r => r.estado === albFilter)
            return (
              <>
                <div className="filter-row">
                  {ALB_FILTERS.map(({ key, label }) => {
                    const n = key === 'todos' ? rows.length : rows.filter(r => r.estado === key).length
                    return (
                      <button
                        key={key}
                        className={`filter-pill${albFilter === key ? ' active' : ''}`}
                        aria-selected={albFilter === key}
                        onClick={() => setAlbFilter(key)}
                      >
                        {label}{key !== 'todos' && n > 0 ? ` (${n})` : ''}
                      </button>
                    )
                  })}
                </div>
                {rowsFiltrados.length === 0
                  ? <p className="section-sub list-empty-msg">No hay albaranes en este estado.</p>
                  : (() => {
                    const { items, totalPages } = paginar(rowsFiltrados)
                    return (
                      <>
                        <div className="card card-no-pad">
                          <table className="data-table">
                            {renderTableHeader()}
                            <tbody>{items.map(row => renderAlbaranRow(row))}</tbody>
                          </table>
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

      {/* Vista con filtros para contratos */}
      {!loading && tipo === 'contratos' && (
        <>
          {rows.length === 0 && emptyState}
          {rows.length > 0 && (() => {
            const CONTR_FILTERS: { key: typeof contrFilter; label: string }[] = [
              { key: 'todos',       label: 'Todos' },
              { key: 'borrador',    label: 'Borrador' },
              { key: 'enviado',     label: 'Enviado' },
              { key: 'firmado',     label: 'Firmado' },
              { key: 'finalizado',  label: 'Finalizado' },
            ]
            const rowsFiltrados = contrFilter === 'todos' ? rows : rows.filter(r => r.estado === contrFilter)
            return (
              <>
                <div className="filter-row">
                  {CONTR_FILTERS.map(({ key, label }) => {
                    const n = key === 'todos' ? rows.length : rows.filter(r => r.estado === key).length
                    if (key !== 'todos' && n === 0) return null
                    return (
                      <button
                        key={key}
                        className={`filter-pill${contrFilter === key ? ' active' : ''}`}
                        aria-selected={contrFilter === key}
                        onClick={() => setContrFilter(key)}
                      >
                        {label}{key !== 'todos' && n > 0 ? ` (${n})` : ''}
                      </button>
                    )
                  })}
                </div>
                {rowsFiltrados.length === 0
                  ? <p className="section-sub list-empty-msg">No hay contratos en este estado.</p>
                  : (() => {
                    const { items, totalPages } = paginar(rowsFiltrados)
                    return (
                      <>
                        <div className="card card-no-pad">
                          <table className="data-table">
                            {renderTableHeader()}
                            <tbody>{items.map(row => renderContratoRow(row))}</tbody>
                          </table>
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

      {/* Vista con filtros para NDAs */}
      {!loading && tipo === 'ndas' && (
        <>
          {rows.length === 0 && emptyState}
          {rows.length > 0 && (() => {
            const NDA_FILTERS: { key: typeof ndaFilter; label: string }[] = [
              { key: 'todos',       label: 'Todos' },
              { key: 'borrador',    label: 'Borrador' },
              { key: 'enviado',     label: 'Enviado' },
              { key: 'firmado',     label: 'Firmado' },
            ]
            const rowsFiltrados = ndaFilter === 'todos' ? rows : rows.filter(r => r.estado === ndaFilter)
            return (
              <>
                <div className="filter-row">
                  {NDA_FILTERS.map(({ key, label }) => {
                    const n = key === 'todos' ? rows.length : rows.filter(r => r.estado === key).length
                    if (key !== 'todos' && n === 0) return null
                    return (
                      <button
                        key={key}
                        className={`filter-pill${ndaFilter === key ? ' active' : ''}`}
                        aria-selected={ndaFilter === key}
                        onClick={() => setNdaFilter(key)}
                      >
                        {label}{key !== 'todos' && n > 0 ? ` (${n})` : ''}
                      </button>
                    )
                  })}
                </div>
                {rowsFiltrados.length === 0
                  ? <p className="section-sub list-empty-msg">No hay NDAs en este estado.</p>
                  : (() => {
                    const { items, totalPages } = paginar(rowsFiltrados)
                    return (
                      <>
                        <div className="card card-no-pad">
                          <table className="data-table">
                            {renderTableHeader()}
                            <tbody>{items.map(row => renderNdaRow(row))}</tbody>
                          </table>
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

      {/* Vista con filtros para reclamaciones */}
      {!loading && tipo === 'reclamaciones' && (
        <>
          {rows.length === 0 && emptyState}
          {rows.length > 0 && (() => {
            const REC_FILTERS: { key: typeof recFilter; label: string }[] = [
              { key: 'todos',       label: 'Todas' },
              { key: 'borrador',    label: 'Borrador' },
              { key: 'enviada',     label: 'Enviada' },
              { key: 'resuelta',    label: 'Resuelta' },
            ]
            const rowsFiltrados = recFilter === 'todos' ? rows : rows.filter(r => r.estado === recFilter)
            return (
              <>
                <div className="filter-row">
                  {REC_FILTERS.map(({ key, label }) => {
                    const n = key === 'todos' ? rows.length : rows.filter(r => r.estado === key).length
                    if (key !== 'todos' && n === 0) return null
                    return (
                      <button
                        key={key}
                        className={`filter-pill${recFilter === key ? ' active' : ''}`}
                        aria-selected={recFilter === key}
                        onClick={() => setRecFilter(key)}
                      >
                        {label}{key !== 'todos' && n > 0 ? ` (${n})` : ''}
                      </button>
                    )
                  })}
                </div>
                {rowsFiltrados.length === 0
                  ? <p className="section-sub list-empty-msg">No hay reclamaciones en este estado.</p>
                  : (() => {
                    const { items, totalPages } = paginar(rowsFiltrados)
                    return (
                      <>
                        <div className="card card-no-pad">
                          <table className="data-table">
                            {renderTableHeader()}
                            <tbody>{items.map(row => renderReclamacionRow(row))}</tbody>
                          </table>
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

      {/* Vista genérica (sin uso actual, todos los tipos tienen vista propia) */}
      {!loading && tipo !== 'facturas' && tipo !== 'presupuestos' && tipo !== 'albaranes' && tipo !== 'contratos' && tipo !== 'ndas' && tipo !== 'reclamaciones' && (
        <>
          {rows.length === 0 && emptyState}
          {rows.length > 0 && (
            <div className="card card-no-pad">
              <table className="data-table">
                {renderTableHeader()}
                <tbody>{rows.map(row => renderGenericRow(row))}</tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Backdrop para cerrar el dropdown al hacer clic fuera */}
      {dropdownOpenId && (
        <div className="dropdown-overlay" onClick={closeDropdown} />
      )}

      {/* Portal dropdown — fuera del DOM de la tabla para evitar clipping */}
      {dropdownOpenId && dropdownPos && (() => {
        const row = rows.find(r => r.id === dropdownOpenId)
        if (!row) return null

        const menuItems = tipo === 'facturas' ? (
          <>
            <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onView?.(row.id) }}><Eye size={13} /> Ver</button>
            <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onDescargar?.(row.id) }}><Download size={13} /> Descargar</button>
            {canMarkFacturaAsCobrada(row.estado) && (
              <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); void handleFacturaStatus(row.id, 'cobrada') }}>
                <CheckCircle2 size={13} /> Marcar como cobrada
              </button>
            )}
            {canMarkFacturaAsNoCobrada(row.estado) && (
              <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); void handleFacturaStatus(row.id, 'emitida') }}>
                <Undo2 size={13} /> Marcar como no cobrada
              </button>
            )}
            {!row.datos_json?.esRectificativa && (
              <>
                <div className="dropdown-divider" />
                <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onDuplicar?.(row.id) }}><Copy size={13} /> Duplicar</button>
                <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onCorregir?.(row.id) }}><PenLine size={13} /> Corregir</button>
              </>
            )}
            <div className="dropdown-divider" />
            <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); setEmailModalRow(row) }}><Mail size={13} /> Enviar por correo</button>
          </>
        ) : tipo === 'presupuestos' ? (
          <>
            <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onView?.(row.id) }}><Eye size={13} /> Ver</button>
            <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onDescargar?.(row.id) }}><Download size={13} /> Descargar</button>
            {row.estado === 'borrador' && (
              <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onMarcarPresupuestoEntregado?.(row.id) }}>
                <CheckCircle2 size={13} /> Marcar como entregado
              </button>
            )}
            {row.estado === 'enviado' && (
              <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onAprobarPresupuesto?.(row.id) }}>
                <CheckCircle2 size={13} /> Marcar como aprobado
              </button>
            )}
            {(row.estado === 'enviado' || row.estado === 'aprobado') && (
              <>
                <div className="dropdown-divider" />
                <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); setConvertirFacturaConfirmId(row.id) }}>
                  <ArrowRight size={13} /> Convertir a factura
                </button>
              </>
            )}
            <div className="dropdown-divider" />
            {row.estado === 'borrador' ? (
              <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); setEmailPresupuestoEnviarRow(row) }}><Mail size={13} /> Enviar por correo</button>
            ) : (
              <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); setEmailModalRow(row) }}><Mail size={13} /> Enviar por correo</button>
            )}
            <div className="dropdown-divider" />
            <button role="menuitem" className="dropdown-item dropdown-item--danger" onClick={() => { closeDropdown(); handleDeleteRequest(row.id) }}>
              <Trash2 size={13} /> Eliminar
            </button>
          </>
        ) : tipo === 'albaranes' ? (
          <>
            <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onView?.(row.id) }}><Eye size={13} /> Ver</button>
            <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onDescargar?.(row.id) }}><Download size={13} /> Descargar</button>
            {row.estado !== 'enviado' && (
              <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onEnviarAlbaran?.(row.id) }}>
                <CheckCircle2 size={13} /> Marcar como entregado
              </button>
            )}
            <div className="dropdown-divider" />
            <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); setEmailAlbaranListadoRow(row) }}>
              <Mail size={13} /> {row.estado === 'enviado' ? 'Reenviar por correo' : 'Enviar por correo'}
            </button>
            <div className="dropdown-divider" />
            <button role="menuitem" className="dropdown-item dropdown-item--danger" onClick={() => { closeDropdown(); handleDeleteRequest(row.id) }}>
              <Trash2 size={13} /> Eliminar
            </button>
          </>
        ) : tipo === 'contratos' ? (
          <>
            <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onView?.(row.id) }}><Eye size={13} /> Ver</button>
            <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onOpen?.(row.id) }}><Pencil size={13} /> Editar</button>
            <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onDescargar?.(row.id) }}><Download size={13} /> Descargar</button>
            {row.estado === 'borrador' && (
              <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onEnviarContrato?.(row.id) }}>
                <CheckCircle2 size={13} /> Marcar como enviado
              </button>
            )}
            <div className="dropdown-divider" />
            <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); setEmailContratoListadoRow(row) }}>
              <Mail size={13} /> {row.estado === 'enviado' ? 'Reenviar por correo' : 'Enviar por correo'}
            </button>
            <div className="dropdown-divider" />
            <button role="menuitem" className="dropdown-item dropdown-item--danger" onClick={() => { closeDropdown(); handleDeleteRequest(row.id) }}>
              <Trash2 size={13} /> Eliminar
            </button>
          </>
        ) : tipo === 'ndas' ? (
          <>
            <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onView?.(row.id) }}><Eye size={13} /> Ver</button>
            <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onOpen?.(row.id) }}><Pencil size={13} /> Editar</button>
            <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onDescargar?.(row.id) }}><Download size={13} /> Descargar</button>
            {row.estado === 'borrador' && (
              <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onEnviarNda?.(row.id) }}>
                <CheckCircle2 size={13} /> Marcar como enviado
              </button>
            )}
            <div className="dropdown-divider" />
            <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); setEmailNdaListadoRow(row) }}>
              <Mail size={13} /> {row.estado === 'enviado' ? 'Reenviar por correo' : 'Enviar por correo'}
            </button>
            <div className="dropdown-divider" />
            <button role="menuitem" className="dropdown-item dropdown-item--danger" onClick={() => { closeDropdown(); handleDeleteRequest(row.id) }}>
              <Trash2 size={13} /> Eliminar
            </button>
          </>
        ) : tipo === 'reclamaciones' ? (
          <>
            <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onView?.(row.id) }}><Eye size={13} /> Ver</button>
            <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onOpen?.(row.id) }}><Pencil size={13} /> Editar</button>
            <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onDescargar?.(row.id) }}><Download size={13} /> Descargar</button>
            {row.estado === 'borrador' && (
              <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); onEnviarReclamacion?.(row.id) }}>
                <CheckCircle2 size={13} /> Marcar como enviada
              </button>
            )}
            {row.estado === 'enviada' && (
              <button role="menuitem" className="dropdown-item" onClick={async () => {
                closeDropdown()
                const { error } = await supabase.from('reclamaciones').update({ estado: 'resuelta' }).eq('id', row.id)
                if (!error) setRows(prev => prev.map(r => r.id === row.id ? { ...r, estado: 'resuelta' } : r))
              }}>
                <CheckCircle2 size={13} /> Marcar como resuelta
              </button>
            )}
            <div className="dropdown-divider" />
            <button role="menuitem" className="dropdown-item" onClick={() => { closeDropdown(); setEmailReclamacionListadoRow(row) }}>
              <Mail size={13} /> {row.estado === 'enviada' ? 'Reenviar por correo' : 'Enviar por correo'}
            </button>
            <div className="dropdown-divider" />
            <button role="menuitem" className="dropdown-item dropdown-item--danger" onClick={() => { closeDropdown(); handleDeleteRequest(row.id) }}>
              <Trash2 size={13} /> Eliminar
            </button>
          </>
        ) : null

        return createPortal(
          <div
            className="dropdown-menu"
            role="menu"
            aria-label="Acciones"
            style={{ position: 'fixed', top: dropdownPos.top, right: dropdownPos.right, zIndex: 500, margin: 0 }}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => {
              if (e.key === 'Escape') { closeDropdown(); return }
              const menu = e.currentTarget as HTMLElement
              const items = Array.from(menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
              if (items.length === 0) return
              const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement)
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0
                items[next]?.focus()
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1
                items[prev]?.focus()
              }
            }}
          >
            {menuItems}
          </div>,
          document.body
        )
      })()}

      {/* Modal confirmación emitir factura */}
      {emitirConfirmId && (
        <div className="overlay overlay-dark overlay-z60">
          <div className="admin-modal-box admin-modal-sm" role="dialog" aria-modal="true" aria-label="Emitir factura">
            <div className="admin-modal-header">
              <div
                className="icon-box icon-box-md icon-box--primary"
              >
                <Send size={18} />
              </div>
              <h2 className="admin-modal-title">Emitir factura</h2>
              <button onClick={() => setEmitirConfirmId(null)} className="modal-close-btn" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <div className="admin-modal-body">
              <p className="modal-info-text">
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
          emailCliente={getClienteEmail(emailPresupuestoEnviarRow)}
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
                className="icon-box icon-box-md icon-box--primary"
              >
                <ArrowRight size={18} />
              </div>
              <h2 className="admin-modal-title">Convertir a factura</h2>
              <button onClick={() => setConvertirFacturaConfirmId(null)} className="modal-close-btn" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <div className="admin-modal-body">
              <p className="modal-info-text">
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
          emailCliente={getClienteEmail(emailModalRow)}
          nombreDocumento={
            emailModalRow.numero
              ? `${tipo === 'presupuestos' ? 'Presupuesto' : 'Factura'} ${emailModalRow.numero as string}`
              : (tipo === 'presupuestos' ? 'Presupuesto' : 'Factura')
          }
          onClose={() => setEmailModalRow(null)}
        />
      )}

      {/* Email albarán desde listado — marca como entregado al enviar */}
      {emailAlbaranListadoRow && (
        <EmailModal
          emailCliente={getClienteEmail(emailAlbaranListadoRow)}
          nombreDocumento={
            emailAlbaranListadoRow.numero
              ? `Albarán ${emailAlbaranListadoRow.numero as string}`
              : 'Albarán'
          }
          onSent={async () => { await onEnviarAlbaran?.(emailAlbaranListadoRow.id) }}
          onClose={() => setEmailAlbaranListadoRow(null)}
        />
      )}

      {/* Email contrato desde listado — marca como enviado al enviar */}
      {emailContratoListadoRow && (
        <EmailModal
          emailCliente={getClienteEmail(emailContratoListadoRow)}
          nombreDocumento={
            emailContratoListadoRow.numero
              ? `Contrato ${emailContratoListadoRow.numero as string}`
              : 'Contrato'
          }
          onSent={async () => { await onEnviarContrato?.(emailContratoListadoRow.id) }}
          onClose={() => setEmailContratoListadoRow(null)}
        />
      )}

      {/* Email NDA desde listado — marca como enviado al enviar */}
      {emailNdaListadoRow && (
        <EmailModal
          emailCliente={getClienteEmail(emailNdaListadoRow)}
          nombreDocumento={
            emailNdaListadoRow.numero
              ? `NDA ${emailNdaListadoRow.numero as string}`
              : 'NDA'
          }
          onSent={async () => { await onEnviarNda?.(emailNdaListadoRow.id) }}
          onClose={() => setEmailNdaListadoRow(null)}
        />
      )}

      {/* Email reclamación desde listado — marca como enviada al enviar */}
      {emailReclamacionListadoRow && (
        <EmailModal
          emailCliente={getClienteEmail(emailReclamacionListadoRow)}
          nombreDocumento={
            emailReclamacionListadoRow.numero
              ? `Reclamación ${emailReclamacionListadoRow.numero as string}`
              : 'Reclamación'
          }
          onSent={async () => { await onEnviarReclamacion?.(emailReclamacionListadoRow.id) }}
          onClose={() => setEmailReclamacionListadoRow(null)}
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
