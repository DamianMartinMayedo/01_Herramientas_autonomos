/**
 * UsuarioDetail.tsx
 * Vista detalle de un usuario: KPIs + tabla de facturas con cambio de estado.
 */
import { useEffect, useState } from 'react'
import { supabase } from '../../../../lib/supabaseClient'
import {
  ArrowLeft, Calendar, FileText, ShieldCheck, Clock,
  Trash2, Eye,
} from 'lucide-react'
import { FACTURA_STATUS_LABELS, isFacturaStatus, type FacturaStatus } from '../../../../types/facturaStatus'
import { ConfirmModal } from '../../components/ConfirmModal'
import { FacturaJsonModal } from './FacturaJsonModal'
import { deleteTexts } from '../../utils/modalTexts'
import type { Factura, UserProfile } from './types'

interface Props {
  user: UserProfile
  onBack: () => void
}

export function UsuarioDetail({ user, onBack }: Props) {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading]   = useState(true)
  const [selectedJson, setSelectedJson] = useState<Factura | null>(null)
  const [toDelete, setToDelete] = useState<Factura | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void supabase.from('facturas')
      .select('*')
      .eq('user_id', user.id)
      .order('fecha', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error('Error fetching facturas:', error)
        setFacturas(data ?? [])
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [user.id])

  const cobradas = facturas.filter(f => f.estado === 'cobrada')
  const ingresosCobrados = cobradas.reduce((a, f) => a + Number(f.total ?? 0), 0)
  const pendienteCobro   = facturas.filter(f => f.estado === 'emitida').reduce((a, f) => a + Number(f.total ?? 0), 0)

  const handleUpdateEstado = async (id: string, estado: FacturaStatus) => {
    const { error } = await supabase.from('facturas').update({ estado }).eq('id', id)
    if (error) { alert('Error al actualizar estado de la factura'); return }
    setFacturas(prev => prev.map(f => (f.id === id ? { ...f, estado } : f)))
  }

  const handleDelete = async () => {
    if (!toDelete) return
    const { error } = await supabase.from('facturas').delete().eq('id', toDelete.id)
    if (error) { alert('Error al borrar la factura'); setToDelete(null); return }
    setFacturas(prev => prev.filter(f => f.id !== toDelete.id))
    setToDelete(null)
  }

  const kpis = [
    { Icon: Calendar,    color: 'primary' as const, label: 'Registro',           value: new Date(user.created_at).toLocaleDateString(), sub: null,                                            badge: null },
    { Icon: ShieldCheck, color: 'success' as const, label: 'Estado Plan',        value: null,                                            sub: null,                                            badge: { text: user.plan || 'Free', cls: user.plan === 'premium' ? 'badge-primary' : 'badge-muted' } },
    { Icon: FileText,    color: 'copper'  as const, label: 'Facturas',           value: facturas.length,                                 sub: null,                                            badge: null },
    { Icon: Clock,       color: 'success' as const, label: 'Ingresos cobrados',  value: `${ingresosCobrados.toLocaleString()}€`,         sub: `Pendiente: ${pendienteCobro.toLocaleString()}€`, badge: null },
  ]

  return (
    <div className="section-stack">

      <div className="flex items-center gap-4">
        <button onClick={onBack} className="icon-btn" aria-label="Volver">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="section-title">Detalle de Usuario</h1>
          <p className="section-sub">{user.email}</p>
        </div>
      </div>

      <div className="card kpi-fit-grid">
        {kpis.map((item, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className={`kpi-icon-circle kpi-icon-circle--${item.color}`}>
              <item.Icon size={20} />
            </div>
            <div>
              <p className="kpi-meta-label">{item.label}</p>
              {item.badge
                ? <span className={`badge ${item.badge.cls}`}>{item.badge.text}</span>
                : <p className="kpi-meta-value">{item.value}</p>
              }
              {item.sub && <p className="kpi-meta-sub">{item.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      <div>
        <p className="section-block-label">Facturas emitidas</p>
        <div className="card card-no-pad">
          <table className="data-table">
            <thead>
              <tr className="data-thead-row">
                <th className="data-th">Número</th>
                <th className="data-th">Cliente</th>
                <th className="data-th">Fecha</th>
                <th className="data-th">Importe</th>
                <th className="data-th">Estado</th>
                <th className="data-th-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="data-td data-td--center">Cargando facturas...</td></tr>
              ) : facturas.length === 0 ? (
                <tr><td colSpan={6} className="data-td data-td--center data-td--faint">No hay facturas registradas para este usuario</td></tr>
              ) : (
                facturas.map(f => (
                  <tr key={f.id} className="data-tr">
                    <td className="data-td data-td--bold">{f.numero || 'S/N'}</td>
                    <td className="data-td">{f.cliente_nombre}</td>
                    <td className="data-td">{new Date(f.fecha).toLocaleDateString()}</td>
                    <td className="data-td data-td--bold">{f.total.toLocaleString()}€</td>
                    <td className="data-td">
                      <span className={`badge ${
                        f.estado === 'cobrada' ? 'badge-success' :
                        f.estado === 'borrador' ? 'badge-muted' : 'badge-primary'
                      }`}>
                        {isFacturaStatus(f.estado) ? FACTURA_STATUS_LABELS[f.estado] : f.estado}
                      </span>
                    </td>
                    <td className="data-td-right">
                      <div className="data-row-actions">
                        <select
                          className="select-v3"
                          value={isFacturaStatus(f.estado) ? f.estado : 'borrador'}
                          onChange={(e) => { void handleUpdateEstado(f.id, e.target.value as FacturaStatus) }}
                          aria-label="Estado de la factura"
                        >
                          <option value="borrador">Borrador</option>
                          <option value="emitida">Emitida</option>
                          <option value="cobrada">Cobrada</option>
                          <option value="anulada">Anulada</option>
                        </select>
                        <button onClick={() => setSelectedJson(f)} className="icon-btn icon-btn--primary" aria-label="Ver JSON">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => setToDelete(f)} className="icon-btn icon-btn--danger" aria-label="Borrar factura">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FacturaJsonModal factura={selectedJson} onClose={() => setSelectedJson(null)} />

      {toDelete && (
        <ConfirmModal
          {...deleteTexts(`Factura ${toDelete.numero || 'S/N'}`, 'Esta acción solo está permitida en desarrollo y no podrá recuperarse.')}
          onConfirm={() => { void handleDelete() }}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
