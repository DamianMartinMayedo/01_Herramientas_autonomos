/**
 * UsuariosFacturasSection.tsx
 * Sección de administración para gestionar usuarios y sus facturas.
 */
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { 
  Search, ChevronRight, FileText, 
  Trash2, Eye, ArrowLeft, Calendar, 
  CreditCard, ShieldCheck, Clock
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
  datos_json: any
  user_id: string
}

export function UsuariosSection() {
  const [view, setView] = useState<'users' | 'user_detail'>('users')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [userFacturas, setUserFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setUsers(data || [])
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
      const { error } = await supabase
        .from('facturas')
        .update({ estado })
        .eq('id', id)
      if (error) throw error
      setUserFacturas((prev) => prev.map((factura) => (factura.id === id ? { ...factura, estado } : factura)))
    } catch (err) {
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
      const { error } = await supabase
        .from('facturas')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      setUserFacturas(prev => prev.filter(f => f.id !== id))
    } catch (err) {
      alert('Error al borrar la factura')
    }
  }

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (view === 'user_detail' && selectedUser) {
    const facturasCobradas = userFacturas.filter((factura) => factura.estado === 'cobrada')
    const ingresosCobrados = facturasCobradas.reduce((acc, factura) => acc + Number(factura.total ?? 0), 0)
    const pendienteCobro = userFacturas
      .filter((factura) => factura.estado === 'emitida')
      .reduce((acc, factura) => acc + Number(factura.total ?? 0), 0)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button 
            onClick={() => setView('users')}
            className="btn-v3-secondary"
            style={{ padding: 'var(--space-2)' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800 }}>
              Detalle de Usuario
            </h1>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              {selectedUser.email}
            </p>
          </div>
        </div>

        <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-surface-offset)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
              <Calendar size={20} />
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', fontWeight: 600, textTransform: 'uppercase' }}>Registro</p>
              <p style={{ fontWeight: 600 }}>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-surface-offset)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', fontWeight: 600, textTransform: 'uppercase' }}>Estado Plan</p>
              <span className={`badge ${selectedUser.plan === 'premium' ? 'badge-primary' : 'badge-muted'}`}>
                {selectedUser.plan || 'Free'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-surface-offset)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-copper)' }}>
              <FileText size={20} />
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', fontWeight: 600, textTransform: 'uppercase' }}>Facturas</p>
              <p style={{ fontWeight: 600 }}>{userFacturas.length}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-surface-offset)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-success)' }}>
              <Clock size={20} />
            </div>
            <div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', fontWeight: 600, textTransform: 'uppercase' }}>Ingresos cobrados</p>
              <p style={{ fontWeight: 600 }}>{ingresosCobrados.toLocaleString()}€</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Pendiente: {pendienteCobro.toLocaleString()}€</p>
            </div>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-4)' }}>Facturas emitidas</h2>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--color-surface-offset)', borderBottom: '1px solid var(--color-border)' }}>
                  <th style={{ padding: 'var(--space-4)' }}>Número</th>
                  <th style={{ padding: 'var(--space-4)' }}>Cliente</th>
                  <th style={{ padding: 'var(--space-4)' }}>Fecha</th>
                  <th style={{ padding: 'var(--space-4)' }}>Importe</th>
                  <th style={{ padding: 'var(--space-4)' }}>Estado</th>
                  <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Acciones</th>
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
                    <tr key={f.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-4)', fontWeight: 600 }}>{f.numero || 'S/N'}</td>
                      <td style={{ padding: 'var(--space-4)' }}>{f.cliente_nombre}</td>
                      <td style={{ padding: 'var(--space-4)' }}>{new Date(f.fecha).toLocaleDateString()}</td>
                      <td style={{ padding: 'var(--space-4)', fontWeight: 600 }}>{f.total.toLocaleString()}€</td>
                      <td style={{ padding: 'var(--space-4)' }}>
                        <span className={`badge ${
                          f.estado === 'cobrada' ? 'badge-success' : 
                          f.estado === 'borrador' ? 'badge-muted' : 'badge-primary'
                        }`}>
                          {isFacturaStatus(f.estado) ? FACTURA_STATUS_LABELS[f.estado] : f.estado}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                          <select
                            className="select-v3"
                            value={isFacturaStatus(f.estado) ? f.estado : 'borrador'}
                            onChange={(event) => {
                              void handleUpdateFacturaStatus(f.id, event.target.value as FacturaStatus)
                            }}
                            style={{ maxWidth: 120 }}
                          >
                            <option value="borrador">Borrador</option>
                            <option value="emitida">Emitida</option>
                            <option value="cobrada">Cobrada</option>
                            <option value="anulada">Anulada</option>
                          </select>
                          <button 
                            onClick={() => setSelectedFactura(f)}
                            className="btn-v3-secondary" 
                            style={{ padding: 'var(--space-1) var(--space-2)' }}
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteFactura(f.id)}
                            className="btn-v3-secondary" 
                            style={{ padding: 'var(--space-1) var(--space-2)', color: 'var(--color-error)' }}
                          >
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

        {selectedFactura && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
            <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>
          Usuarios y Facturas
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          Gestión de usuarios registrados y auditoría de documentos fiscales.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
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
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-offset)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: 'var(--space-4)' }}>Usuario / Email</th>
              <th style={{ padding: 'var(--space-4)' }}>Plan</th>
              <th style={{ padding: 'var(--space-4)' }}>Suscripción</th>
              <th style={{ padding: 'var(--space-4)' }}>Registrado</th>
              <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Cargando usuarios...</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-faint)' }}>No se encontraron usuarios</td></tr>
            ) : (
              filteredUsers.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary-highlight)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                        {user.email?.[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{user.email}</span>
                    </div>
                  </td>
                  <td style={{ padding: 'var(--space-4)' }}>
                    <span className={`badge ${user.plan === 'premium' ? 'badge-primary' : 'badge-muted'}`}>
                      {user.plan || 'Free'}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-4)', color: 'var(--color-text-faint)' }}>
                    {user.plan === 'premium' ? <CreditCard size={14} /> : '—'}
                  </td>
                  <td style={{ padding: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleSelectUser(user)}
                      className="btn-v3-secondary"
                      style={{ gap: 'var(--space-1)' }}
                    >
                      Ver facturas <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
