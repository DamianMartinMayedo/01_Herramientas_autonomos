/**
 * PostEditor.tsx
 * Modal de creación/edición de artículos de blog. Usa AdminModal.
 */
import { useState } from 'react'
import { useBlogStore, type BlogPost, type BlogStatus } from '../../../../store/blogStore'
import { AdminModal } from '../../components/AdminModal'

interface Props {
  open: boolean
  post?: BlogPost
  onClose: () => void
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function PostEditor({ open, post, onClose }: Props) {
  const createPost = useBlogStore((s) => s.createPost)
  const updatePost = useBlogStore((s) => s.updatePost)

  const [titulo,    setTitulo]    = useState(post?.titulo ?? '')
  const [slug,      setSlug]      = useState(post?.slug ?? '')
  const [extracto,  setExtracto]  = useState(post?.extracto ?? '')
  const [contenido, setContenido] = useState(post?.contenido ?? '')
  const [tagsRaw,   setTagsRaw]   = useState(post?.tags.join(', ') ?? '')
  const [status,    setStatus]    = useState<BlogStatus>(post?.status ?? 'draft')

  const handleTituloChange = (v: string) => {
    setTitulo(v)
    if (!post) setSlug(slugify(v))
  }

  const handleSave = () => {
    const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
    if (post) {
      updatePost(post.id, { titulo, slug, extracto, contenido, tags, status })
    } else {
      createPost({
        titulo, slug, extracto, contenido, tags, status,
        publishedAt: status === 'published' ? new Date().toISOString() : null,
      })
    }
    onClose()
  }

  return (
    <AdminModal
      open={open}
      size="lg"
      title={post ? 'Editar artículo' : 'Nuevo artículo'}
      onClose={onClose}
      bodyGap="lg"
      footer={
        <>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            {post ? 'Guardar cambios' : 'Crear artículo'}
          </button>
        </>
      }
    >
      <div className="input-group">
        <label className="input-label">Título *</label>
        <input className="input-v3" value={titulo} onChange={e => handleTituloChange(e.target.value)} placeholder="Cómo calcular el IVA correctamente..." />
      </div>

      <div className="input-group">
        <label className="input-label">Slug (URL)</label>
        <input
          className="input-v3 input-mono-sm"
          value={slug}
          onChange={e => setSlug(e.target.value)}
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
        />
        <p className="input-hint">Soporta Markdown. La sección de blog de la web lo renderizará.</p>
      </div>

      <div className="form-row">
        <div className="input-group">
          <label className="input-label">Tags (separados por coma)</label>
          <input className="input-v3" value={tagsRaw} onChange={e => setTagsRaw(e.target.value)} placeholder="IVA, autónomos, fiscalidad" />
        </div>
        <div className="input-group">
          <label className="input-label">Estado</label>
          <select className="select-v3" value={status} onChange={e => setStatus(e.target.value as BlogStatus)}>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
          </select>
        </div>
      </div>
    </AdminModal>
  )
}
