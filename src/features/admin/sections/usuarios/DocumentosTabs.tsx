/**
 * DocumentosTabs.tsx
 * Tabs por tipo de documento con tabla compacta dentro de cada uno.
 * Las facturas mantienen el select de estado inline (acción admin no
 * destructiva). Las acciones destructivas (ver JSON, eliminar) solo se
 * muestran si VITE_ADMIN_DEV_ACTIONS está activo.
 */
import { useState } from 'react'
import { Eye, Trash2 } from 'lucide-react'
import { supabase } from '../../../../lib/supabaseClient'
import { ConfirmModal } from '../../components/ConfirmModal'
import { FacturaJsonModal } from './FacturaJsonModal'
import { deleteTexts } from '../../utils/modalTexts'
import { useAdminDev } from '../../hooks/useAdminDev'
import { FACTURA_STATUS_LABELS, isFacturaStatus, type FacturaStatus } from '../../../../types/facturaStatus'
import type { DocTipo, UserDetailPayload, Factura } from './types'

interface Props {
  data: UserDetailPayload
  onChanged: () => void
}

const TABS: { id: DocTipo; label: string }[] = [
  { id: 'facturas',      label: 'Facturas' },
  { id: 'presupuestos',  label: 'Presupuestos' },
  { id: 'albaranes',     label: 'Albaranes' },
  { id: 'contratos',     label: 'Contratos' },
  { id: 'ndas',          label: 'NDAs' },
  { id: 'reclamaciones', label: 'Reclamaciones' },
]

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES')
}

function fmtEuros(n: number | undefined | null) {
  if (n == null) return '—'
  return `${Number(n).toLocaleString('es-ES', { maximumFractionDigits: 2 })}€`
}

