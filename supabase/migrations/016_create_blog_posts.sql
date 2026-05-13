-- ============================================
-- Migración 016 — tabla global `blog_posts`
-- ============================================
-- Mueve los artículos del Zustand+localStorage a Supabase.
-- Lectura pública filtrada a `status='published'`; drafts sólo visibles vía
-- edge function con service_role.

BEGIN;

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo        TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  extracto      TEXT NOT NULL DEFAULT '',
  contenido     TEXT NOT NULL DEFAULT '',
  tags          TEXT[] NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Lectura pública sólo de publicados (drafts quedan ocultos a anon/authenticated).
CREATE POLICY "blog_posts_public_read_published" ON public.blog_posts
  FOR SELECT USING (status = 'published');

GRANT SELECT                         ON public.blog_posts TO anon;
GRANT SELECT                         ON public.blog_posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO service_role;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON public.blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);

COMMIT;

NOTIFY pgrst, 'reload schema';
