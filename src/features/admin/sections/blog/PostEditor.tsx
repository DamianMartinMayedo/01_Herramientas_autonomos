/**
 * PostEditor.tsx
 * Modal de creación/edición de artículos de blog. Persiste vía la edge
 * function admin-blog-posts.
 */
import { useState } from 'react'
import { AdminModal } from '../../components/AdminModal'
import { adminPost, adminPatch } from '../../hooks/useAdminFetch'
import { AlertTriangle } from 'lucide-react'
import type { BlogPost, BlogStatus } from '../../../../types/blog'

interface Props {
  open: boolean
  post?: BlogPost
  onClose: () => void
  onSaved: () => void
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function PostEditor({ open, post, onClose, onSaved }: Props) {
  const [titulo,    setTitulo]    = useState(post?.titulo ?? '')
  const [slug,      setSlug]      = useState(post?.slug ?? '')
  const [extracto,  setExtracto]  = useState(post?.extracto ?? '')
  const [contenido, setContenido] = useState(post?.contenido ?? '')
  const [tagsRaw,   setTagsRaw]   = useState(post?.tags.join(', ') ?? '')
  const [status,    setStatus]    = useState<BlogStatus>(post?.status ?? 'draft')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const handleTituloChange = (v: string) => {
    setTitulo(v)
    if (!post) setSlug(slugify(v))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
    const payload = {
      titulo, slug, extracto, contenido, tags, status,
      published_at: status === 'published' ? (post?.published_at ?? new Date().toISOString()) : null,
    }
    const res = post
      ? await adminPatch('/functions/v1/admin-blog-posts', { id: post.id, ...payload })
      : await adminPost('/functions/v1/admin-blog-posts', payload)
    setSaving(false)
    if (!res.ok) { setError(res.error ?? 'Error al guardar'); return }
    onSaved()
    onClose()
  }

  return (
    <AdminModal
      open={open}
      size="lg"
      title={post ? 'Editar artículo' : 'Nuevo artículo'}
      onClose={onClose}
      bodyGap="lg"
      closeDisabled={saving}
      footer={
        <>
          <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={() => { void handleSave() }} disabled={saving}>
            {saving ? 'Guardando…' : (post ? 'Guardar cambios' : 'Crear artículo')}
          </button>
        </>
      }
    >
      <div className="input-group">
        <label className="input-label">Título *</label>
        <input className="input-v3" value={titulo} onChange={e => handleTituloChange(e.target.value)} disabled={saving} placeholder="Cómo calcular el IVA correctamente..." />
      </div>

      <div className="input-group">
        <label className="input-label">Slug (URL)</label>
        <input
          className="input-v3 input-mono-sm"
          value={slug}
          onChange={e => setSlug(e.target.value)}
          disabled={saving}
          placeholder="como-calcular-el-iva"
        />
        <p className="input-hint">blog/{slug || 'tu-slug-aqui'}</p>
      </div>

      <div className="input-group">
        <label className="input-label">Extracto</label>
        <textarea
          className="textarea-v3"
          value={extracto}
          onChange={e => setExtracto(e.target.value)}
          placeholder="Resumen breve del artículo (aparece en listados)..."
          rows={2}
          disabled={saving}
          style={{ minHeight: 'auto' }}
        />
      </div>

      <div className="input-group">
        <label className="input-label">Contenido (Markdown / HTML)</label>
        <textarea
          className="textarea-v3 textarea-mono-md"
          value={contenido}
          onChange={e => setContenido(e.target.value)}
          placeholder="## Introducción&#10;&#10;El IVA (Impuesto sobre el Valor Añadido)..."
          disabled={saving}
        />
        <p className="input-hint">Soporta Markdown. La sección de blog de la web lo renderizará.</p>
      </div>

      <div className="form-row">
        <div className="input-group">
          <label className="input-label">Tags (separados por coma)</label>
          <input className="input-v3" value={tagsRaw} onChange={e => setTagsRaw(e.target.value)} disabled={saving} placeholder="IVA, autónomos, fiscalidad" />
        </div>
        <div className="input-group">
          <label className="input-label">Estado</label>
          <select className="select-v3" value={status} onChange={e => setStatus(e.target.value as BlogStatus)} disabled={saving}>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-box">
          <AlertTriangle size={15} className="error-box-icon" />
          <span>{error}</span>
        </div>
      )}
    </AdminModal>
  )
}
