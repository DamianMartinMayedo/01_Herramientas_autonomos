/**
 * BlogSection.tsx
 * CRUD de artículos: filtros, lista, editor modal, confirmaciones.
 */
import { useMemo, useState } from 'react'
import { useBlogStore, type BlogPost, type BlogStatus } from '../../../store/blogStore'
import { ConfirmModal } from '../components/ConfirmModal'
import { PostEditor } from './blog/PostEditor'
import { deleteTexts, publishTexts, emptyConfirm } from '../utils/modalTexts'
import { Plus, Pencil, Trash2, Eye, EyeOff, FileText, Tag, Calendar } from 'lucide-react'

type ModalTarget = { post: BlogPost; accion: 'visibilidad' | 'eliminar' } | null
type Filter = 'all' | BlogStatus

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
}

export function BlogSection() {
  const posts       = useBlogStore((s) => s.posts)
  const deletePost  = useBlogStore((s) => s.deletePost)
  const publishPost = useBlogStore((s) => s.publishPost)
  const unpublish   = useBlogStore((s) => s.unpublishPost)

  const [editing,     setEditing]     = useState<BlogPost | null | 'new'>(null)
  const [filter,      setFilter]      = useState<Filter>('all')
  const [modalTarget, setModalTarget] = useState<ModalTarget>(null)

  const filtered = useMemo(
    () => posts.filter(p => filter === 'all' || p.status === filter),
    [posts, filter],
  )

  const handleConfirm = () => {
    if (!modalTarget) return
    const { post, accion } = modalTarget
    if (accion === 'eliminar') {
      deletePost(post.id)
    } else if (post.status === 'published') {
      unpublish(post.id)
    } else {
      publishPost(post.id)
    }
    setModalTarget(null)
  }

  const modalProps = modalTarget
    ? modalTarget.accion === 'eliminar'
      ? deleteTexts(modalTarget.post.titulo || 'Sin título')
      : publishTexts(modalTarget.post.titulo || 'Sin título', modalTarget.post.status === 'published')
    : emptyConfirm()

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all',       label: 'Todos' },
    { id: 'published', label: 'Publicados' },
    { id: 'draft',     label: 'Borradores' },
  ]

  return (
    <div className="section-stack">

      <div className="admin-section-header">
        <div>
          <h1 className="section-title">Blog</h1>
          <p className="section-sub">
            {posts.length} artículo{posts.length !== 1 ? 's' : ''} · {posts.filter(p => p.status === 'published').length} publicados
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
          <Plus size={14} /> Nuevo artículo
        </button>
      </div>

      <div className="flex gap-2">
        {FILTERS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`filter-pill${filter === id ? ' active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state empty-state--xl">
          <FileText size={28} className="empty-state-icon" />
          <p className="empty-state-title-strong">
            {filter === 'all'
              ? 'Aún no has creado ningún artículo'
              : `No hay artículos en estado "${filter === 'published' ? 'publicado' : 'borrador'}"`}
          </p>
          <p className="empty-state-text empty-state-spaced">
            Los artículos se guardan en localStorage ahora y estarán listos para conectar a Supabase al pasar a producción.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
            <Plus size={14} /> Crear primer artículo
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(post => {
            const publicado = post.status === 'published'
            return (
              <div key={post.id} className="card card-raised-sm post-card">

                <div className="post-card-body">
                  <div className="post-card-tags">
                    <span className={`badge ${publicado ? 'badge-success' : 'badge-muted'}`}>
                      {publicado ? 'Publicado' : 'Borrador'}
                    </span>
                    {post.tags.slice(0, 3).map(t => (
                      <span key={t} className="tag-tiny">
                        <Tag size={9} />{t}
                      </span>
                    ))}
                  </div>
                  <h3 className="post-card-title">{post.titulo || 'Sin título'}</h3>
                  {post.extracto && <p className="post-card-excerpt">{post.extracto}</p>}
                  <div className="post-card-meta">
                    <Calendar size={10} />
                    {formatDate(post.updatedAt)}
                    <span className="post-card-slug">/blog/{post.slug}</span>
                  </div>
                </div>

                <div className="post-card-actions">
                  <button
                    title={publicado ? 'Despublicar' : 'Publicar'}
                    onClick={() => setModalTarget({ post, accion: 'visibilidad' })}
                    className={`icon-btn ${publicado ? 'icon-btn--eye-on' : 'icon-btn--eye-off'}`}
                  >
                    {publicado ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button title="Editar" onClick={() => setEditing(post)} className="icon-btn icon-btn--primary">
                    <Pencil size={14} />
                  </button>
                  <button
                    title="Eliminar"
                    onClick={() => setModalTarget({ post, accion: 'eliminar' })}
                    className="icon-btn icon-btn--danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <PostEditor
        key={editing === 'new' ? 'new' : editing?.id ?? 'closed'}
        open={editing !== null}
        post={editing === 'new' || editing === null ? undefined : editing}
        onClose={() => setEditing(null)}
      />

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
