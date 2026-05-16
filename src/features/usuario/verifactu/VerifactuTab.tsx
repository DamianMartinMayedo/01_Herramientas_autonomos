import { useEffect, useState } from 'react'
import {
  ShieldCheck, AlertTriangle, FileKey, Loader2, Sparkles,
} from 'lucide-react'
import { getEmpresa } from '../../../lib/empresa'
import {
  getVerifactuConfig,
  disableVerifactu,
  enableVerifactu,
  nombreTitularFromSubject,
  autoridadFromIssuer,
  formatFechaCaducidad,
} from '../../../lib/verifactu'
import type { Empresa } from '../../../types/empresa.types'
import type { VerifactuConfig } from '../../../types/verifactu.types'
import { VerifactuWizard } from './VerifactuWizard'
import { ConfirmModal } from '../../admin/components/ConfirmModal'

interface Props {
  userId: string
  onGoToEmpresa: () => void
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

type WizardOpen = false | { initialStep: 1 | 2 | 3 | 4 }

export function VerifactuTab({ userId, onGoToEmpresa }: Props) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [config, setConfig] = useState<VerifactuConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState<WizardOpen>(false)
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)

  const reload = async () => {
    setLoading(true)
    const [emp, cfg] = await Promise.all([
      getEmpresa(userId),
      getVerifactuConfig(userId),
    ])
    setEmpresa(emp.data ?? null)
    setConfig(cfg.data ?? null)
    setLoading(false)
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const handleEnable = async () => {
    setToggling(true)
    setToggleError(null)
    const res = await enableVerifactu()
    setToggling(false)
    if (!res.ok) {
      setToggleError(res.error ?? 'No se pudo activar VeriFactu')
      return
    }
    await reload()
  }

  const handleDisableConfirm = async () => {
    setToggling(true)
    setToggleError(null)
    const res = await disableVerifactu()
    setToggling(false)
    setConfirmDisableOpen(false)
    if (!res.ok) {
      setToggleError(res.error ?? 'No se pudo desactivar VeriFactu')
      return
    }
    await reload()
  }

  const handleToggleClick = () => {
    if (toggling) return
    if (config?.enabled) {
      setConfirmDisableOpen(true)
    } else {
      void handleEnable()
    }
  }

  if (loading) {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <Loader2 size={16} className="spin" />
        <span>Cargando configuración…</span>
      </div>
    )
  }

  // Estado: hay configuración guardada con certificado (independiente de enabled).
  const hasConfig = Boolean(config?.cert_storage_path)
  const isEnabled = Boolean(config?.enabled && hasConfig)

  const nifMismatch = empresa?.nif && config?.nif_titular
    && empresa.nif.trim().toUpperCase().replace(/[\s.-]/g, '') !==
       config.nif_titular.trim().toUpperCase().replace(/[\s.-]/g, '')

  return (
    <div className="verifactu-tab">

      {/* ── Estado 1: sin configurar nunca ─────────────────────────────── */}
      {!hasConfig && (
        <div className="card card-raised">
          <div className="verifactu-empty">
            <div className="verifactu-empty-icon">
              <ShieldCheck size={28} />
            </div>
            <h2 className="verifactu-empty-title">VeriFactu no está configurado</h2>
            <p className="verifactu-empty-body">
              VeriFactu es el sistema de la AEAT para registrar facturas electrónicamente.
              Aún <strong>no es obligatorio</strong>, pero configurarlo ahora deja todo listo
              para cuando lo sea — y añade un QR de verificación a cada factura que emitas.
            </p>
            <ul className="verifactu-feature-list">
              <li><Sparkles size={14} /> Generamos el justificante y el QR de cada factura automáticamente.</li>
              <li><Sparkles size={14} /> Tus facturas anteriores no se tocan: la cadena empieza desde la activación.</li>
              <li><Sparkles size={14} /> Puedes desactivarlo y reactivarlo cuando quieras sin volver a subir el certificado.</li>
            </ul>
            <button className="btn btn-primary" onClick={() => setWizardOpen({ initialStep: 1 })}>
              <FileKey size={14} /> Configurar VeriFactu
            </button>
          </div>
        </div>
      )}

      {/* ── Estado 2 y 3: configuración guardada (activada o desactivada) ── */}
      {hasConfig && config && (
        <div className="card card-raised">

          {/* Cabecera con switch maestro */}
          <div className="verifactu-active-header">
            <div className="verifactu-active-header-text">
              <h2 className="verifactu-active-title">
                {isEnabled ? 'VeriFactu está activado' : 'VeriFactu está desactivado'}
              </h2>
              <p className="verifactu-active-sub">
                {isEnabled
                  ? 'Tus facturas se registran automáticamente al emitirlas.'
                  : 'Tu configuración sigue guardada. Actívalo cuando quieras y empezará a aplicarse a tus nuevas facturas.'}
              </p>
            </div>
            <label className={`plan-switch${isEnabled ? ' is-on' : ''}${toggling ? ' is-busy' : ''}`}>
              <input
                type="checkbox"
                role="switch"
                checked={isEnabled}
                disabled={toggling}
                onChange={handleToggleClick}
                aria-label={isEnabled ? 'Desactivar VeriFactu' : 'Activar VeriFactu'}
              />
              <span className="plan-switch-track" aria-hidden="true">
                <span className="plan-switch-thumb" />
              </span>
              <span className="plan-switch-text">{isEnabled ? 'Activo' : 'Inactivo'}</span>
            </label>
          </div>

          {toggleError && (
            <div className="error-box" style={{ marginBottom: 'var(--space-3)' }}>
              <AlertTriangle size={16} className="error-box-icon" />
              <span>{toggleError}</span>
            </div>
          )}

          {nifMismatch && (
            <div className="error-box" style={{ marginBottom: 'var(--space-3)' }}>
              <AlertTriangle size={16} className="error-box-icon" />
              <span>
                El NIF del certificado ({config.nif_titular}) ya no coincide con el de tu empresa
                ({empresa?.nif}).{' '}
                <button type="button" className="verifactu-inline-link" onClick={onGoToEmpresa}>
                  Revisar empresa
                </button>{' '}
                o reemplaza el certificado.
              </span>
            </div>
          )}

          {/* Lista de datos del certificado en lenguaje claro */}
          <dl className="verifactu-info-list">
            <InfoRow label="Titular del certificado" value={nombreTitularFromSubject(config.cert_subject)} />
            <InfoRow label="NIF" value={config.nif_titular ?? '—'} />
            <InfoRow label="Autoridad emisora" value={autoridadFromIssuer(config.cert_issuer)} />
            <InfoRow
              label="Caduca el"
              value={formatFechaCaducidad(config.cert_expires_at)}
              caducidad={config.cert_expires_at ? daysUntil(config.cert_expires_at) : null}
            />
            <InfoRow
              label="Dónde se registran"
              value={config.modo === 'no_verificable'
                ? 'Solo en tu cuenta (justificante con QR)'
                : 'Conectado con la AEAT'}
            />
            <InfoRow
              label="Entorno"
              value={config.entorno === 'test' ? 'En pruebas' : 'Real'}
            />
          </dl>

          <div className="verifactu-config-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setWizardOpen({ initialStep: 2 })}
            >
              <FileKey size={14} /> Reemplazar certificado
            </button>
          </div>
        </div>
      )}

      {wizardOpen && (
        <VerifactuWizard
          empresa={empresa}
          initialStep={wizardOpen.initialStep}
          onClose={() => setWizardOpen(false)}
          onSaved={() => {
            setWizardOpen(false)
            void reload()
          }}
          onGoToEmpresa={() => {
            setWizardOpen(false)
            onGoToEmpresa()
          }}
        />
      )}

      {confirmDisableOpen && (
        <ConfirmModal
          title="Desactivar VeriFactu"
          description={
            toggling
              ? 'Desactivando…'
              : 'Las facturas que emitas a partir de ahora no llevarán registro VeriFactu. Tu configuración y certificado quedan guardados — puedes reactivar cuando quieras sin volver a subir nada.'
          }
          confirmLabel="Desactivar"
          confirmVariant="danger"
          onConfirm={() => { void handleDisableConfirm() }}
          onCancel={() => setConfirmDisableOpen(false)}
        />
      )}

    </div>
  )
}

function daysUntil(iso: string): number {
  return Math.floor((new Date(iso).getTime() - Date.now()) / MS_PER_DAY)
}

function InfoRow({
  label, value, caducidad,
}: {
  label: string
  value: string
  caducidad?: number | null
}) {
  const expiresSoon = typeof caducidad === 'number' && caducidad < 30 && caducidad > 0
  const expired = typeof caducidad === 'number' && caducidad <= 0
  return (
    <div className="verifactu-info-row">
      <dt className="verifactu-info-label">{label}</dt>
      <dd className="verifactu-info-value">
        <span>{value}</span>
        {expiresSoon && (
          <span className="badge badge-gold" style={{ marginLeft: 'var(--space-2)' }}>
            En {caducidad} días
          </span>
        )}
        {expired && (
          <span className="badge badge-error" style={{ marginLeft: 'var(--space-2)' }}>
            <AlertTriangle size={11} /> Caducado
          </span>
        )}
      </dd>
    </div>
  )
}
