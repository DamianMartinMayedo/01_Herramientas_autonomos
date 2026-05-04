/**
 * UsuariosFacturasSection.tsx
 * Sección de administración para gestionar usuarios y sus facturas.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import {
  Search, ChevronRight, FileText,
  Trash2, Eye, EyeOff, ArrowLeft, Calendar,
  CreditCard, ShieldCheck, Clock,
  UserPlus, X, AlertTriangle, Loader2,
} from 'lucide-react'
import { FACTURA_STATUS_LABELS, isFacturaStatus, type FacturaStatus } from '../../../types/facturaStatus'

type UserProfile = {
  id: string
  email: string
  created_at: string
  plan?: string
}

type Factura = {
  id: string
  numero: string
  fecha: string
  total: number
  estado: string
  cliente_nombre: string
  datos_json: unknown
  user_id: string
}

export function UsuariosSection() {
  const [view,           setView]           = useState<'users' | 'user_detail'>('users')
  const [selectedUser,   setSelectedUser]   = useState<UserProfile | null>(null)
  const [users,          setUsers]          = useState<UserProfile[]>([])
  const [userFacturas,   setUserFacturas]   = useState<Factura[]>([])
  const [loading,        setLoading]        = useState(true)
  const [search,         setSearch]         = useState('')
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null)

  // Crear usuario
  const [crearOpen,    setCrearOpen]    = useState(false)
  const [nuevoEmail,   setNuevoEmail]   = useState('')
  const [nuevoPass,    setNuevoPass]    = useState('')
  const [nuevoPlan,    setNuevoPlan]    = useState<'free' | 'premium'>('free')
  const [showPass,     setShowPass]     = useState(false)
  const [creando,      setCreando]      = useState(false)
  const [crearError,   setCrearError]   = useState<string | null>(null)

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
        { headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_CREATE_SECRET ?? '' } },
      )
      const result = await res.json() as { users?: UserProfile[]; error?: string }
      if (!res.ok) throw new Error(result.error ?? 'Error al cargar usuarios')
      const sorted = (result.users ?? []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setUsers(sorted)
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchUserFacturas(userId: string) {
    try {
      const { data, error } = await supabase
        .from('facturas')
        .select('*')
        .eq('user_id', userId)
        .order('fecha', { ascending: false })
      if (error) throw error
      setUserFacturas(data || [])
    } catch (err) {
      console.error('Error fetching facturas:', err)
    }
  }

  async function handleUpdateFacturaStatus(id: string, estado: FacturaStatus) {
    try {
      const { error } = await supabase.from('facturas').update({ estado }).eq('id', id)
      if (error) throw error
      setUserFacturas((prev) => prev.map((f) => (f.id === id ? { ...f, estado } : f)))
    } catch {
      alert('Error al actualizar estado de la factura')
    }
  }

  const handleSelectUser = (user: UserProfile) => {
    setSelectedUser(user)
    fetchUserFacturas(user.id)
    setView('user_detail')
  }

  const handleDeleteFactura = async (id: string) => {
    if (!confirm('¿Seguro que quieres borrar esta factura? Esta acción solo está permitida en desarrollo.')) return
    try {
      const { error } = await supabase.from('facturas').delete().eq('id', id)
      if (error) throw error
      setUserFacturas(prev => prev.filter(f => f.id !== id))
    } catch {
      alert('Error al borrar la factura')
    }
  }

  async function handleCrearUsuario() {
    if (!nuevoEmail.trim() || !nuevoPass.trim()) {
      setCrearError('El email y la contraseña son obligatorios')
      return
    }
    setCreando(true)
    setCrearError(null)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-secret': import.meta.env.VITE_ADMIN_CREATE_SECRET ?? '',
          },
          body: JSON.stringify({
            email: nuevoEmail.trim(),
            password: nuevoPass,
            plan: nuevoPlan,
          }),
        },
      )
      const result = await res.json() as { error?: string }
      if (!res.ok) throw new Error(result.error ?? 'Error al crear el usuario')

      setCrearOpen(false)
      setNuevoEmail('')
      setNuevoPass('')
      setNuevoPlan('free')
      await fetchUsers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear el usuario'
      setCrearError(msg)
    } finally {
      setCreando(false)
    }
  }

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  /* ── Vista detalle de usuario ─────────────────────────────────────────── */
  if (view === 'user_detail' && selectedUser) {
    const facturasCobradas  = userFacturas.filter(f => f.estado === 'cobrada')
    const ingresosCobrados  = facturasCobradas.reduce((acc, f) => acc + Number(f.total ?? 0), 0)
    const pendienteCobro    = userFacturas.filter(f => f.estado === 'emitida').reduce((acc, f) => acc + Number(f.total ?? 0), 0)

    return (
      <div className="section-stack">

        <div className="flex items-center gap-4">
          <button onClick={() => setView('users')} className="btn-v3-secondary" style={{ padding: 'var(--space-2)' }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="section-title">Detalle de Usuario</h1>
            <p className="section-sub">{selectedUser.email}</p>
          </div>
        </div>

        {/* KPIs del usuario */}
        <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)' }}>
          {[
            { icon: <Calendar size={20} />, color: 'var(--color-primary)',  label: 'Registro',          value: new Date(selectedUser.created_at).toLocaleDateString(), sub: null },
            { icon: <ShieldCheck size={20} />, color: 'var(--color-success)', label: 'Estado Plan',     value: null, badge: selectedUser.plan || 'Free', badgeCls: selectedUser.plan === 'premium' ? 'badge-primary' : 'badge-muted' },
            { icon: <FileText size={20} />, color: 'var(--color-copper)',   label: 'Facturas',           value: userFacturas.length, sub: null },
            { icon: <Clock size={20} />, color: 'var(--color-success)',    label: 'Ingresos cobrados',   value: `${ingresosCobrados.toLocaleString()}€`, sub: `Pendiente: ${pendienteCobro.toLocaleString()}€` },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="icon-box icon-box-circle" style={{ width: '40px', height: '40px', background: 'var(--color-surface-offset)', color: item.color }}>
                {item.icon}
              </div>
              <div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</p>
                {item.badge
                  ? <span className={`badge ${item.badgeCls}`}>{item.badge}</span>
                  : <p style={{ fontWeight: 600 }}>{item.value}</p>
                }
                {item.sub && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{item.sub}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Tabla de facturas */}
        <div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Facturas emitidas</h2>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
                {userFacturas.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-faint)' }}>
                      No hay facturas registradas para este usuario
                    </td>
                  </tr>
                ) : (
                  userFacturas.map(f => (
                    <tr key={f.id} className="data-tr">
                      <td className="data-td" style={{ fontWeight: 600 }}>{f.numero || 'S/N'}</td>
                      <td className="data-td">{f.cliente_nombre}</td>
                      <td className="data-td">{new Date(f.fecha).toLocaleDateString()}</td>
                      <td className="data-td" style={{ fontWeight: 600 }}>{f.total.toLocaleString()}€</td>
                      <td className="data-td">
                        <span className={`badge ${
                          f.estado === 'cobrada' ? 'badge-success' :
                          f.estado === 'borrador' ? 'badge-muted' : 'badge-primary'
                        }`}>
                          {isFacturaStatus(f.estado) ? FACTURA_STATUS_LABELS[f.estado] : f.estado}
                        </span>
                      </td>
                      <td className="data-td-right">
                        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                          <select
                            className="select-v3"
                            value={isFacturaStatus(f.estado) ? f.estado : 'borrador'}
                            onChange={(e) => { void handleUpdateFacturaStatus(f.id, e.target.value as FacturaStatus) }}
                            style={{ maxWidth: 120 }}
                          >
                            <option value="borrador">Borrador</option>
                            <option value="emitida">Emitida</option>
                            <option value="cobrada">Cobrada</option>
                            <option value="anulada">Anulada</option>
                          </select>
                          <button onClick={() => setSelectedFactura(f)} className="btn-v3-secondary" style={{ padding: 'var(--space-1) var(--space-2)' }}>
                            <Eye size={14} />
                          </button>
                          <button onClick={() => handleDeleteFactura(f.id)} className="btn-v3-secondary" style={{ padding: 'var(--space-1) var(--space-2)', color: 'var(--color-error)' }}>
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

        {/* Modal JSON de factura */}
        {selectedFactura && (
          <div className="overlay overlay-darker overlay-z200">
            <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
              <div className="flex items-center" style={{ justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ fontWeight: 800 }}>JSON Detalle Factura</h3>
                <button onClick={() => setSelectedFactura(null)} className="btn-v3-secondary" style={{ padding: 'var(--space-1) var(--space-2)' }}>×</button>
              </div>
              <pre style={{ background: 'var(--color-surface-offset)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', fontSize: '12px', overflow: 'auto' }}>
                {JSON.stringify(selectedFactura.datos_json, null, 2)}
              </pre>
            </div>
          </div>
        )}

      </div>
    )
  }

  /* ── Vista lista de usuarios ──────────────────────────────────────────── */
  return (
    <div className="section-stack">

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
        <div>
          <h1 className="section-title">Usuarios y Facturas</h1>
          <p className="section-sub">Gestión de usuarios registrados y auditoría de documentos fiscales.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setCrearError(null); setCrearOpen(true) }}>
          <UserPlus size={15} />
          Crear usuario
        </button>
      </div>

      {/* Buscador */}
      <div style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-faint)' }} />
        <input
          type="text"
          placeholder="Buscar por email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-v3"
          style={{ paddingLeft: '2.5rem' }}
        />
      </div>

      {/* Tabla de usuarios */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr className="data-thead-row">
              <th className="data-th">Usuario / Email</th>
              <th className="data-th">Plan</th>
              <th className="data-th">Suscripción</th>
              <th className="data-th">Registrado</th>
              <th className="data-th-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Cargando usuarios...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-faint)' }}>No se encontraron usuarios</td></tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} className="data-tr">
                  <td className="data-td">
                    <div className="flex items-center gap-3">
                      <div className="icon-box icon-box-circle" style={{ width: '32px', height: '32px', background: 'var(--color-primary-highlight)', color: 'var(--color-primary)', fontWeight: 700 }}>
                        {user.email?.[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{user.email}</span>
                    </div>
                  </td>
                  <td className="data-td">
                    <span className={`badge ${user.plan === 'premium' ? 'badge-primary' : 'badge-muted'}`}>
                      {user.plan || 'Free'}
                    </span>
                  </td>
                  <td className="data-td" style={{ color: 'var(--color-text-faint)' }}>
                    {user.plan === 'premium' ? <CreditCard size={14} /> : '—'}
                  </td>
                  <td className="data-td" style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="data-td-right">
                    <button onClick={() => handleSelectUser(user)} className="btn-v3-secondary" style={{ gap: 'var(--space-1)' }}>
                      Ver facturas <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal crear usuario */}
      {crearOpen && (
        <div className="overlay overlay-dark overlay-z200">
          <div className="admin-modal-box admin-modal-sm">

            <div className="admin-modal-header">
              <UserPlus size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <h2 className="admin-modal-title">Crear usuario</h2>
              <button onClick={() => setCrearOpen(false)} className="modal-close-btn" disabled={creando}>
                <X size={16} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="input-group">
                  <label className="input-label">Email *</label>
                  <input
                    type="email"
                    className="input-v3"
                    value={nuevoEmail}
                    onChange={e => setNuevoEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    disabled={creando}
                    autoFocus
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Contraseña *</label>
                  <div className="input-password-wrap">
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="input-v3"
                      value={nuevoPass}
                      onChange={e => setNuevoPass(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      disabled={creando}
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(p => !p)}
                      className="input-password-toggle"
                      disabled={creando}
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Plan</label>
                  <select
                    className="select-v3"
                    value={nuevoPlan}
                    onChange={e => setNuevoPlan(e.target.value as 'free' | 'premium')}
                    disabled={creando}
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>

                {crearError && (
                  <div className="error-box">
                    <AlertTriangle size={15} className="error-box-icon" />
                    <span>{crearError}</span>
                  </div>
                )}

                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', lineHeight: 1.5 }}>
                  El usuario recibirá un email de confirmación. Hasta que lo confirme, su cuenta estará pendiente.
                </p>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setCrearOpen(false)} disabled={creando}>
                Cancelar
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => { void handleCrearUsuario() }}
                disabled={creando}
              >
                {creando ? <Loader2 size={14} className="spin" /> : <UserPlus size={14} />}
                {creando ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
