/**
 * HerramientasSection.tsx
 * Gestión de herramientas: activar/desactivar, editar descripción,
 * mostrar/ocultar con botón ojo + confirmación directa en fila.
 */
import { useState } from 'react'
import { useAdminStore, type Herramienta } from '../../../store/adminStore'
import { ToggleLeft, ToggleRight, Pencil, X, CheckCircle, Clock, Eye, EyeOff } from 'lucide-react'

interface EditorProps {
  herramienta: Herramienta
  onClose: () => void
}

function HerramientaEditor({ herramienta: h, onClose }: EditorProps) {
  const updateHerramienta = useAdminStore((s) => s.updateHerramienta)
  const [nombre, setNombre] = useState(h.nombre)
  const [desc,   setDesc]   = useState(h.descripcion)
  const [prox,   setProx]   = useState(h.proximamente)
  const [mant,   setMant]   = useState(h.mantenimiento || false)

  const handleProxChange = (val: boolean) => {
    setProx(val)
    if (val) setMant(false)
  }

  const handleMantChange = (val: boolean) => {
    setMant(val)
    if (val) setProx(false)
  }

  const save = () => {
    updateHerramienta(h.id, { nombre, descripcion: desc, proximamente: prox, mantenimiento: mant })
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
      <div style={{
        background: 'var(--color-bg)', border: '2px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)', boxShadow: '5px 5px 0 var(--color-border)',
        width: '100%', maxWidth: '480px', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-divider)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text)' }}>
            Editar herramienta
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="input-group">
            <label className="input-label">Nombre</label>
            <input className="input-v3" value={nombre} onChange={e => setNombre(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="input-label">Descripción</label>
            <textarea className="textarea-v3" value={desc} onChange={e => setDesc(e.target.value)} rows={3} style={{ minHeight: 'auto' }} />
          </div>
          <label className="input-toggle">
            <input type="checkbox" checked={prox} onChange={e => handleProxChange(e.target.checked)} />
            <span>Mostrar como "Próximamente"</span>
          </label>
          <label className="input-toggle">
            <input type="checkbox" checked={mant} onChange={e => handleMantChange(e.target.checked)} />
            <span>Mostrar como "Mejorando"</span>
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--color-divider)' }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={save}>Guardar</button>
        </div>
      </div>
    </div>
  )
}

export function HerramientasSection() {
  const herramientas      = useAdminStore((s) => s.herramientas)
  const toggleHerramienta = useAdminStore((s) => s.toggleHerramienta)
  const updateHerramienta = useAdminStore((s) => s.updateHerramienta)
  const [editing,     setEditing]     = useState<Herramienta | null>(null)
  const [confirmVis,  setConfirmVis]  = useState<string | null>(null)

  const byCategoria = herramientas.reduce<Record<string, Herramienta[]>>((acc, h) => {
    if (!acc[h.categoria]) acc[h.categoria] = []
    acc[h.categoria].push(h)
    return acc
  }, {})

  const labels: Record<string, string> = {
    documentos:   'Documentos',
    contratos:    'Contratos y acuerdos',
    calculadoras: 'Calculadoras',
  }

  const handleToggleVisible = (h: Herramienta) => {
    updateHerramienta(h.id, { visible: h.visible === false ? true : false })
    setConfirmVis(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>

      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>
          Herramientas
        </h1>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
          Activa o desactiva herramientas. Los cambios se reflejan en el Home instantáneamente.
        </p>
      </div>

      {/* Nota sobre sincronización */}
      <div style={{
        padding: 'var(--space-4)',
        background: 'var(--color-primary-subtle)',
        border: '1.5px solid var(--color-primary-highlight)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'var(--color-primary)' }}>Nota local→cloud:</strong> Los cambios se guardan en localStorage y se reflejan en el Home en tiempo real en este navegador. Al migrar a Supabase, esta sección leerá y escribirá en la base de datos remota haciendo los cambios globales.
      </div>

      {Object.entries(byCategoria).map(([cat, items]) => (
        <div key={cat}>
          <p style={{ fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-faint)', marginBottom: 'var(--space-4)' }}>
            {labels[cat] ?? cat}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {items.map(h => (
              <div key={h.id} style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-5)',
                background: 'var(--color-surface)',
                border: `2px solid ${h.activa ? 'var(--color-border)' : 'var(--color-divider)'}`,
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4) var(--space-5)',
                boxShadow: h.activa ? '3px 3px 0 var(--color-border)' : 'none',
                opacity: h.activa ? 1 : 0.65,
                transition: 'opacity 200ms, box-shadow 200ms',
              }}>
                {/* Status icon */}
                <div>
                  {h.activa
                    ? <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
                    : <Clock size={18} style={{ color: 'var(--color-text-faint)' }} />
                  }
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '4px' }}>
                    <span style={{ 
                      fontWeight: 600, 
                      fontSize: 'var(--text-sm)', 
                      color: h.visible === false ? 'var(--color-text-faint)' : 'var(--color-text)',
                      textDecoration: h.visible === false ? 'line-through' : 'none'
                    }}>
                      {h.nombre}
                    </span>
                    {h.visible === false && (
                      <span className="badge badge-muted" style={{ fontSize: '10px', padding: '1px 7px' }}>Oculta</span>
                    )}
                    {h.proximamente && (
                      <span className="badge badge-copper" style={{ fontSize: '10px', padding: '1px 7px' }}>Próximamente</span>
                    )}
                    {h.mantenimiento && (
                      <span className="badge badge-gold" style={{ fontSize: '10px', padding: '1px 7px' }}>Mejorando</span>
                    )}
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {h.descripcion}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-faint)', fontFamily: 'var(--font-mono)' }}>{h.ruta}</span>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-faint)' }}>{h.usosRegistrados} usos</span>
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                  {/* Botón ojo: primer clic pide confirmación, segundo ejecuta */}
                  {confirmVis === h.id ? (
                    <button
                      title={h.visible === false ? 'Confirmar: mostrar' : 'Confirmar: ocultar'}
                      onClick={() => handleToggleVisible(h)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '32px', height: '32px',
                        background: h.visible === false ? 'var(--color-success)' : 'var(--color-error)',
                        border: `2px solid ${h.visible === false ? 'var(--color-success)' : 'var(--color-error)'}`,
                        borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'white',
                      }}
                    >
                      {h.visible === false ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  ) : (
                    <button
                      title={h.visible === false ? 'Mostrar en Home' : 'Ocultar en Home'}
                      onClick={() => setConfirmVis(h.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '32px', height: '32px',
                        background: 'var(--color-surface-offset)', border: '1.5px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        color: h.visible === false ? 'var(--color-text-faint)' : 'var(--color-text-muted)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = h.visible === false ? 'var(--color-success)' : 'var(--color-error)'
                        e.currentTarget.style.borderColor = h.visible === false ? 'var(--color-success)' : 'var(--color-error)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = h.visible === false ? 'var(--color-text-faint)' : 'var(--color-text-muted)'
                        e.currentTarget.style.borderColor = 'var(--color-border)'
                      }}
                    >
                      {h.visible === false ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}

                  <button
                    onClick={() => setEditing(h)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '32px', height: '32px',
                      background: 'var(--color-surface-offset)', border: '1.5px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text-muted)',
                    }}
                  >
                    <Pencil size={13} />
                  </button>

                  <button
                    onClick={() => toggleHerramienta(h.id)}
                    title={h.activa ? 'Desactivar' : 'Activar'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                      padding: 'var(--space-2) var(--space-3)',
                      background: h.activa ? 'var(--color-success-highlight)' : 'var(--color-surface-offset)',
                      border: `1.5px solid ${h.activa ? 'var(--color-success)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      color: h.activa ? 'var(--color-success)' : 'var(--color-text-muted)',
                      fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-body)',
                      transition: 'all 150ms',
                    }}
                  >
                    {h.activa
                      ? <><ToggleRight size={15} /> Activa</>
                      : <><ToggleLeft size={15} /> Inactiva</>
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {editing && <HerramientaEditor herramienta={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
