import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Users, X, Save, Globe } from 'lucide-react'
import { createRegularClient, deleteRegularClient, updateRegularClient } from '../../lib/regularClients'
import { useAuth } from '../../hooks/useAuth'
import { ConfirmModal } from '../admin/components/ConfirmModal'
import type { RegularClient, RegularClientInput } from '../../types/regularClient.types'

interface ConfiguracionPageProps {
  clientes: RegularClient[]
  onClientsChange: (clients: RegularClient[]) => void
}

const EMPTY_FORM: RegularClientInput = {
  nombre: '', nif: '', direccion: '', ciudad: '', cp: '',
  provincia: '', email: '', telefono: '', pais: '', notas: '',
  cliente_exterior: false,
}

const EMPTY_FIELD_ERRORS = { nombre: '', nif: '', direccion: '' }

export function ConfiguracionPage({ clientes, onClientsChange }: ConfiguracionPageProps) {
  const { user } = useAuth()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<RegularClientInput>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState(EMPTY_FIELD_ERRORS)
  const [serverError, setServerError] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const sortedClients = useMemo(
    () => [...clientes].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [clientes]
  )

  const openCreateModal = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFieldErrors(EMPTY_FIELD_ERRORS)
    setServerError(null)
    setModalOpen(true)
  }

  const openEditModal = (client: RegularClient) => {
    setEditingId(client.id)
    setForm({
      nombre: client.nombre, nif: client.nif, direccion: client.direccion,
      ciudad: client.ciudad, cp: client.cp, provincia: client.provincia,
      email: client.email ?? '', telefono: client.telefono ?? '',
      pais: client.pais ?? '', notas: client.notas ?? '',
      cliente_exterior: client.cliente_exterior ?? false,
    })
    setFieldErrors(EMPTY_FIELD_ERRORS)
    setServerError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFieldErrors(EMPTY_FIELD_ERRORS)
    setServerError(null)
  }

  const handleChange = (field: keyof RegularClientInput, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (field in EMPTY_FIELD_ERRORS && fieldErrors[field as keyof typeof EMPTY_FIELD_ERRORS]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async () => {
    if (!user) return

    const errors = {
      nombre:    form.nombre.trim()    ? '' : 'El nombre del cliente es obligatorio.',
      nif:       form.nif.trim()       ? '' : 'El NIF/CIF/NIE del cliente es obligatorio.',
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
    closeModal()
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return
    const id = deleteConfirmId
    setDeleteConfirmId(null)
    const result = await deleteRegularClient(id)
    if (result.error) return
    onClientsChange(clientes.filter((c) => c.id !== id))
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div className="doc-listado-header">
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)' }}>
              Clientes habituales
            </h2>
            <p className="section-sub">
              {sortedClients.length} cliente{sortedClients.length !== 1 ? 's' : ''} guardado{sortedClients.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={15} /> Añadir cliente
          </button>
        </div>

        <div className="card card-no-pad">
          {sortedClients.length === 0 ? (
            <div className="empty-state empty-state--xl">
              <div
                className="icon-box icon-box-lg mx-auto"
                style={{ background: 'var(--color-surface-offset)', marginBottom: 'var(--space-4)' }}
              >
                <Users size={24} style={{ color: 'var(--color-text-faint)' }} />
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
                Aún no tienes clientes guardados
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-5)', maxWidth: '36ch', margin: '0 auto var(--space-5)' }}>
                Guarda clientes frecuentes para reutilizarlos al crear documentos.
              </p>
              <button className="btn btn-primary" onClick={openCreateModal}>
                <Plus size={15} /> Añadir cliente
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr className="data-thead-row">
                  <th className="data-th">Nombre / Razón social</th>
                  <th className="data-th">NIF / CIF</th>
                  <th className="data-th">Email</th>
                  <th className="data-th">Ciudad</th>
                  <th className="data-th-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedClients.map((client) => (
                  <tr key={client.id} className="data-tr">
                    <td className="data-td" style={{ fontWeight: 600 }}>
                      <span>{client.nombre}</span>
                      {client.cliente_exterior && (
                        <Globe size={12} style={{ marginLeft: 6, color: 'var(--color-text-muted)', verticalAlign: 'middle' }} />
                      )}
                    </td>
                    <td className="data-td" style={{ color: 'var(--color-text-muted)' }}>{client.nif || '—'}</td>
                    <td className="data-td" style={{ color: 'var(--color-text-muted)' }}>{client.email || '—'}</td>
                    <td className="data-td" style={{ color: 'var(--color-text-muted)' }}>{client.ciudad || '—'}</td>
                    <td className="data-td-right">
                      <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          title="Editar"
                          className="icon-btn icon-btn--primary"
                          onClick={() => openEditModal(client)}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          title="Eliminar"
                          className="icon-btn icon-btn--danger"
                          onClick={() => setDeleteConfirmId(client.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal añadir / editar cliente */}
      {modalOpen && (
        <div className="overlay overlay-dark overlay-z200">
          <div className="admin-modal-box admin-modal-lg" role="dialog" aria-modal="true" aria-label={editingId ? 'Editar cliente' : 'Añadir cliente'}>
            <div className="admin-modal-header">
              <div
                className="icon-box icon-box-md"
                style={{ background: 'var(--color-primary-highlight)', color: 'var(--color-primary)' }}
              >
                <Users size={18} />
              </div>
              <h2 className="admin-modal-title">{editingId ? 'Editar cliente' : 'Añadir cliente habitual'}</h2>
              <button onClick={closeModal} className="modal-close-btn" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <label className="input-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(form.cliente_exterior)}
                    onChange={(e) => handleChange('cliente_exterior', e.target.checked)}
                  />
                  <span>Cliente fuera de España</span>
                </label>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Nombre / Razón social *</label>
                    <input
                      className={`input-v3${fieldErrors.nombre ? ' is-error' : ''}`}
                      value={form.nombre}
                      onChange={(e) => handleChange('nombre', e.target.value)}
                      placeholder="Empresa S.L."
                    />
                    {fieldErrors.nombre && <p className="input-error-msg">{fieldErrors.nombre}</p>}
                  </div>
                  <div className="input-group">
                    <label className="input-label">NIF / CIF / NIE *</label>
                    <input
                      className={`input-v3${fieldErrors.nif ? ' is-error' : ''}`}
                      value={form.nif}
                      onChange={(e) => handleChange('nif', e.target.value)}
                      placeholder="B12345678"
                    />
                    {fieldErrors.nif && <p className="input-error-msg">{fieldErrors.nif}</p>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Email</label>
                    <input className="input-v3" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="cliente@ejemplo.com" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Teléfono</label>
                    <input className="input-v3" value={form.telefono} onChange={(e) => handleChange('telefono', e.target.value)} placeholder="+34 600 000 000" />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Dirección *</label>
                  <input
                    className={`input-v3${fieldErrors.direccion ? ' is-error' : ''}`}
                    value={form.direccion}
                    onChange={(e) => handleChange('direccion', e.target.value)}
                    placeholder="Calle Mayor 1, 2ºA"
                  />
                  {fieldErrors.direccion && <p className="input-error-msg">{fieldErrors.direccion}</p>}
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Código postal</label>
                    <input className="input-v3" value={form.cp} onChange={(e) => handleChange('cp', e.target.value)} placeholder="28001" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Ciudad</label>
                    <input className="input-v3" value={form.ciudad} onChange={(e) => handleChange('ciudad', e.target.value)} placeholder="Madrid" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Provincia</label>
                    <input className="input-v3" value={form.provincia} onChange={(e) => handleChange('provincia', e.target.value)} placeholder="Madrid" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">País</label>
                    <input className="input-v3" value={form.pais} onChange={(e) => handleChange('pais', e.target.value)} placeholder="España" />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Notas <span className="input-label-optional">(opcional)</span></label>
                  <textarea className="textarea-v3" rows={2} value={form.notas} onChange={(e) => handleChange('notas', e.target.value)} />
                </div>

                {serverError && <p className="input-error-msg">{serverError}</p>}
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={closeModal} disabled={saving}>
                Cancelar
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => { void handleSubmit() }} disabled={saving}>
                <Save size={14} />
                {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Añadir cliente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <ConfirmModal
          title="Eliminar cliente"
          description="¿Eliminar este cliente habitual? Esta acción no se puede deshacer."
          confirmLabel="Sí, eliminar"
          confirmVariant="danger"
          onConfirm={() => { void handleDeleteConfirm() }}
          onCancel={() => setDeleteConfirmId(null)}
        />
      )}
    </>
  )
}
