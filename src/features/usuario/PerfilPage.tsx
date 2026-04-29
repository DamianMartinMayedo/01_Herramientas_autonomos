import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { getEmpresa, saveEmpresa } from '../../lib/empresa'
import { ConfiguracionPage } from './ConfiguracionPage'
import type { Empresa } from '../../types/empresa.types'
import type { RegularClient } from '../../types/regularClient.types'

interface Props {
  userId: string
  clientes: RegularClient[]
  onClientsChange: (clients: RegularClient[]) => void
}

type Tab = 'empresa' | 'clientes'

const EMPTY_EMPRESA: Empresa = {
  nombre: '', nif: '', email: '', direccion: '',
  cp: '', ciudad: '', provincia: '', telefono: '',
}

const EMPTY_ERRORS = { nombre: '', nif: '', email: '', direccion: '' }

export function PerfilPage({ userId, clientes, onClientsChange }: Props) {
  const [tab, setTab] = useState<Tab>('empresa')

  const [form, setForm] = useState<Empresa>(EMPTY_EMPRESA)
  const [errors, setErrors] = useState(EMPTY_ERRORS)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    getEmpresa(userId).then(({ data }) => {
      if (data) setForm({ ...EMPTY_EMPRESA, ...data })
    })
  }, [userId])

  const handleChange = (field: keyof Empresa) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    if (field in EMPTY_ERRORS && errors[field as keyof typeof EMPTY_ERRORS]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const handleSave = async () => {
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

    setSavedOk(true)
    setTimeout(() => setSavedOk(false), 3000)
  }

  return (
    <div className="perfil-page">

      <div className="perfil-page-header">
        <h1 className="perfil-page-title">Perfil</h1>
        <div className="perfil-page-tabs">
          <button
            className={`filter-pill${tab === 'empresa' ? ' active' : ''}`}
            onClick={() => setTab('empresa')}
          >
            Mi empresa
          </button>
          <button
            className={`filter-pill${tab === 'clientes' ? ' active' : ''}`}
            onClick={() => setTab('clientes')}
          >
            Clientes habituales
          </button>
        </div>
      </div>

      {tab === 'empresa' && (
        <div className="card">

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
                  Teléfono <span className="input-label-optional">(opcional)</span>
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

          <div className="perfil-card-footer">
            {serverError && <p className="input-error-msg">{serverError}</p>}
            {savedOk && <p className="perfil-saved-ok">Datos guardados correctamente.</p>}
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { void handleSave() }}
              disabled={saving}
            >
              <Save size={14} />
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>

        </div>
      )}

      {tab === 'clientes' && (
        <ConfiguracionPage clientes={clientes} onClientsChange={onClientsChange} />
      )}

    </div>
  )
}
