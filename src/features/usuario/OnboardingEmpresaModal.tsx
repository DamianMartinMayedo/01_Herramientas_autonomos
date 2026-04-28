import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { saveEmpresa } from '../../lib/empresa'
import type { Empresa } from '../../types/empresa.types'

interface Props {
  userId: string
  onComplete: (empresa: Empresa) => void
}

const EMPTY: Empresa = {
  nombre: '',
  nif: '',
  email: '',
  direccion: '',
  cp: '',
  ciudad: '',
  provincia: '',
  telefono: '',
}

const EMPTY_ERRORS = { nombre: '', nif: '', email: '', direccion: '' }

export function OnboardingEmpresaModal({ userId, onComplete }: Props) {
  const [form, setForm] = useState<Empresa>(EMPTY)
  const [errors, setErrors] = useState(EMPTY_ERRORS)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const handleChange = (field: keyof Empresa) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (field in EMPTY_ERRORS && errors[field as keyof typeof EMPTY_ERRORS]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async () => {
    const newErrors = {
      nombre:    form.nombre.trim()    ? '' : 'El nombre es obligatorio.',
      nif:       form.nif.trim()       ? '' : 'El NIF/CIF es obligatorio.',
      email:     form.email.trim()     ? '' : 'El email es obligatorio.',
      direccion: form.direccion.trim() ? '' : 'La dirección es obligatoria.',
    }

    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors)
      return
    }

    setSaving(true)
    setServerError(null)

    const { error } = await saveEmpresa(userId, {
      ...form,
      nombre:    form.nombre.trim(),
      nif:       form.nif.trim(),
      email:     form.email.trim(),
      direccion: form.direccion.trim(),
      cp:        form.cp.trim(),
      ciudad:    form.ciudad.trim(),
      provincia: form.provincia.trim(),
      telefono:  form.telefono?.trim() || undefined,
    })

    setSaving(false)

    if (error) {
      setServerError('No se pudieron guardar los datos. Inténtalo de nuevo.')
      return
    }

    onComplete({
      nombre:    form.nombre.trim(),
      nif:       form.nif.trim(),
      email:     form.email.trim(),
      direccion: form.direccion.trim(),
      cp:        form.cp.trim(),
      ciudad:    form.ciudad.trim(),
      provincia: form.provincia.trim(),
      telefono:  form.telefono?.trim() || undefined,
    })
  }

  return (
    <div className="overlay overlay-dark overlay-z200">
      <div className="admin-modal-box admin-modal-lg">

        <div className="admin-modal-header">
          <Building2 size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <h2 className="admin-modal-title">Configura tu empresa</h2>
        </div>

        <div className="admin-modal-body admin-modal-body--grid">
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Introduce los datos de tu empresa o actividad. Los usaremos para rellenar tus facturas y presupuestos automáticamente.
          </p>

          <div className="form-grid-3">

            {/* nombre (2/3) · nif (1/3) */}
            <div className="input-group form-grid-span-2">
              <label className="input-label">Nombre o razón social *</label>
              <input
                className={`input-v3${errors.nombre ? ' is-error' : ''}`}
                value={form.nombre}
                onChange={handleChange('nombre')}
                placeholder="Mi Empresa S.L."
              />
              {errors.nombre && <p className="input-error-msg">{errors.nombre}</p>}
            </div>

            <div className="input-group">
              <label className="input-label">NIF / CIF *</label>
              <input
                className={`input-v3${errors.nif ? ' is-error' : ''}`}
                value={form.nif}
                onChange={handleChange('nif')}
                placeholder="B12345678"
              />
              {errors.nif && <p className="input-error-msg">{errors.nif}</p>}
            </div>

            {/* email (2/3) · teléfono (1/3) */}
            <div className="input-group form-grid-span-2">
              <label className="input-label">Email de contacto *</label>
              <input
                className={`input-v3${errors.email ? ' is-error' : ''}`}
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="hola@miempresa.com"
              />
              {errors.email && <p className="input-error-msg">{errors.email}</p>}
            </div>

            <div className="input-group">
              <label className="input-label">
                Teléfono <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span>
              </label>
              <input
                className="input-v3"
                type="tel"
                value={form.telefono ?? ''}
                onChange={handleChange('telefono')}
                placeholder="+34 600 000 000"
              />
            </div>

            {/* dirección (full) */}
            <div className="input-group form-grid-span-3">
              <label className="input-label">Dirección *</label>
              <input
                className={`input-v3${errors.direccion ? ' is-error' : ''}`}
                value={form.direccion}
                onChange={handleChange('direccion')}
                placeholder="Calle Mayor 1, 2ºA"
              />
              {errors.direccion && <p className="input-error-msg">{errors.direccion}</p>}
            </div>

            {/* cp · ciudad · provincia */}
            <div className="input-group">
              <label className="input-label">Código postal</label>
              <input
                className="input-v3"
                value={form.cp}
                onChange={handleChange('cp')}
                placeholder="28001"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Ciudad</label>
              <input
                className="input-v3"
                value={form.ciudad}
                onChange={handleChange('ciudad')}
                placeholder="Madrid"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Provincia</label>
              <input
                className="input-v3"
                value={form.provincia}
                onChange={handleChange('provincia')}
                placeholder="Madrid"
              />
            </div>

          </div>
        </div>

        <div className="admin-modal-footer">
          {serverError && <p className="input-error-msg" style={{ flex: 1 }}>{serverError}</p>}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { void handleSubmit() }}
            disabled={saving}
          >
            {saving ? 'Guardando…' : 'Guardar y continuar →'}
          </button>
        </div>

      </div>
    </div>
  )
}
