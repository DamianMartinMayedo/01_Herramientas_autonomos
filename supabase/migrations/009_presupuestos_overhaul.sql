-- ============================================
-- MIGRACIÓN 009: Presupuestos — overhaul de esquema
-- Cambios:
--   1. numero pasa a nullable (borradores no tienen número asignado)
--   2. Actualizar estados: borrador | enviado | aprobado | convertido
--   3. Añadir columna factura_id (FK a facturas cuando se convierte)
-- Ejecutar en: Supabase Dashboard -> SQL Editor
-- ============================================

BEGIN;

-- 1) Hacer numero nullable (los borradores no tienen número)
ALTER TABLE public.presupuestos
  ALTER COLUMN numero DROP NOT NULL;

-- 2) Limpiar estados inválidos antes de cambiar el constraint
--    (aceptado → aprobado, rechazado/caducado → borrador como fallback)
UPDATE public.presupuestos SET estado = 'aprobado' WHERE estado = 'aceptado';
UPDATE public.presupuestos SET estado = 'borrador' WHERE estado IN ('rechazado', 'caducado');

-- 3) Actualizar constraint de estado
ALTER TABLE public.presupuestos
  DROP CONSTRAINT IF EXISTS presupuestos_estado_check;

ALTER TABLE public.presupuestos
  ADD CONSTRAINT presupuestos_estado_check
  CHECK (estado IN ('borrador', 'enviado', 'aprobado', 'convertido'));

-- 4) Añadir factura_id (nullable, se rellena al convertir a factura)
ALTER TABLE public.presupuestos
  ADD COLUMN IF NOT EXISTS factura_id UUID REFERENCES public.facturas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_presupuestos_factura
  ON public.presupuestos(factura_id)
  WHERE factura_id IS NOT NULL;

-- 5) Añadir fue_aprobado para mostrar doble estado cuando se convierte tras aprobación
ALTER TABLE public.presupuestos
  ADD COLUMN IF NOT EXISTS fue_aprobado BOOLEAN NOT NULL DEFAULT false;

COMMIT;
