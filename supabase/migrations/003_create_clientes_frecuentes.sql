-- ============================================
-- MIGRACION 003: Clientes frecuentes
-- ============================================

CREATE TABLE IF NOT EXISTS public.clientes_frecuentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  nif TEXT NOT NULL DEFAULT '',
  direccion TEXT NOT NULL DEFAULT '',
  ciudad TEXT NOT NULL DEFAULT '',
  cp TEXT NOT NULL DEFAULT '',
  provincia TEXT NOT NULL DEFAULT '',
  email TEXT,
  telefono TEXT,
  pais TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clientes_frecuentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clientes_frecuentes_own"
  ON public.clientes_frecuentes
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_clientes_frecuentes_user
  ON public.clientes_frecuentes(user_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'set_updated_at'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger
      WHERE tgname = 'clientes_frecuentes_updated_at'
    ) THEN
      CREATE TRIGGER clientes_frecuentes_updated_at
        BEFORE UPDATE ON public.clientes_frecuentes
        FOR EACH ROW
        EXECUTE FUNCTION public.set_updated_at();
    END IF;
  END IF;
END $$;
