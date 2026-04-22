/**
 * BlogSection.tsx
 * CRUD completo de artículos de blog.
 * Datos: localStorage ahora → Supabase en cloud (solo cambiar las acciones del store).
 */
import { useState } from 'react'
import { useBlogStore, type BlogPost, type BlogStatus } from '../../../store/blogStore'
import { ConfirmModal } from '../components/ConfirmModal'
import { Plus, Pencil, Trash2, Eye, EyeOff, FileText, Tag, Calendar, X } from 'lucide-react'

/* ── Utilidades ────────────────────────────────────────────────────────── */
function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
}

/* ── Editor modal ────────────────────────────────────────────────────────── */
interface EditorProps {
  post?: BlogPost
  onClose: () => void
}

function PostEditor({ post, onClose }: EditorProps) {
  const createPost = useBlogStore((s) => s.createPost)
  const updatePost = useBlogStore((s) => s.updatePost)

  const [titulo,    setTitulo]    = useState(post?.titulo    ?? '')
  const [slug,      setSlug]      = useState(post?.slug      ?? '')
  const [extracto,  setExtracto]  = useState(post?.extracto  ?? '')
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
      createPost({ titulo, slug, extracto, contenido, tags, status, publishedAt: status === 'published' ? new Date().toISOString() : null })
    }
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-4)',
    }}>
      <div style={{
        background: 'var(--color-bg)', border: '2px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)', boxShadow: '6px 6px 0px 0px var(--color-border)',
        width: '100%', maxWidth: '720px', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-5) var(--space-6)',
          borderBottom: '1px solid var(--color-divider)',
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)' }}>
            {post ? 'Editar artículo' : 'Nuevo artículo'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          <div className="input-group">
            <label className="input-label">Título *</label>
            <input className="input-v3" value={titulo} onChange={e => handleTituloChange(e.target.value)} placeholder="Cómo calcular el IVA correctamente..." />
          </div>

          <div className="input-group">
            <label className="input-label">Slug (URL)</label>
            <input className="input-v3" value={slug} onChange={e => setSlug(e.target.value)} placeholder="como-calcular-el-iva" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }} />
            <p className="input-hint">blog/{slug || 'tu-slug-aqui'}</p>
          </div>

          <div className="input-group">
            <label className="input-label">Extracto</label>
            <textarea className="textarea-v3" value={extracto} onChange={e => setExtracto(e.target.value)} placeholder="Resumen breve del artículo (aparece en listados)..." rows={2} style={{ minHeight: 'auto' }} />
          </div>

          <div className="input-group">
            <label className="input-label">Contenido (Markdown / HTML)</label>
            <textarea className="textarea-v3" value={contenido} onChange={e => setContenido(e.target.value)} placeholder="## Introducción&#10;&#10;El IVA (Impuesto sobre el Valor Añadido)..." style={{ minHeight: '200px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }} />
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
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)',
          padding: 'var(--space-4) var(--space-6)',
          borderTop: '1px solid var(--color-divider)',
        }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            {post ? 'Guardar cambios' : 'Crear artículo'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Tipo estado modal ───────────────────────────────────────────────────── */
type ModalTarget = { post: BlogPost; accion: 'visibilidad' | 'eliminar' } | null

/* ── BlogSection ─────────────────────────────────────────────────────────── */
export function BlogSection() {
  const posts       = useBlogStore((s) => s.posts)
  const deletePost  = useBlogStore((s) => s.deletePost)
  const publishPost = useBlogStore((s) => s.publishPost)
  const unpublish   = useBlogStore((s) => s.unpublishPost)

  const [editing,     setEditing]     = useState<BlogPost | null | 'new'>(null)
  const [filter,      setFilter]      = useState<'all' | BlogStatus>('all')
  const [modalTarget, setModalTarget] = useState<ModalTarget>(null)

  const filtered = posts.filter(p => filter === 'all' || p.status === filter)

  // ── Handlers confirmados ────────────────────────────────────────────
  const handleConfirm = () => {
    if (!modalTarget) return
    const { post, accion } = modalTarget
    if (accion === 'eliminar') {
      deletePost(post.id)
    } else {
      if (post.status === 'published') {
        unpublish(post.id)
      } else {
        publishPost(post.id)
      }
    }
    setModalTarget(null)
  }

  // ── Textos del modal ────────────────────────────────────────────────
  const getModalProps = (target: ModalTarget) => {
    if (!target) return { title: '', description: '', confirmLabel: '', confirmVariant: 'danger' as const }
    const { post, accion } = target
    if (accion === 'eliminar') {
      return {
        title:          `Eliminar "${post.titulo || 'Sin título'}"`,
        description:    'Esta acción es permanente. El artículo se eliminará y no podrá recuperarse.',
        confirmLabel:   'Sí, eliminar',
        confirmVariant: 'danger' as const,
      }
    }
    const publicado = post.status === 'published'
    return {
      title:          publicado ? `Despublicar "${post.titulo || 'Sin título'}"` : `Publicar "${post.titulo || 'Sin título'}"`,
      description:    publicado
        ? 'El artículo pasará a borrador y dejará de ser visible en el blog público.'
        : 'El artículo será visible en el blog público inmediatamente.',
      confirmLabel:   publicado ? 'Sí, despublicar' : 'Sí, publicar',
      confirmVariant: publicado ? 'warning' as const : 'success' as const,
    }
  }

  const modalProps = getModalProps(modalTarget)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>
            Blog
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            {posts.length} artículo{posts.length !== 1 ? 's' : ''} · {posts.filter(p => p.status === 'published').length} publicados
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
          <Plus size={14} /> Nuevo artículo
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {(['all', 'published', 'draft'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-full)',
              border: filter === f ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
              background: filter === f ? 'var(--color-primary-highlight)' : 'var(--color-surface)',
              color: filter === f ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            {{ all: 'Todos', published: 'Publicados', draft: 'Borradores' }[f]}
          </button>
        ))}
      </div>

      {/* Lista de posts */}
      {filtered.length === 0 ? (
        <div style={{
          padding: 'var(--space-16)', textAlign: 'center',
          background: 'var(--color-surface)', border: '2px dashed var(--color-border)',
          borderRadius: 'var(--radius-xl)',
        }}>
          <FileText size={28} style={{ color: 'var(--color-text-faint)', margin: '0 auto var(--space-4)' }} />
          <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
            {filter === 'all' ? 'Aún no has creado ningún artículo' : `No hay artículos en estado "${filter === 'published' ? 'publicado' : 'borrador'}"`}
          </p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-faint)', marginBottom: 'var(--space-5)' }}>
            Los artículos se guardan en localStorage ahora y estarán listos para conectar a Supabase al pasar a producción.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
            <Plus size={14} /> Crear primer artículo
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {filtered.map(post => (
            <div key={post.id} style={{
              background: 'var(--color-surface)',
              border: '2px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
              boxShadow: '3px 3px 0 var(--color-border)',
              display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)',
            }}>
              {/* Info */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  <span className={`badge ${post.status === 'published' ? 'badge-success' : 'badge-muted'}`}>
                    {post.status === 'published' ? 'Publicado' : 'Borrador'}
                  </span>
                  {post.tags.slice(0, 3).map(t => (
                    <span key={t} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontSize: '11px', color: 'var(--color-text-faint)',
                      background: 'var(--color-surface-offset)',
                      padding: '2px 8px', borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--color-border)',
                    }}>
                      <Tag size={9} />
                      {t}
                    </span>
                  ))}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                  {post.titulo || 'Sin título'}
                </h3>
                {post.extracto && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {post.extracto}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: '11px', color: 'var(--color-text-faint)' }}>
                  <Calendar size={10} />
                  {formatDate(post.updatedAt)}
                  <span style={{ marginLeft: 'var(--space-2)', fontFamily: 'var(--font-mono)' }}>
                    /blog/{post.slug}
                  </span>
                </div>
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>

                {/* Ojo: publicar/despublicar → abre ConfirmModal */}
                <button
                  title={post.status === 'published' ? 'Despublicar' : 'Publicar'}
                  onClick={() => setModalTarget({ post, accion: 'visibilidad' })}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '32px', height: '32px',
                    background: 'var(--color-surface-offset)', border: '1.5px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    color: post.status === 'published' ? 'var(--color-success)' : 'var(--color-text-faint)',
                    transition: 'color var(--transition-interactive), border-color var(--transition-interactive)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = post.status === 'published' ? 'var(--color-gold)' : 'var(--color-success)'
                    e.currentTarget.style.borderColor = post.status === 'published' ? 'var(--color-gold)' : 'var(--color-success)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = post.status === 'published' ? 'var(--color-success)' : 'var(--color-text-faint)'
                    e.currentTarget.style.borderColor = 'var(--color-border)'
                  }}
                >
                  {post.status === 'published' ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>

                {/* Editar */}
                <button
                  title="Editar"
                  onClick={() => setEditing(post)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '32px', height: '32px',
                    background: 'var(--color-surface-offset)', border: '1.5px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text-muted)',
                  }}
                >
                  <Pencil size={14} />
                </button>

                {/* Eliminar → abre ConfirmModal */}
                <button
                  title="Eliminar"
                  onClick={() => setModalTarget({ post, accion: 'eliminar' })}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '32px', height: '32px',
                    background: 'var(--color-surface-offset)', border: '1.5px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text-faint)',
                    transition: 'color var(--transition-interactive), border-color var(--transition-interactive)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-error)'; e.currentTarget.style.borderColor = 'var(--color-error)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-faint)'; e.currentTarget.style.borderColor = 'var(--color-border)' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal editor */}
      {editing && (
        <PostEditor
          key={editing === 'new' ? 'new' : editing.id}
          post={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Modal confirmar (visibilidad y eliminar) */}
      {modalTarget && (
        <ConfirmModal
          {...modalProps}
          onConfirm={handleConfirm}
          onCancel={() => setModalTarget(null)}
        />
      )}
    </div>
  )
}
