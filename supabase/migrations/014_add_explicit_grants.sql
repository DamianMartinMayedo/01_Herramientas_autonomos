-- ============================================
-- Grants explícitos para todas las tablas del schema public
-- Requerido por Supabase a partir de Mayo 2026:
-- sin GRANT explícito, PostgREST devuelve error 42501.
-- ============================================

BEGIN;

-- Acceso al schema (idempotente en proyectos existentes, necesario en nuevos)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ─── profiles ─────────────────────────────────────────────
GRANT SELECT                             ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.profiles TO service_role;

-- ─── facturas ─────────────────────────────────────────────
GRANT SELECT                             ON public.facturas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.facturas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.facturas TO service_role;

-- ─── presupuestos ─────────────────────────────────────────
GRANT SELECT                             ON public.presupuestos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.presupuestos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.presupuestos TO service_role;

-- ─── albaranes ────────────────────────────────────────────
GRANT SELECT                             ON public.albaranes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.albaranes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.albaranes TO service_role;

-- ─── contratos ────────────────────────────────────────────
GRANT SELECT                             ON public.contratos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.contratos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.contratos TO service_role;

-- ─── ndas ─────────────────────────────────────────────────
GRANT SELECT                             ON public.ndas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.ndas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.ndas TO service_role;

-- ─── reclamaciones ────────────────────────────────────────
GRANT SELECT                             ON public.reclamaciones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.reclamaciones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.reclamaciones TO service_role;

-- ─── clientes_frecuentes ──────────────────────────────────
GRANT SELECT                             ON public.clientes_frecuentes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.clientes_frecuentes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.clientes_frecuentes TO service_role;

-- ─── document_sequences ───────────────────────────────────
GRANT SELECT                             ON public.document_sequences TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.document_sequences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.document_sequences TO service_role;

-- ─── empresa ──────────────────────────────────────────────
GRANT SELECT                             ON public.empresa TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.empresa TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE     ON public.empresa TO service_role;

COMMIT;

-- Los GRANTs son DDL implícito desde la perspectiva de PostgREST; recargar schema.
NOTIFY pgrst, 'reload schema';