export function DocumentosTabs({ data, onChanged }: Props) {
  const dev = useAdminDev()
  const [active, setActive] = useState<DocTipo>('facturas')
  const [selectedJson, setSelectedJson] = useState<Factura | null>(null)
  const [toDelete, setToDelete] = useState<{ tabla: DocTipo; id: string; label: string } | null>(null)

  /* ── Facturas: cambiar estado inline (no destructivo, prod-safe) ── */
  const handleUpdateFacturaEstado = async (id: string, estado: FacturaStatus) => {
    const { error } = await supabase.from('facturas').update({ estado }).eq('id', id)
    if (error) { alert('No se pudo actualizar el estado de la factura'); return }
    onChanged()
  }

  /* ── Eliminar individual (sólo dev) ── */
  const handleDelete = async () => {
    if (!toDelete) return
    const { error } = await supabase.from(toDelete.tabla).delete().eq('id', toDelete.id)
    if (error) { alert(`No se pudo borrar ${toDelete.label}`); setToDelete(null); return }
    setToDelete(null)
    onChanged()
  }

  return (
    <div>
      <div className="user-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`user-tab${active === t.id ? ' user-tab--active' : ''}`}
          >
            {t.label}
            <span className="user-tab-count">{data.counts[t.id]}</span>
          </button>
        ))}
      </div>

      {active === 'facturas' && (
        <DocTable
          cols={['Número', 'Cliente', 'Fecha', 'Importe', 'Estado']}
          rows={data.facturas.map(f => ({
            id: f.id,
            cells: [
              f.numero || 'S/N',
              f.cliente_nombre || '—',
              fmtDate(f.fecha),
              fmtEuros(f.total),
              <select
                key="estado"
                className="select-v3"
                value={isFacturaStatus(f.estado) ? f.estado : 'borrador'}
                onChange={(e) => { void handleUpdateFacturaEstado(f.id, e.target.value as FacturaStatus) }}
                onClick={(e) => e.stopPropagation()}
                aria-label="Estado factura"
              >
                <option value="borrador">Borrador</option>
                <option value="emitida">Emitida</option>
                <option value="cobrada">Cobrada</option>
                <option value="anulada">Anulada</option>
              </select>,
            ],
            estadoLabel: isFacturaStatus(f.estado) ? FACTURA_STATUS_LABELS[f.estado] : f.estado,
            onView: dev ? () => setSelectedJson(f as unknown as Factura) : undefined,
            onDelete: dev ? () => setToDelete({ tabla: 'facturas', id: f.id, label: `Factura ${f.numero || 'S/N'}` }) : undefined,
          }))}
        />
      )}

      {active === 'presupuestos' && (
        <DocTable
          cols={['Número', 'Cliente', 'Fecha', 'Importe', 'Estado']}
          rows={data.presupuestos.map(p => ({
            id: p.id,
            cells: [p.numero || 'S/N', p.cliente_nombre || '—', fmtDate(p.fecha), fmtEuros(p.total), <Badge key="e" estado={p.estado} />],
            onDelete: dev ? () => setToDelete({ tabla: 'presupuestos', id: p.id, label: `Presupuesto ${p.numero || 'S/N'}` }) : undefined,
          }))}
        />
      )}

      {active === 'albaranes' && (
        <DocTable
          cols={['Número', 'Cliente', 'Fecha', 'Estado']}
          rows={data.albaranes.map(a => ({
            id: a.id,
            cells: [a.numero || 'S/N', a.cliente_nombre || '—', fmtDate(a.fecha), <Badge key="e" estado={a.estado} />],
            onDelete: dev ? () => setToDelete({ tabla: 'albaranes', id: a.id, label: `Albarán ${a.numero || 'S/N'}` }) : undefined,
          }))}
        />
      )}

      {active === 'contratos' && (
        <DocTable
          cols={['Número', 'Título', 'Cliente', 'Fecha', 'Estado']}
          rows={data.contratos.map(c => ({
            id: c.id,
            cells: [c.numero || 'S/N', c.titulo || '—', c.cliente_nombre || '—', fmtDate(c.fecha), <Badge key="e" estado={c.estado} />],
            onDelete: dev ? () => setToDelete({ tabla: 'contratos', id: c.id, label: `Contrato ${c.numero || 'S/N'}` }) : undefined,
          }))}
        />
      )}

      {active === 'ndas' && (
        <DocTable
          cols={['Número', 'Título', 'Otra parte', 'Fecha', 'Estado']}
          rows={data.ndas.map(n => ({
            id: n.id,
            cells: [n.numero || 'S/N', n.titulo || '—', n.otra_parte_nombre || '—', fmtDate(n.fecha), <Badge key="e" estado={n.estado} />],
            onDelete: dev ? () => setToDelete({ tabla: 'ndas', id: n.id, label: `NDA ${n.numero || 'S/N'}` }) : undefined,
          }))}
        />
      )}

      {active === 'reclamaciones' && (
        <DocTable
          cols={['Número', 'Título', 'Fecha', 'Estado']}
          rows={data.reclamaciones.map(r => ({
            id: r.id,
            cells: [r.numero || 'S/N', r.titulo || '—', fmtDate(r.fecha), <Badge key="e" estado={r.estado} />],
            onDelete: dev ? () => setToDelete({ tabla: 'reclamaciones', id: r.id, label: `Reclamación ${r.numero || 'S/N'}` }) : undefined,
          }))}
        />
      )}

      <FacturaJsonModal factura={selectedJson} onClose={() => setSelectedJson(null)} />

      {toDelete && (
        <ConfirmModal
          {...deleteTexts(toDelete.label, 'Esta acción sólo está permitida en desarrollo y no podrá recuperarse.')}
          onConfirm={() => { void handleDelete() }}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}

/* ── Sub-componentes ─────────────────────────────────────── */

function Badge({ estado }: { estado: string }) {
  const map: Record<string, string> = {
    cobrada:    'badge-success',
    emitida:    'badge-primary',
    borrador:   'badge-muted',
    enviado:    'badge-primary',
    aprobado:   'badge-success',
    finalizado: 'badge-success',
    convertido: 'badge-success',
    anulada:    'badge-muted',
  }
  return <span className={`badge ${map[estado] ?? 'badge-muted'}`}>{estado}</span>
}

interface DocRow {
  id: string
  cells: React.ReactNode[]
  estadoLabel?: string
  onView?: () => void
  onDelete?: () => void
}

function DocTable({ cols, rows }: { cols: string[]; rows: DocRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state-text">Sin documentos en esta categoría.</p>
      </div>
    )
  }
  return (
    <div className="card card-no-pad">
      <table className="data-table data-table--responsive">
        <thead>
          <tr className="data-thead-row">
            {cols.map(c => <th key={c} className="data-th">{c}</th>)}
            <th className="data-th-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} className="data-tr">
              {row.cells.map((cell, i) => (
                <td key={i} className={`data-td${i === 0 ? ' data-td--bold' : ''}`}>{cell}</td>
              ))}
              <td className="data-td-right">
                <div className="data-row-actions">
                  {row.onView && (
                    <button onClick={row.onView} className="icon-btn icon-btn--primary" aria-label="Ver JSON">
                      <Eye size={13} />
                    </button>
                  )}
                  {row.onDelete && (
                    <button onClick={row.onDelete} className="icon-btn icon-btn--danger" aria-label="Eliminar">
                      <Trash2 size={13} />
                    </button>
                  )}
                  {!row.onView && !row.onDelete && <span className="text-faint">—</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
