-- ============================================
-- Migración 017 — añade `updated_at` a profiles
-- ============================================
-- La tabla `profiles` arrastraba un trigger `profiles_updated_at` que asigna
-- NEW.updated_at = now() pero la columna nunca se creó. Cualquier UPDATE fallaba
-- con "record \"new\" has no field updated_at". Esta migración añade la columna
-- para que el trigger funcione y el frontend (useProfile.updateProfile) pueda
-- actualizar el plan sin error.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

NOTIFY pgrst, 'reload schema';
