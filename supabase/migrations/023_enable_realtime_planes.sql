-- ============================================
-- Migración 023 — habilitar Realtime en planes
-- ============================================
-- Permite al UpgradeModal del usuario reflejar cambios de precios/descuentos
-- hechos por el admin en tiempo real, sin que el usuario tenga que cerrar
-- y reabrir el modal.

ALTER PUBLICATION supabase_realtime ADD TABLE public.planes;

NOTIFY pgrst, 'reload schema';
