-- ============================================
-- Migración 020 — añade `display_name` a profiles
-- ============================================
-- La migración 001 definía `display_name` en profiles pero la columna nunca
-- llegó a crearse en producción. Cualquier SELECT/UPDATE que lo referencie
-- falla con "column profiles.display_name does not exist".
-- Esta migración añade la columna para alinear el schema real con la migración
-- original y con el tipo TypeScript `Profile.display_name`.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT;

NOTIFY pgrst, 'reload schema';
