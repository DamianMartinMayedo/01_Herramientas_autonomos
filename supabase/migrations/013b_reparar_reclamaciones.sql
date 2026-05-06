-- ============================================
-- MIGRACIÓN 013b: Reparación de reclamaciones — columnas faltantes
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================

-- Añadir columnas que faltan (inofensivo si ya existen)
ALTER TABLE public.reclamaciones ADD COLUMN IF NOT EXISTS datos_json JSONB;
ALTER TABLE public.reclamaciones ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE public.reclamaciones ADD COLUMN IF NOT EXISTS numero TEXT;

-- Verificar que existen
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'reclamaciones' AND table_schema = 'public'
ORDER BY ordinal_position;
