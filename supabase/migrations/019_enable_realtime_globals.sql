-- ============================================
-- Migración 018 — habilitar Realtime en herramientas y blog_posts
-- ============================================
-- Permite a los clientes (Home, /usuario, admin) recibir eventos
-- INSERT/UPDATE/DELETE por WebSocket y reflejar los cambios sin recargar.
-- REPLICA IDENTITY DEFAULT (PK) basta para los eventos que necesitamos.

ALTER PUBLICATION supabase_realtime
  ADD TABLE public.herramientas, public.blog_posts;

NOTIFY pgrst, 'reload schema';
