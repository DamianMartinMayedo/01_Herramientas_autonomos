-- ============================================
-- MIGRACIÓN 010b: Reparación de contratos — columnas faltantes
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- ============================================

-- Añadir columnas que faltan (inofensivo si ya existen)
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS datos_json JSONB;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS numero TEXT;

-- Verificar que existen
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contratos' AND table_schema = 'public'
ORDER BY ordinal_position;
