-- ============================================
-- MIGRACIÓN 005: Tabla empresa
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.empresa (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL DEFAULT '',
  nif        TEXT NOT NULL DEFAULT '',
  email      TEXT NOT NULL DEFAULT '',
  direccion  TEXT NOT NULL DEFAULT '',
  cp         TEXT NOT NULL DEFAULT '',
  ciudad     TEXT NOT NULL DEFAULT '',
  provincia  TEXT NOT NULL DEFAULT '',
  telefono   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.empresa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "empresa_select_own"
  ON public.empresa FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "empresa_insert_own"
  ON public.empresa FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "empresa_update_own"
  ON public.empresa FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'empresa_updated_at') THEN
      CREATE TRIGGER empresa_updated_at
        BEFORE UPDATE ON public.empresa
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
  END IF;
END $$;
