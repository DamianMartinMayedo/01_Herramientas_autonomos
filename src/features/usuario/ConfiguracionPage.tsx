import { useMemo, useState } from 'react'
import { Plus, Save, Trash2, Users } from 'lucide-react'
import { createRegularClient, deleteRegularClient, updateRegularClient } from '../../lib/regularClients'
import { useAuth } from '../../hooks/useAuth'
import type { RegularClient, RegularClientInput } from '../../types/regularClient.types'

interface ConfiguracionPageProps {
  clientes: RegularClient[]
  onClientsChange: (clients: RegularClient[]) => void
}

const EMPTY_FORM: RegularClientInput = {
  nombre: '', nif: '', direccion: '', ciudad: '', cp: '',
  provincia: '', email: '', telefono: '', pais: '', notas: '',
}

export function ConfiguracionPage({ clientes, onClientsChange }: ConfiguracionPageProps) {
  const { user } = useAuth()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form,      setForm]      = useState<RegularClientInput>(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const sortedClients = useMemo(
    () => [...clientes].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [clientes]
  )

  const resetForm = () => { setEditingId(null); setForm(EMPTY_FORM); setError(null) }

  const handleChange = (field: keyof RegularClientInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleEdit = (client: RegularClient) => {
    setEditingId(client.id)
    setForm({
      nombre: client.nombre, nif: client.nif, direccion: client.direccion,
      ciudad: client.ciudad, cp: client.cp, provincia: client.provincia,
      email: client.email ?? '', telefono: client.telefono ?? '',
      pais: client.pais ?? '', notas: client.notas ?? '',
    })
    setError(null)
  }

  const handleSubmit = async () => {
    if (!user) return
    if (!form.nombre.trim()) { setError('El nombre del cliente es obligatorio.'); return }
    if (!form.nif.trim()) { setError('El NIF/CIF/NIE del cliente es obligatorio.'); return }
    if (!form.direccion.trim()) { setError('La dirección del cliente es obligatoria.'); return }

    setSaving(true); setError(null)

    const payload: RegularClientInput = {
      ...form,
      nombre: form.nombre.trim(), nif: form.nif.trim(), direccion: form.direccion.trim(),
      ciudad: form.ciudad.trim(), cp: form.cp.trim(), provincia: form.provincia.trim(),
      email: form.email?.trim(), telefono: form.telefono?.trim(),
      pais: form.pais?.trim(), notas: form.notas?.trim(),
    }

    const result = editingId
      ? await updateRegularClient(editingId, payload)
      : await createRegularClient(user.id, payload)

    if (result.error || !result.data) {
      setError(result.error?.message ?? 'No se pudo guardar el cliente.')
      setSaving(false)
      return
    }

    if (editingId) {
      onClientsChange(clientes.map((c) => (c.id === editingId ? result.data! : c)))
    } else {
      onClientsChange([...clientes, result.data])
    }

    setSaving(false); resetForm()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cliente frecuente?')) return
    const result = await deleteRegularClient(id)
    if (result.error) { setError(result.error.message); return }
    onClientsChange(clientes.filter((c) => c.id !== id))
    if (editingId === id) resetForm()
  }

  return (
    <div className="section-stack" style={{ maxWidth: 980, margin: '0 auto' }}>

      <div>
        <h1 className="section-title">Cliente</h1>
        <p className="section-sub">Guarda clientes frecuentes para reutilizarlos al crear documentos.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>

        {/* Formulario */}
        <section className="fieldset-v3">
          <div className="fieldset-v3-body" style={{ marginTop: 'var(--space-4)' }}>
            <div className="form-row">
              <div className="input-group">
                <label className="input-label">Nombre / Razón social *</label>
                <input className="input-v3" value={form.nombre} onChange={(e) => handleChange('nombre', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">NIF / CIF / NIE *</label>
                <input className="input-v3" value={form.nif} onChange={(e) => handleChange('nif', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="input-group">
                <label className="input-label">Email</label>
                <input className="input-v3" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Teléfono</label>
                <input className="input-v3" value={form.telefono} onChange={(e) => handleChange('telefono', e.target.value)} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Dirección *</label>
              <input className="input-v3" value={form.direccion} onChange={(e) => handleChange('direccion', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="input-group">
                <label className="input-label">Código postal</label>
                <input className="input-v3" value={form.cp} onChange={(e) => handleChange('cp', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Ciudad</label>
                <input className="input-v3" value={form.ciudad} onChange={(e) => handleChange('ciudad', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="input-group">
                <label className="input-label">Provincia</label>
                <input className="input-v3" value={form.provincia} onChange={(e) => handleChange('provincia', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">País</label>
                <input className="input-v3" value={form.pais} onChange={(e) => handleChange('pais', e.target.value)} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Notas</label>
              <textarea className="textarea-v3" rows={3} value={form.notas} onChange={(e) => handleChange('notas', e.target.value)} />
            </div>
            {error && <p className="input-error-msg">{error}</p>}
            <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancelar</button>
              )}
              <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                <Save size={14} />
                {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Guardar cliente'}
              </button>
            </div>
          </div>
        </section>

        {/* Lista de clientes guardados */}
        <section className="fieldset-v3" style={{ padding: 'var(--space-5)' }}>
          <div className="flex items-center" style={{ justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)' }}>
                Clientes frecuentes
              </h2>
              <p className="section-sub">
                {sortedClients.length} cliente{sortedClients.length === 1 ? '' : 's'} guardado{sortedClients.length === 1 ? '' : 's'}
              </p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={resetForm}>
              <Plus size={14} /> Nuevo
            </button>
          </div>

          {sortedClients.length === 0 ? (
            <div className="empty-state">
              <Users size={24} style={{ margin: '0 auto var(--space-3)' }} />
              <p>Aún no has guardado clientes frecuentes.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sortedClients.map((client) => (
                <div key={client.id} style={{
                  background: 'var(--color-surface-2)',
                  border: '1.5px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)',
                }}>
                  <div>
                    <p style={{ fontWeight: 700, color: 'var(--color-text)' }}>{client.nombre}</p>
                    <p className="section-sub">
                      {[client.nif, client.email, client.ciudad].filter(Boolean).join(' · ') || 'Sin datos adicionales'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleEdit(client)}>Editar</button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleDelete(client.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
