import { useEffect, useState } from 'react'
import {
  ShieldCheck, ShieldOff, AlertTriangle, FileKey, RefreshCw, Loader2, Sparkles,
} from 'lucide-react'
import { getEmpresa } from '../../../lib/empresa'
import { getVerifactuConfig, disableVerifactu } from '../../../lib/verifactu'
import type { Empresa } from '../../../types/empresa.types'
import type { VerifactuConfig } from '../../../types/verifactu.types'
import { VerifactuWizard } from './VerifactuWizard'
import { ConfirmModal } from '../../admin/components/ConfirmModal'

interface Props {
  userId: string
  onGoToEmpresa: () => void
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

export function VerifactuTab({ userId, onGoToEmpresa }: Props) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [config, setConfig] = useState<VerifactuConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false)
  const [disabling, setDisabling] = useState(false)

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

  const handleDisable = async () => {
    setDisabling(true)
    await disableVerifactu()
    setDisabling(false)
    setConfirmDisableOpen(false)
    await reload()
  }

  if (loading) {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <Loader2 size={16} className="spin" />
        <span>Cargando configuración…</span>
      </div>
    )
  }

  const isConfigured = Boolean(config?.enabled && config?.cert_storage_path)

  return (
    <div className="verifactu-tab">

      {!isConfigured && (
        <div className="card card-raised">
          <div className="verifactu-empty">
            <div className="verifactu-empty-icon">
              <ShieldCheck size={28} />
            </div>
            <h2 className="verifactu-empty-title">VeriFactu no está activado</h2>
            <p className="verifactu-empty-body">
              VeriFactu es el sistema de la AEAT para registrar facturas electrónicamente.
              Aún <strong>no es obligatorio</strong>, pero configurarlo ahora deja todo listo
              para cuando lo sea — y añade un QR de verificación a cada factura que emitas.
            </p>
            <ul className="verifactu-feature-list">
              <li><Sparkles size={14} /> Generamos el XML y QR de cada factura automáticamente.</li>
              <li><Sparkles size={14} /> Tus facturas anteriores no se tocan: la cadena empieza desde la activación.</li>
              <li><Sparkles size={14} /> Puedes desactivarlo en cualquier momento; los registros se conservan.</li>
            </ul>
            <button className="btn btn-primary" onClick={() => setWizardOpen(true)}>
              <FileKey size={14} /> Configurar VeriFactu
            </button>
          </div>
        </div>
      )}

      {isConfigured && config && (
        <div className="card card-raised">
          <div className="verifactu-config-header">
            <div className="verifactu-config-status">
              <span className="badge badge-success">
                <ShieldCheck size={12} /> Activado
              </span>
              <span className="verifactu-config-mode">
                {config.modo === 'no_verificable' ? 'Modo: No verificable' : 'Modo: VeriFactu (tiempo real)'}
                {' · '}
                {config.entorno === 'test' ? 'Entorno: Pruebas' : 'Entorno: Producción'}
              </span>
            </div>
          </div>

          <div className="verifactu-data-summary">
            <SummaryRow label="NIF titular" value={config.nif_titular} mismatch={
              empresa?.nif && config.nif_titular && empresa.nif.trim().toUpperCase() !== config.nif_titular.trim().toUpperCase()
                ? 'El NIF actual de tu empresa no coincide con el del certificado. Reemplaza el certificado.'
                : undefined
            } />
            <SummaryRow label="Emisor" value={config.cert_issuer} />
            <SummaryRow label="Nº de serie" value={config.cert_serial} />
            <SummaryRow
              label="Caducidad"
              value={config.cert_expires_at ? new Date(config.cert_expires_at).toLocaleDateString('es-ES') : null}
              expiresIn={config.cert_expires_at ? daysUntil(config.cert_expires_at) : null}
            />
          </div>

          <div className="verifactu-config-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => setWizardOpen(true)}>
              <RefreshCw size={14} /> Reemplazar certificado
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setConfirmDisableOpen(true)}
            >
              <ShieldOff size={14} /> Desactivar VeriFactu
            </button>
          </div>
        </div>
      )}

      {wizardOpen && (
        <VerifactuWizard
          empresa={empresa}
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
            disabling
              ? 'Desactivando…'
              : 'Las facturas que emitas a partir de ahora no llevarán registro VeriFactu. Los registros anteriores se conservan (obligación legal). Puedes reactivar más adelante.'
          }
          confirmLabel="Desactivar"
          confirmVariant="danger"
          onConfirm={() => { void handleDisable() }}
          onCancel={() => setConfirmDisableOpen(false)}
        />
      )}

    </div>
  )
}

function daysUntil(iso: string): number {
  return Math.floor((new Date(iso).getTime() - Date.now()) / MS_PER_DAY)
}

function SummaryRow({
  label, value, mismatch, expiresIn,
}: {
  label: string
  value?: string | null
  mismatch?: string
  expiresIn?: number | null
}) {
  const expiresSoon = typeof expiresIn === 'number' && expiresIn < 30 && expiresIn > 0
  const expired = typeof expiresIn === 'number' && expiresIn <= 0
  return (
    <div className="verifactu-summary-row">
      <span className="verifactu-summary-label">{label}</span>
      <span className="verifactu-summary-value">
        {value?.trim() || '—'}
        {expiresSoon && (
          <span className="badge badge-gold" style={{ marginLeft: 'var(--space-2)' }}>
            Caduca en {expiresIn} días
          </span>
        )}
        {expired && (
          <span className="badge badge-error" style={{ marginLeft: 'var(--space-2)' }}>
            <AlertTriangle size={11} /> Caducado
          </span>
        )}
      </span>
      {mismatch && (
        <span className="verifactu-summary-hint verifactu-summary-hint--error">
          <AlertTriangle size={12} /> {mismatch}
        </span>
      )}
    </div>
  )
}
