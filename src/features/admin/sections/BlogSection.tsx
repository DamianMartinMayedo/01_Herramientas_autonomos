/**
 * BlogSection.tsx
 * CRUD de artículos del blog. Lee y escribe vía admin-blog-posts edge function.
 * Si la tabla está vacía y el navegador tiene un blogStore en localStorage,
 * ofrece importar los posts existentes con un click.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAdminFetch, adminPatch, adminDelete, adminPost } from '../hooks/useAdminFetch'
import { ConfirmModal } from '../components/ConfirmModal'
import { PostEditor } from './blog/PostEditor'
import { deleteTexts, publishTexts, emptyConfirm } from '../utils/modalTexts'
import { Plus, FileText, Upload, Loader2, MoreVertical, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import type { BlogPost, BlogStatus } from '../../../types/blog'

type ModalTarget = { post: BlogPost; accion: 'visibilidad' | 'eliminar' } | null
type Filter = 'all' | BlogStatus
interface ApiPayload { posts: BlogPost[] }

const BLOG_LOCALSTORAGE_KEY = 'ha-blog'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(iso))
}

/** Lee los posts persistidos por el blogStore antiguo (localStorage). */
function readLocalStoragePosts(): Array<Record<string, unknown>> {
  try {
    const raw = localStorage.getItem(BLOG_LOCALSTORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as { state?: { posts?: unknown[] } }
    const posts = parsed.state?.posts ?? []
    if (!Array.isArray(posts)) return []
    // Mapea camelCase del store antiguo a snake_case del schema cloud.
    return posts
      .filter((p): p is Record<string, unknown> => typeof p === 'object' && p !== null)
      .map(p => ({
        titulo:       p.titulo,
        slug:         p.slug,
        extracto:     p.extracto,
        contenido:    p.contenido,
        tags:         Array.isArray(p.tags) ? p.tags : [],
        status:       p.status,
        published_at: p.publishedAt ?? null,
      }))
  } catch {
    return []
  }
}

export function BlogSection() {
  const { data, loading, error, refetch } = useAdminFetch<BlogPost[]>(
    '/functions/v1/admin-blog-posts',
    { transform: (raw) => (raw as ApiPayload).posts ?? [] },
  )

  const [editing,     setEditing]     = useState<BlogPost | null | 'new'>(null)
  const [filter,      setFilter]      = useState<Filter>('all')
  const [modalTarget, setModalTarget] = useState<ModalTarget>(null)
  const [importing,   setImporting]   = useState(false)
  const [importMsg,   setImportMsg]   = useState<string | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null)
  const dropdownMenuRef = useRef<HTMLDivElement | null>(null)

  const closeDropdown = () => { setOpenDropdownId(null); setDropdownPos(null) }

  const toggleDropdown = (e: React.MouseEvent, id: string) => {
    if (openDropdownId === id) { closeDropdown(); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setDropdownPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    setOpenDropdownId(id)
  }

  useLayoutEffect(() => {
    if (!openDropdownId || !dropdownPos) return
    const menu = dropdownMenuRef.current
    if (!menu) return
    const menuH = menu.offsetHeight
    const vh = window.innerHeight
    const MARGIN = 8
    const top = dropdownPos.top
    if (top === undefined) return
    if (top + menuH > vh - MARGIN) {
      const btnTop = top - 4
      if (btnTop - menuH > MARGIN) {
        setDropdownPos(prev => prev ? { bottom: vh - btnTop, right: prev.right } : prev)
      }
    }
  }, [openDropdownId, dropdownPos])

  useEffect(() => {
    if (!openDropdownId) return
    const onChange = () => closeDropdown()
    const onClickOutside = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement
      if (dropdownMenuRef.current?.contains(target)) return
      if (target.closest('[data-dropdown-trigger]')) return
      closeDropdown()
    }
    window.addEventListener('scroll', onChange, true)
    window.addEventListener('resize', onChange)
    window.addEventListener('mousedown', onClickOutside)
    return () => {
      window.removeEventListener('scroll', onChange, true)
      window.removeEventListener('resize', onChange)
      window.removeEventListener('mousedown', onClickOutside)
    }
  }, [openDropdownId])

  const posts = useMemo(() => data ?? [], [data])

  const filtered = useMemo(
    () => posts.filter(p => filter === 'all' || p.status === filter),
    [posts, filter],
  )

  const localStoragePosts = useMemo(
    () => (posts.length === 0 && !loading ? readLocalStoragePosts() : []),
    [posts, loading],
  )

  const handleImport = async () => {
    setImporting(true)
    setImportMsg(null)
    const res = await adminPost<{ imported: number }>(
      '/functions/v1/admin-blog-posts/import',
      { posts: localStoragePosts },
    )
    setImporting(false)
    if (!res.ok) { setImportMsg(res.error ?? 'Error al importar'); return }
    setImportMsg(`Se importaron ${res.data?.imported ?? 0} artículos`)
    await refetch()
  }

  const handleConfirm = async () => {
    if (!modalTarget) return
    const { post, accion } = modalTarget
    setModalTarget(null)
    if (accion === 'eliminar') {
      const res = await adminDelete(`/functions/v1/admin-blog-posts?id=${encodeURIComponent(post.id)}`)
      if (!res.ok) { alert(res.error ?? 'Error al borrar'); return }
    } else {
      const nuevoStatus: BlogStatus = post.status === 'published' ? 'draft' : 'published'
      const res = await adminPatch('/functions/v1/admin-blog-posts', {
        id: post.id,
        status: nuevoStatus,
        published_at: nuevoStatus === 'published' ? new Date().toISOString() : null,
      })
      if (!res.ok) { alert(res.error ?? 'Error al cambiar estado'); return }
    }
    await refetch()
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

  if (loading) {
    return (
      <div className="section-stack">
        <div>
          <h1 className="section-title">Blog</h1>
          <p className="section-sub">Cargando artículos…</p>
        </div>
        <div className="empty-state">
          <Loader2 size={20} className="spin empty-state-icon text-primary" />
          <p className="empty-state-text">Obteniendo artículos…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="section-stack">
        <div>
          <h1 className="section-title">Blog</h1>
          <p className="section-sub">No se pudo cargar el listado</p>
        </div>
        <div className="error-box"><span>{error}</span></div>
      </div>
    )
  }

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

      {posts.length === 0 && localStoragePosts.length > 0 && (
        <div className="admin-info-box flex items-center gap-3">
          <Upload size={18} className="text-primary shrink-0" />
          <div className="flex-1">
            <strong className="admin-info-box-strong">Importar borradores antiguos:</strong>{' '}
            tienes {localStoragePosts.length} artículo{localStoragePosts.length !== 1 ? 's' : ''} guardado{localStoragePosts.length !== 1 ? 's' : ''} en localStorage del navegador. Pulsa abajo para subirlos a Supabase.
            {importMsg && <p className="admin-modal-hint" style={{ marginTop: 'var(--space-2)' }}>{importMsg}</p>}
          </div>
          <button
            className="btn btn-primary btn-sm shrink-0"
            onClick={() => { void handleImport() }}
            disabled={importing}
          >
            {importing ? <Loader2 size={14} className="spin" /> : <Upload size={14} />}
            {importing ? 'Importando…' : 'Importar'}
          </button>
        </div>
      )}

      {posts.length > 0 && (
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
      )}

      {filtered.length === 0 ? (
        <div className="empty-state empty-state--xl">
          <FileText size={28} className="empty-state-icon" />
          <p className="empty-state-title-strong">
            {filter === 'all' || posts.length === 0
              ? 'Aún no hay artículos en Supabase'
              : `No hay artículos en estado "${filter === 'published' ? 'publicado' : 'borrador'}"`}
          </p>
          <p className="empty-state-text empty-state-spaced">
            Crea tu primer artículo o impórtalo desde localStorage si tienes borradores.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>
            <Plus size={14} /> Crear primer artículo
          </button>
        </div>
      ) : (
        <div className="card card-no-pad">
          <table className="data-table">
            <thead>
              <tr className="data-thead-row">
                <th className="data-th">Título</th>
                <th className="data-th">Estado</th>
                <th className="data-th">Tags</th>
                <th className="data-th">Fecha</th>
                <th className="data-th-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(post => {
                const publicado = post.status === 'published'
                return (
                  <tr key={post.id} className="data-tr">
                    <td className="data-td">
                      <span className="data-td--bold">{post.titulo || 'Sin título'}</span>
                    </td>
                    <td className="data-td">
                      <span className={`badge ${publicado ? 'badge-success' : 'badge-muted'}`}>
                        {publicado ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td className="data-td data-td--muted">
                      {post.tags.length > 0 ? post.tags.join(', ') : '—'}
                    </td>
                    <td className="data-td data-td--muted">
                      {formatDate(post.updated_at)}
                    </td>
                    <td className="data-td-right">
                      <div className="dropdown-wrap">
                        <button
                          className="icon-btn"
                          title="Opciones"
                          data-dropdown-trigger
                          onClick={e => toggleDropdown(e, post.id)}
                        >
                          <MoreVertical size={14} />
                        </button>
                        {openDropdownId === post.id && dropdownPos && createPortal(
                          <div
                            ref={dropdownMenuRef}
                            className="dropdown-menu"
                            style={{ position: 'fixed', top: dropdownPos.top ?? 'auto', bottom: dropdownPos.bottom ?? 'auto', right: dropdownPos.right, margin: 0 }}
                          >
                            <button className="dropdown-item" onClick={() => { closeDropdown(); setEditing(post) }}>
                              <Pencil size={14} /> Editar
                            </button>
                            <button className="dropdown-item" onClick={() => { closeDropdown(); setModalTarget({ post, accion: 'visibilidad' }) }}>
                              {publicado ? <EyeOff size={14} /> : <Eye size={14} />} {publicado ? 'Despublicar' : 'Publicar'}
                            </button>
                            <div className="dropdown-divider" />
                            <button className="dropdown-item dropdown-item--danger" onClick={() => { closeDropdown(); setModalTarget({ post, accion: 'eliminar' }) }}>
                              <Trash2 size={14} /> Eliminar
                            </button>
                          </div>,
                          document.body,
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <PostEditor
        key={editing === 'new' ? 'new' : editing?.id ?? 'closed'}
        open={editing !== null}
        post={editing === 'new' || editing === null ? undefined : editing}
        onClose={() => setEditing(null)}
        onSaved={() => { void refetch() }}
      />

      {modalTarget && (
        <ConfirmModal
          {...modalProps}
          onConfirm={() => { void handleConfirm() }}
          onCancel={() => setModalTarget(null)}
        />
      )}
    </div>
  )
}
