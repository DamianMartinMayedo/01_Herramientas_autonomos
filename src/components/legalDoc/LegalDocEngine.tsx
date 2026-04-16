/**
 * LegalDocEngine.tsx
 * Orquestador para documentos legales de texto estructurado.
 * Paralelo a DocumentEngine, pero orientado a cláusulas, firmantes y texto libre.
 * Lo usarán: ContratoPage, NdaPage, ReclamacionPage
 */
import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ChevronLeft, Save, CheckCircle2 } from 'lucide-react'
import type { LegalDoc, TipoLegalDoc } from '../../types/legalDoc.types'
import { LegalDocModal } from './LegalDocModal'
import { LegalDocPreview } from './LegalDocPreview'
import { Button } from '../ui/Button'
import { ThemeToggle } from '../ui/ThemeToggle'

// ─── Tipos del engine ─────────────────────────────────────────────────────────

export interface LegalDocEngineProps<T extends LegalDoc> {
  tipo: TipoLegalDoc
  titulo: string
  toolClass?: string
  defaultValues: T
  /** Render prop: recibe register/watch/errors y renderiza el formulario */
  renderForm: (helpers: FormHelpers<T>) => React.ReactNode
  /** Convierte los valores crudos del form en un LegalDoc tipado */
  buildDoc: (values: T) => LegalDoc
}

export interface FormHelpers<T extends LegalDoc> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: ReturnType<typeof useForm<T>>['register']
  watch: ReturnType<typeof useForm<T>>['watch']
  errors: ReturnType<typeof useForm<T>>['formState']['errors']
  setValue: ReturnType<typeof useForm<T>>['setValue']
}

// ─── Estilos compartidos ──────────────────────────────────────────────────────

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  fontWeight: 700,
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  marginBottom: 'var(--space-4)',
}

// ─── Motor ────────────────────────────────────────────────────────────────────

export function LegalDocEngine<T extends LegalDoc>({
  tipo,
  titulo,
  toolClass = '',
  defaultValues,
  renderForm,
  buildDoc,
}: LegalDocEngineProps<T>) {
  const navigate = useNavigate()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [savedFeedback, setSavedFeedback] = useState(false)

  const form = useForm<T>({ defaultValues: defaultValues as Parameters<typeof useForm<T>>[0]['defaultValues'] })
  const { register, watch, formState: { errors }, setValue, handleSubmit } = form

  // Documento en tiempo real para la preview lateral
  const rawValues = watch() as T
  const docPreview = buildDoc(rawValues)

  // Email del receptor/cliente para autorellenar el modal de correo.
  // Cada tipo de doc usa un campo diferente: cliente, parteB o deudor.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = rawValues as any
  const clienteEmail: string | undefined =
    raw?.cliente?.email ||
    raw?.parteB?.email ||
    raw?.deudor?.email ||
    undefined

  const handleExportar = handleSubmit(() => setModalAbierto(true))

  /**
   * Guarda los datos del emisor/prestador (parteA) en localStorage
   * para pre-rellenar futuros documentos — igual que en DocumentEngine.
   */
  const handleGuardarDatos = useCallback(() => {
    try {
      const values = form.getValues()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fuente = (values as any)['prestador'] ?? (values as any)['parteA'] ?? (values as any)['acreedor']
      if (fuente) {
        localStorage.setItem(`ha-legal-emisor-${tipo}`, JSON.stringify(fuente))
      }
    } catch {
      // localStorage puede estar bloqueado en algunos entornos
    }
    setSavedFeedback(true)
    setTimeout(() => setSavedFeedback(false), 2500)
  }, [form, tipo])

  const helpers: FormHelpers<T> = {
    register: register as FormHelpers<T>['register'],
    watch,
    errors,
    setValue: setValue as FormHelpers<T>['setValue'],
  }

  return (
    <div
      className={toolClass}
      style={{ minHeight: '100vh', background: 'var(--color-bg)', transition: 'background var(--transition-slow)' }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'oklch(from var(--color-surface) l c h / 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-divider)',
        padding: 'var(--space-3) var(--space-6)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)',
      }}>
        {/* Izquierda: volver + título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)',
              background: 'none', border: 'none', cursor: 'pointer',
              transition: 'color var(--transition)',
              fontFamily: 'var(--font-body)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
            aria-label="Volver al inicio"
          >
            <ChevronLeft size={15} />
            <span className="hidden sm:inline">Volver</span>
          </button>

          <span style={{ color: 'var(--color-divider)', userSelect: 'none' }}>|</span>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--text-lg)',
            fontWeight: 700,
            color: 'var(--color-text)',
          }}>
            {titulo}
          </h1>
        </div>

        {/* Derecha: feedback + guardar + exportar + tema */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          {savedFeedback && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              fontSize: 'var(--text-sm)', fontWeight: 600,
              color: 'var(--color-success)',
            }}>
              <CheckCircle2 size={15} />
              Datos guardados
            </span>
          )}
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={handleGuardarDatos}
          >
            <Save size={14} />
            Guardar mis datos
          </Button>
          <Button variant="primary" size="sm" onClick={handleExportar} type="button">
            Exportar
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {/* ── Layout dos columnas ─────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 560px), 1fr))',
        gap: 'var(--space-6)',
        padding: 'var(--space-6)',
        maxWidth: '1400px',
        margin: '0 auto',
      }}>

        {/* COLUMNA IZQUIERDA — formulario inyectado por la página */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {renderForm(helpers)}
        </div>

        {/* COLUMNA DERECHA — preview estática (solo xl+) */}
        <div className="hidden xl:flex" style={{ flexDirection: 'column', position: 'sticky', top: '72px', height: 'fit-content' }}>
          <p style={sectionLabelStyle}>Vista previa en tiempo real</p>
          <div style={{
            overflow: 'hidden',
            borderRadius: 'var(--radius-xl)',
            border: '2px solid var(--color-border)',
            background: 'white',
            display: 'flex',
            justifyContent: 'center',
          }}>
            <div style={{ zoom: 0.75 }}>
              <LegalDocPreview documento={docPreview} />
            </div>
          </div>
        </div>

      </div>

      {/* ── Modal exportar ──────────────────────────────────────────────────── */}
      {modalAbierto && (
        <LegalDocModal
          documento={docPreview}
          clienteEmail={clienteEmail}
          onClose={() => setModalAbierto(false)}
        />
      )}
    </div>
  )
}
