-- ============================================
-- MIGRACIÓN 012b: Reparación de NDAs — columnas faltantes
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================

-- Añadir columnas que faltan (inofensivo si ya existen)
ALTER TABLE public.ndas ADD COLUMN IF NOT EXISTS datos_json JSONB;
ALTER TABLE public.ndas ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE public.ndas ADD COLUMN IF NOT EXISTS numero TEXT;

-- Verificar que existen
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'ndas' AND table_schema = 'public'
ORDER BY ordinal_position;
