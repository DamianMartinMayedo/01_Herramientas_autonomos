/**
 * BlogPost — tipo del artículo de blog.
 * Snake_case alineado con public.blog_posts en Supabase para minimizar mapping.
 */
export type BlogStatus = 'draft' | 'published'

export interface BlogPost {
  id: string
  titulo: string
  slug: string
  extracto: string
  contenido: string
  tags: string[]
  status: BlogStatus
  published_at: string | null
  created_at: string
  updated_at: string
}

/** Payload aceptado por la edge function admin-blog-posts para create/update. */
export type BlogPostInput = Partial<Pick<
  BlogPost,
  'titulo' | 'slug' | 'extracto' | 'contenido' | 'tags' | 'status' | 'published_at'
>>
