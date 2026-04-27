import { useMemo, useState } from 'react'
import { Save, Trash2, Users } from 'lucide-react'
import { createRegularClient, deleteRegularClient, updateRegularClient } from '../../lib/regularClients'
import { useAuth } from '../../hooks/useAuth'
import { AlertModal } from '../../components/shared/AlertModal'
import type { RegularClient, RegularClientInput } from '../../types/regularClient.types'

interface ConfiguracionPageProps {
  clientes: RegularClient[]
  onClientsChange: (clients: RegularClient[]) => void
}

const EMPTY_FORM: RegularClientInput = {
  nombre: '', nif: '', direccion: '', ciudad: '', cp: '',
  provincia: '', email: '', telefono: '', pais: '', notas: '',
}

const EMPTY_FIELD_ERRORS = { nombre: '', nif: '', direccion: '' }

export function ConfiguracionPage({ clientes, onClientsChange }: ConfiguracionPageProps) {
  const { user } = useAuth()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form,      setForm]      = useState<RegularClientInput>(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)
  const [fieldErrors, setFieldErrors] = useState(EMPTY_FIELD_ERRORS)
  const [serverError, setServerError] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const sortedClients = useMemo(
    () => [...clientes].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [clientes]
  )

  const resetForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFieldErrors(EMPTY_FIELD_ERRORS)
    setServerError(null)
  }

  const handleChange = (field: keyof RegularClientInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (field in EMPTY_FIELD_ERRORS && fieldErrors[field as keyof typeof EMPTY_FIELD_ERRORS]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleEdit = (client: RegularClient) => {
    setEditingId(client.id)
    setForm({
      nombre: client.nombre, nif: client.nif, direccion: client.direccion,
      ciudad: client.ciudad, cp: client.cp, provincia: client.provincia,
      email: client.email ?? '', telefono: client.telefono ?? '',
      pais: client.pais ?? '', notas: client.notas ?? '',
    })
    setFieldErrors(EMPTY_FIELD_ERRORS)
    setServerError(null)
  }

  const handleSubmit = async () => {
    if (!user) return

    const errors = {
      nombre: form.nombre.trim() ? '' : 'El nombre del cliente es obligatorio.',
      nif: form.nif.trim() ? '' : 'El NIF/CIF/NIE del cliente es obligatorio.',
      direccion: form.direccion.trim() ? '' : 'La dirección del cliente es obligatoria.',
    }

    if (errors.nombre || errors.nif || errors.direccion) {
      setFieldErrors(errors)
      return
    }

    setSaving(true)
    setServerError(null)

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
      setServerError(result.error?.message ?? 'No se pudo guardar el cliente.')
      setSaving(false)
      return
    }

    if (editingId) {
      onClientsChange(clientes.map((c) => (c.id === editingId ? result.data! : c)))
    } else {
      onClientsChange([...clientes, result.data])
    }

    setSaving(false)
    resetForm()
  }

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return
    const id = deleteConfirmId
    setDeleteConfirmId(null)
    const result = await deleteRegularClient(id)
    if (result.error) {
      setServerError(result.error.message)
      return
    }
    onClientsChange(clientes.filter((c) => c.id !== id))
    if (editingId === id) resetForm()
  }

  return (
    <>
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
                  <input
                    className={`input-v3${fieldErrors.nombre ? ' is-error' : ''}`}
                    value={form.nombre}
                    onChange={(e) => handleChange('nombre', e.target.value)}
                  />
                  {fieldErrors.nombre && <p className="input-error-msg">{fieldErrors.nombre}</p>}
                </div>
                <div className="input-group">
                  <label className="input-label">NIF / CIF / NIE *</label>
                  <input
                    className={`input-v3${fieldErrors.nif ? ' is-error' : ''}`}
                    value={form.nif}
                    onChange={(e) => handleChange('nif', e.target.value)}
                  />
                  {fieldErrors.nif && <p className="input-error-msg">{fieldErrors.nif}</p>}
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
                <input
                  className={`input-v3${fieldErrors.direccion ? ' is-error' : ''}`}
                  value={form.direccion}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                />
                {fieldErrors.direccion && <p className="input-error-msg">{fieldErrors.direccion}</p>}
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
              {serverError && <p className="input-error-msg">{serverError}</p>}
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
          <section className="card" style={{ padding: 'var(--space-5)' }}>
            <div className="flex items-center" style={{ justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)' }}>
                  Clientes frecuentes
                </h2>
                <p className="section-sub">
                  {sortedClients.length} cliente{sortedClients.length === 1 ? '' : 's'} guardado{sortedClients.length === 1 ? '' : 's'}
                </p>
              </div>
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

      {deleteConfirmId && (
        <AlertModal
          title="Eliminar cliente"
          message="¿Eliminar este cliente frecuente? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={() => { void handleDeleteConfirm() }}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </>
  )
}
