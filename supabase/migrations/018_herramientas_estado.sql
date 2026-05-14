-- ============================================
-- Migración 018 — unificar estado de herramientas
-- ============================================
-- Reemplaza los 3 booleans (activa, proximamente, mantenimiento)
-- por un único campo enum: 'active' | 'maintenance' | 'coming_soon'

BEGIN;

-- 1. Añadir columna estado
ALTER TABLE public.herramientas ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'active' CHECK (estado IN ('active','maintenance','coming_soon'));

-- 2. Migrar datos existentes (orden importa: proximamente primero, luego mantenimiento)
UPDATE public.herramientas SET estado = CASE
  WHEN proximamente = true THEN 'coming_soon'
  WHEN mantenimiento = true THEN 'maintenance'
  WHEN activa = true THEN 'active'
  ELSE 'maintenance'
END;

-- 3. Borrar columnas viejas
ALTER TABLE public.herramientas DROP COLUMN IF EXISTS activa;
ALTER TABLE public.herramientas DROP COLUMN IF EXISTS proximamente;
ALTER TABLE public.herramientas DROP COLUMN IF EXISTS mantenimiento;

COMMIT;

NOTIFY pgrst, 'reload schema';
