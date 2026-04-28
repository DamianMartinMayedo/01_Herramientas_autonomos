-- ============================================
-- MIGRACIÓN 007: Limpiar número en borradores
-- Los borradores no deben tener número asignado.
-- El número solo se asigna al emitir la factura.
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================
UPDATE public.facturas
SET datos_json = jsonb_set(datos_json, '{numero}', '""'::jsonb)
WHERE estado = 'borrador'
  AND (datos_json->>'numero') <> '';
